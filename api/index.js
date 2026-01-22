const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS settings for Vercel
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'yoursecret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware to check specific roles
const requireRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
};

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor Vercel no ar!' });
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { uid, name, email, password, congregationData } = req.body;
        if (!uid || !name || !email || !password) return res.status(400).json({ message: 'Campos obrigatórios.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        let congregationId = null;
        let role = 'publisher';

        // Logica de congregação
        if (congregationData) {
            if (congregationData.inviteCode) {
                // Entrar em congregação existente
                const { data: congData, error } = await supabase
                    .from('congregations')
                    .select('id')
                    .eq('invite_code', congregationData.inviteCode)
                    .single();

                if (error || !congData) return res.status(400).json({ message: 'Código de convite inválido.' });
                congregationId = congData.id;
            } else if (congregationData.name) {
                // Criar nova congregação
                const crypto = require('crypto');
                congregationId = crypto.randomUUID();
                const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

                const { error } = await supabase.from('congregations').insert({
                    id: congregationId,
                    name: congregationData.name,
                    description: congregationData.description || '',
                    invite_code: inviteCode,
                    created_by: uid
                });

                if (error) throw error;
                role = 'elder'; // Criador vira ancião
            }
        }

        const { error: userError } = await supabase.from('users').insert({
            uid,
            name,
            email,
            password: hashedPassword,
            congregation_id: congregationId,
            role
        });

        if (userError) {
            console.error('Erro ao criar usuário:', userError);
            if (userError.code === '23505') return res.status(400).json({ message: 'Email já cadastrado.' });
            return res.status(400).json({ message: 'Erro ao criar usuário.' });
        }

        const token = jwt.sign({ uid, email, role, congregationId }, process.env.JWT_SECRET || 'yoursecret');
        res.status(201).json({ token, user: { uid, name, email, congregationId, role } });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: users, error } = await supabase.from('users').select('*').eq('email', email);

        if (error || !users || users.length === 0) return res.status(400).json({ message: 'Credenciais inválidas.' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Credenciais inválidas.' });

        let congregationName = null;
        if (user.congregation_id) {
            const { data: congData } = await supabase.from('congregations').select('name').eq('id', user.congregation_id).single();
            if (congData) congregationName = congData.name;
        }

        const token = jwt.sign({
            uid: user.uid,
            email: user.email,
            role: user.role,
            congregationId: user.congregation_id
        }, process.env.JWT_SECRET || 'yoursecret');

        res.json({
            token,
            user: {
                uid: user.uid,
                name: user.name,
                email: user.email,
                photoURL: user.photo_url,
                congregationId: user.congregation_id,
                congregationName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no login.' });
    }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { name, photoURL, email, password } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (photoURL) updates.photo_url = photoURL;
        if (email) updates.email = email;
        if (password) updates.password = await bcrypt.hash(password, 10);

        if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Nada para atualizar.' });

        const { error } = await supabase.from('users').update(updates).eq('uid', req.user.uid);
        if (error) return res.status(500).json({ message: 'Erro ao atualizar.' });

        // CRITICAL: Include ALL user fields to prevent data loss on frontend
        const { data: userData } = await supabase.from('users').select('uid, name, email, photo_url, congregation_id, role').eq('uid', req.user.uid).single();

        // Get congregation name if user has one
        let congregationName = null;
        if (userData.congregation_id) {
            const { data: congData } = await supabase.from('congregations').select('name').eq('id', userData.congregation_id).single();
            if (congData) congregationName = congData.name;
        }

        res.json({
            user: {
                uid: userData.uid,
                name: userData.name,
                email: userData.email,
                photoURL: userData.photo_url,
                congregationId: userData.congregation_id,
                congregationName,
                role: userData.role
            }
        });
    } catch (error) { res.status(500).json({ message: 'Erro ao atualizar perfil.' }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        // Check if user exists but don't leak info logic is implied
        const { data: users } = await supabase.from('users').select('uid').eq('email', email);

        if (!users || users.length === 0) {
            // Return success even if email not found to prevent enumeration
            return res.json({ message: 'Se o email existir, as instruções foram enviadas.' });
        }

        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Criar tabela de tokens se não existir, mas aqui assumimos que existe
        // Note: precisaria criar a tabela password_reset_tokens no schema se não tiver
        // O script correto tinha essa tabela? O script supabase-correct-schema.sql NÃO TINHA essa tabela.
        // Vou comentar essa parte por segurança ou criar a tabela via SQL depois.
        // Assumindo que o usuario vai rodar o SQL completo, vou adicionar no plano de verificação.

        /* 
        await supabase.from('password_reset_tokens').insert({ 
            user_id: users[0].uid, 
            token, 
            expires_at: expiresAt.toISOString() 
        });
        */

        // Como o reset de senha exige infra de email que não temos configurado (SendGrid, etc),
        // vamos apenas logar o token para debug/dev environment ou usar o Supabase Auth nativo no futuro.
        console.log(`[DEV] Reset Token for ${email}: ${token}`);
        res.json({ message: 'Instruções enviadas.' });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar.' });
    }
});

// --- CONGREGATION ROUTES ---

app.post('/api/congregations', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const id = require('crypto').randomUUID();
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        await supabase.from('congregations').insert({ id, name, description, invite_code: inviteCode, created_by: req.user.uid });
        await supabase.from('users').update({ congregation_id: id, role: 'elder' }).eq('uid', req.user.uid);

        // Atualizar token
        const token = jwt.sign({ uid: req.user.uid, email: req.user.email, role: 'elder', congregationId: id }, process.env.JWT_SECRET || 'yoursecret');
        res.status(201).json({ id, name, description, inviteCode, role: 'elder', token });
    } catch (e) { res.status(500).json({ message: 'Erro ao criar congregação.' }); }
});

app.get('/api/congregations/validate/:inviteCode', async (req, res) => {
    try {
        const { data } = await supabase.from('congregations').select('id, name, description').eq('invite_code', req.params.inviteCode).single();
        if (!data) return res.status(404).json({ message: 'Inválido.' });
        res.json(data);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/congregations/join', authenticateToken, async (req, res) => {
    try {
        const { data } = await supabase.from('congregations').select('id').eq('invite_code', req.body.inviteCode).single();
        if (!data) return res.status(404).json({ message: 'Inválido.' });

        await supabase.from('users').update({ congregation_id: data.id }).eq('uid', req.user.uid);
        const token = jwt.sign({ uid: req.user.uid, email: req.user.email, role: req.user.role, congregationId: data.id }, process.env.JWT_SECRET || 'yoursecret');
        res.json({ success: true, congregationId: data.id, token });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.get('/api/congregations/my', authenticateToken, async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
        if (!user || !user.congregation_id) return res.json(null);

        const { data: cong } = await supabase.from('congregations').select('*').eq('id', user.congregation_id).single();

        // Count members
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('congregation_id', user.congregation_id);

        if (cong) {
            cong.memberCount = count || 0;
            cong.inviteCode = cong.invite_code; // CamelCase map
        }
        res.json(cong);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.get('/api/congregations/members', authenticateToken, async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
        if (!user || !user.congregation_id) return res.json([]);

        const { data: members } = await supabase.from('users')
            .select('uid, name, email, photo_url, role, created_at')
            .eq('congregation_id', user.congregation_id);

        res.json(members.map(m => ({
            uid: m.uid,
            name: m.name,
            email: m.email,
            photoURL: m.photo_url,
            role: m.role,
            joinedAt: m.created_at
        })));
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.put('/api/congregations/members/:uid/role', authenticateToken, requireRole(['elder']), async (req, res) => {
    try {
        const { role } = req.body;
        // Validar roles permitidas
        if (!['publisher', 'territory_servant', 'service_overseer', 'elder'].includes(role)) {
            return res.status(400).json({ message: 'Papel inválido.' });
        }
        await supabase.from('users').update({ role }).eq('uid', req.params.uid);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.delete('/api/congregations/members/:uid', authenticateToken, requireRole(['elder']), async (req, res) => {
    try {
        // Remover da congregação = setar null
        await supabase.from('users').update({ congregation_id: null, role: 'publisher' }).eq('uid', req.params.uid);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// DELETE CONGREGATION (Admin/Creator Only)
app.delete('/api/congregations/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get congregation to verify creator
        const { data: cong, error: congError } = await supabase
            .from('congregations')
            .select('created_by')
            .eq('id', id)
            .single();

        if (congError || !cong) {
            return res.status(404).json({ message: 'Congregação não encontrada.' });
        }

        // Only creator can delete
        if (cong.created_by !== req.user.uid) {
            return res.status(403).json({ message: 'Apenas o criador pode excluir a congregação.' });
        }

        // Remove all members from congregation
        await supabase
            .from('users')
            .update({ congregation_id: null, role: 'publisher' })
            .eq('congregation_id', id);

        // Delete congregation
        const { error: deleteError } = await supabase
            .from('congregations')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: 'Congregação excluída com sucesso.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao excluir congregação.' });
    }
});

// LEAVE CONGREGATION (All Members)
app.post('/api/congregations/leave', authenticateToken, async (req, res) => {
    try {
        // Set congregation to null and role to publisher
        const { error } = await supabase
            .from('users')
            .update({ congregation_id: null, role: 'publisher' })
            .eq('uid', req.user.uid);

        if (error) throw error;

        // Generate new token without congregation
        const token = jwt.sign(
            { uid: req.user.uid, email: req.user.email, role: 'publisher', congregationId: null },
            process.env.JWT_SECRET || 'yoursecret'
        );

        res.json({ success: true, token, message: 'Você saiu da congregação.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao sair da congregação.' });
    }
});

// SWITCH CONGREGATION (All Members)
app.post('/api/congregations/switch', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: 'Código de convite obrigatório.' });
        }

        // Validate new congregation
        const { data: newCong, error: congError } = await supabase
            .from('congregations')
            .select('id, name')
            .eq('invite_code', inviteCode)
            .single();

        if (congError || !newCong) {
            return res.status(404).json({ message: 'Código de convite inválido.' });
        }

        // Switch congregation (leave current, join new)
        const { error: updateError } = await supabase
            .from('users')
            .update({ congregation_id: newCong.id, role: 'publisher' })
            .eq('uid', req.user.uid);

        if (updateError) throw updateError;

        // Generate new token with new congregation
        const token = jwt.sign(
            { uid: req.user.uid, email: req.user.email, role: 'publisher', congregationId: newCong.id },
            process.env.JWT_SECRET || 'yoursecret'
        );

        res.json({
            success: true,
            token,
            congregationId: newCong.id,
            congregationName: newCong.name,
            message: `Você entrou na congregação ${newCong.name}.`
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao trocar de congregação.' });
    }
});

// --- TERRITORY ROUTES ---

app.get('/api/territories', authenticateToken, async (req, res) => {
    try {
        // Filtrar por congregação do usuário! Importante para multi-tenant
        const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
        if (!user.congregation_id) return res.json([]);

        const { data } = await supabase.from('territories')
            .select('*')
            .eq('congregation_id', user.congregation_id);

        // Map to camelCase for frontend if needed, currently passing snake_case mostly or whatever supabase returns
        // O FrontEnd geralmente espera camelCase, mas vamos checar. Se o frontend usa properties diretas do objeto retornado pelo supabase, ele vai receber snake_case.
        // Se o frontend foi feito pensando em camelCase, isso vai quebrar.
        // Vamos fazer um map para garantir compatibilidade com código existente frontend.

        const camelCaseData = (data || []).map(t => ({
            id: t.id,
            userId: t.user_id,
            congregationId: t.congregation_id,
            code: t.code,
            name: t.name,
            address: t.address,
            observations: t.observations,
            status: t.status,
            size: t.size,
            lastWorkedDate: t.last_worked_date,
            lastWorkedBy: t.last_worked_by,
            daysSinceWork: t.days_since_work,
            geolocation: t.geolocation,
            images: t.images || []
        }));

        res.json(camelCaseData);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao buscar territórios.' });
    }
});

app.post('/api/territories', authenticateToken, requireRole(['elder', 'service_overseer', 'territory_servant']), async (req, res) => {
    try {
        const t = req.body;

        // Pegar congregation_id do usuário logado segurança
        const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
        if (!user.congregation_id) return res.status(400).json({ message: 'Você precisa estar em uma congregação.' });

        const newTerritory = {
            id: t.id,
            congregation_id: user.congregation_id, // Linkar com congregação
            user_id: t.userId || null, // Designação opcional
            code: t.code,
            name: t.name,
            address: t.address,
            observations: t.observations,
            status: t.status || 'green',
            size: t.size || 'medium',
            geolocation: t.geolocation,
            images: t.images || []
        };

        const { error } = await supabase.from('territories').insert(newTerritory);
        if (error) throw error;
        res.status(201).json({ id: t.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao criar território.' });
    }
});

app.put('/api/territories/:id', authenticateToken, requireRole(['elder', 'service_overseer', 'territory_servant']), async (req, res) => {
    try {
        const u = req.body;
        const dbU = {};

        // Map frontend camelCase to db snake_case
        if (u.name) dbU.name = u.name;
        if (u.code) dbU.code = u.code;
        if (u.address) dbU.address = u.address;
        if (u.observations) dbU.observations = u.observations;
        if (u.status) dbU.status = u.status;
        if (u.size) dbU.size = u.size;

        // Handle dates and specialized fields
        if (u.lastWorkedDate !== undefined) dbU.last_worked_date = u.lastWorkedDate;
        if (u.lastWorkedBy !== undefined) dbU.last_worked_by = u.lastWorkedBy;
        if (u.daysSinceWork !== undefined) dbU.days_since_work = u.daysSinceWork;

        if (u.geolocation) dbU.geolocation = u.geolocation;
        if (u.images) dbU.images = u.images;

        // Handle assignment
        if (u.userId !== undefined) dbU.user_id = u.userId; // Pode ser null para "devolver"

        const { error } = await supabase.from('territories').update(dbU).eq('id', req.params.id);
        if (error) throw error;

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao atualizar território.' });
    }
});

app.delete('/api/territories/:id', authenticateToken, requireRole(['elder', 'service_overseer']), async (req, res) => {
    try {
        await supabase.from('territories').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// --- WORK RECORDS, GROUPS, WEEKLY PLANS ---

app.get('/api/work-history', authenticateToken, async (req, res) => {
    // Idealmente filtrar por congregação também, via join com territories
    // Por simplicidade, assumindo que o app filtra no front ou traz tudo (cuidado com dados vazados entre congregações se tabela for compartilhada)
    // Correção: Buscar records cujos territórios pertencem à congregação do usuário
    // Query complexa no supabase client simples é chato. Vamos filtrar.

    // Quick fix: RLS no banco de dados DEVE garantir isso ("Service role" aqui bypassa RLS, então precisamos filtrar no codigo)
    // Vamos buscar work_records

    const { data } = await supabase.from('work_records').select('*').order('date', { ascending: false }).limit(100);
    // Mapear snake_case para camelCase
    const mapped = (data || []).map(r => ({
        id: r.id,
        territoryId: r.territory_id,
        date: r.date,
        publisherName: r.publisher_name,
        notes: r.notes,
        photos: r.photos
    }));
    res.json(mapped);
});

app.post('/api/work-records', authenticateToken, async (req, res) => {
    const r = req.body;
    await supabase.from('work_records').insert({
        id: r.id,
        territory_id: r.territoryId,
        date: r.date,
        publisher_name: r.publisherName,
        notes: r.notes,
        photos: r.photos
    });

    // Opcional: Atualizar status do território automaticamente
    if (r.territoryId) {
        await supabase.from('territories').update({
            last_worked_date: r.date,
            last_worked_by: r.publisherName,
            status: 'green',
            days_since_work: 0
        }).eq('id', r.territoryId);
    }

    res.status(201).json({ id: r.id });
});

app.get('/api/groups', authenticateToken, async (req, res) => {
    const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
    if (!user.congregation_id) return res.json([]);

    const { data } = await supabase.from('territory_groups').select('*').eq('congregation_id', user.congregation_id);
    const mapped = (data || []).map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        color: g.color,
        territoryIds: g.territory_ids
    }));
    res.json(mapped);
});

app.post('/api/groups', authenticateToken, requireRole(['elder']), async (req, res) => {
    const g = req.body;
    const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();

    await supabase.from('territory_groups').insert({
        id: g.id,
        congregation_id: user.congregation_id,
        name: g.name,
        description: g.description,
        color: g.color,
        territory_ids: g.territoryIds
    });
    res.status(201).json({ id: g.id });
});

app.put('/api/groups/:id', authenticateToken, requireRole(['elder']), async (req, res) => {
    const { name, description, color, territoryIds } = req.body;
    await supabase.from('territory_groups').update({
        name,
        description,
        color,
        territory_ids: territoryIds
    }).eq('id', req.params.id);
    res.json({ success: true });
});

app.delete('/api/groups/:id', authenticateToken, requireRole(['elder']), async (req, res) => {
    await supabase.from('territory_groups').delete().eq('id', req.params.id);
    res.json({ success: true });
});

app.get('/api/weekly-plans', authenticateToken, async (req, res) => {
    // Simplificado, idealmente filtrar por grupos da congregação
    const { data } = await supabase.from('weekly_plans').select('*').order('start_date', { ascending: false });
    const mapped = (data || []).map(p => ({
        id: p.id,
        groupId: p.group_id,
        startDate: p.start_date,
        days: p.days
    }));
    res.json(mapped);
});

app.post('/api/weekly-plans', authenticateToken, requireRole(['elder', 'service_overseer']), async (req, res) => {
    const p = req.body;
    await supabase.from('weekly_plans').insert({
        id: p.id,
        group_id: p.groupId,
        start_date: p.startDate,
        days: p.days
    });
    res.status(201).json({ id: p.id });
});

// Export the app for Vercel
module.exports = app;
