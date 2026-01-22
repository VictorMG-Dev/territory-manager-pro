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

// CORS fully open for local debugging
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const port = process.env.PORT || 3002;

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

console.log('🔌 Connecting to Supabase...');
console.log('URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('Service Key:', process.env.SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor no ar com Supabase!' });
});

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

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    console.log('--- Nova tentativa de Cadastro ---');
    console.log('Dados recebidos:', req.body);
    try {
        const { uid, name, email, password, congregationData } = req.body;

        if (!uid || !name || !email || !password) {
            console.log('❌ Dados incompletos');
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let congregationId = null;
        let role = 'publisher';

        // Handle congregation logic
        if (congregationData) {
            if (congregationData.inviteCode) {
                // Join existing congregation
                const { data: congData, error } = await supabase
                    .from('congregations')
                    .select('id')
                    .eq('invite_code', congregationData.inviteCode)
                    .single();

                if (error || !congData) {
                    return res.status(400).json({ message: 'Código de convite inválido.' });
                }
                congregationId = congData.id;
            } else if (congregationData.name) {
                // Create new congregation
                const crypto = require('crypto');
                congregationId = crypto.randomUUID();
                const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

                const { error } = await supabase
                    .from('congregations')
                    .insert({
                        id: congregationId,
                        name: congregationData.name,
                        description: congregationData.description || '',
                        invite_code: inviteCode,
                        created_by: uid
                    });

                if (error) {
                    console.error('Erro ao criar congregação:', error);
                    return res.status(500).json({ message: 'Erro ao criar congregação.' });
                }

                // Creator is an Elder
                role = 'elder';
            }
        }

        const { error: userError } = await supabase
            .from('users')
            .insert({
                uid,
                name,
                email,
                password: hashedPassword,
                congregation_id: congregationId,
                role
            });

        if (userError) {
            console.error('❌ Erro ao criar usuário:', userError);
            if (userError.code === '23505') { // Unique violation
                return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ message: 'Erro ao criar usuário.' });
        }

        const token = jwt.sign({ uid, email, role, congregationId }, process.env.JWT_SECRET || 'yoursecret');
        console.log(`✅ Usuário criado com sucesso: ${email}`);
        res.status(201).json({ token, user: { uid, name, email, congregationId, role } });
    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error.message);
        res.status(500).json({ message: 'Erro interno: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error || !users || users.length === 0) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        // Get congregation info if user has one
        let congregationName = null;
        if (user.congregation_id) {
            const { data: congData } = await supabase
                .from('congregations')
                .select('name')
                .eq('id', user.congregation_id)
                .single();

            if (congData) {
                congregationName = congData.name;
            }
        }

        const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role, congregationId: user.congregation_id }, process.env.JWT_SECRET || 'yoursecret');
        res.json({
            token,
            user: {
                uid: user.uid,
                name: user.name,
                email: user.email,
                photoURL: user.photo_url,
                congregationId: user.congregation_id,
                congregationName: congregationName,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    console.log('--- Atualização de Perfil Recebida ---');
    try {
        const { name, photoURL, email, password } = req.body;
        const uid = req.user.uid;

        const updates = {};

        if (name !== undefined) updates.name = name;
        if (photoURL !== undefined) updates.photo_url = photoURL;
        if (email !== undefined) updates.email = email;
        if (password !== undefined && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.password = hashedPassword;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Nenhum dado para atualizar.' });
        }

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('uid', uid);

        if (error) {
            console.error('Erro na atualização:', error);
            if (error.code === '23505') {
                return res.status(400).json({ message: 'Este e-mail já está sendo usado.' });
            }
            return res.status(500).json({ message: 'Erro ao atualizar perfil.' });
        }

        // Fetch updated user
        const { data: userData } = await supabase
            .from('users')
            .select('uid, name, email, photo_url')
            .eq('uid', uid)
            .single();

        res.json({ user: { ...userData, photoURL: userData.photo_url } });
    } catch (error) {
        console.error('Erro na atualização de perfil:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});

// --- CONGREGATION ROUTES ---

app.post('/api/congregations', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const crypto = require('crypto');
        const id = crypto.randomUUID();
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const { error: congError } = await supabase
            .from('congregations')
            .insert({
                id,
                name,
                description: description || '',
                invite_code: inviteCode,
                created_by: req.user.uid
            });

        if (congError) {
            console.error(congError);
            return res.status(500).json({ message: 'Erro ao criar congregação.' });
        }

        // Update user's congregation and make them an elder
        const { error: userError } = await supabase
            .from('users')
            .update({ congregation_id: id, role: 'elder' })
            .eq('uid', req.user.uid);

        if (userError) {
            console.error(userError);
        }

        // Generate new token with updated congregationId and role
        const newToken = jwt.sign({ uid: req.user.uid, email: req.user.email, role: 'elder', congregationId: id }, process.env.JWT_SECRET || 'yoursecret');

        res.status(201).json({
            id,
            name,
            description,
            inviteCode,
            createdBy: req.user.uid,
            role: 'elder',
            token: newToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar congregação.' });
    }
});

app.get('/api/congregations/validate/:inviteCode', async (req, res) => {
    try {
        const { inviteCode } = req.params;

        const { data, error } = await supabase
            .from('congregations')
            .select('id, name, description')
            .eq('invite_code', inviteCode)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: 'Código de convite inválido.' });
        }

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao validar código.' });
    }
});

app.post('/api/congregations/join', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.body;

        const { data, error } = await supabase
            .from('congregations')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: 'Código de convite inválido.' });
        }

        const congregationId = data.id;

        const { error: updateError } = await supabase
            .from('users')
            .update({ congregation_id: congregationId })
            .eq('uid', req.user.uid);

        if (updateError) {
            console.error(updateError);
            return res.status(500).json({ message: 'Erro ao entrar na congregação.' });
        }

        // Generate new token with updated congregationId
        const newToken = jwt.sign({ uid: req.user.uid, email: req.user.email, role: req.user.role, congregationId }, process.env.JWT_SECRET || 'yoursecret');

        res.json({ success: true, congregationId, token: newToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao entrar na congregação.' });
    }
});

app.get('/api/congregations/my', authenticateToken, async (req, res) => {
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('uid', req.user.uid)
            .single();

        if (!userData || !userData.congregation_id) {
            return res.json(null);
        }

        const { data: congData } = await supabase
            .from('congregations')
            .select('*')
            .eq('id', userData.congregation_id)
            .single();

        if (!congData) {
            return res.json(null);
        }

        // Get member count
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('congregation_id', userData.congregation_id);

        congData.memberCount = count || 0;
        congData.inviteCode = congData.invite_code;

        res.json(congData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar congregação.' });
    }
});

app.get('/api/congregations/members', authenticateToken, async (req, res) => {
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('uid', req.user.uid)
            .single();

        if (!userData || !userData.congregation_id) {
            return res.json([]);
        }

        const { data: members } = await supabase
            .from('users')
            .select('uid, name, email, photo_url, role, created_at')
            .eq('congregation_id', userData.congregation_id);

        const formattedMembers = (members || []).map(m => ({
            uid: m.uid,
            name: m.name,
            email: m.email,
            photoURL: m.photo_url,
            role: m.role,
            joinedAt: m.created_at
        }));

        res.json(formattedMembers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar membros.' });
    }
});

app.put('/api/congregations/members/:uid/role', authenticateToken, async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;
        const requesterRole = req.user.role;

        // Role hierarchy levels
        const roleLevels = {
            'publisher': 1,
            'territory_servant': 2,
            'service_overseer': 3,
            'elder': 4
        };

        const requesterLevel = roleLevels[requesterRole] || 0;
        const newRoleLevel = roleLevels[role] || 0;

        if (requesterLevel < 2) {
            return res.status(403).json({ message: 'Você não tem permissão para gerenciar cargos.' });
        }

        if (requesterRole !== 'elder' && newRoleLevel >= requesterLevel) {
            return res.status(403).json({ message: 'Você não pode promover alguém a um cargo igual ou superior ao seu.' });
        }

        // Verify target user
        const { data: targetUser } = await supabase
            .from('users')
            .select('congregation_id, role')
            .eq('uid', uid)
            .single();

        if (!targetUser || targetUser.congregation_id !== req.user.congregationId) {
            return res.status(404).json({ message: 'Usuário não encontrado na sua congregação.' });
        }

        const targetUserLevel = roleLevels[targetUser.role || 'publisher'];

        if (requesterRole !== 'elder' && targetUserLevel >= requesterLevel) {
            return res.status(403).json({ message: 'Você não pode alterar o cargo de alguém com hierarquia igual ou superior.' });
        }

        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('uid', uid);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar cargo.' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar cargo.' });
    }
});

app.delete('/api/congregations/members/:uid', authenticateToken, async (req, res) => {
    try {
        const { uid } = req.params;
        const requesterRole = req.user.role;

        const roleLevels = {
            'publisher': 1,
            'territory_servant': 2,
            'service_overseer': 3,
            'elder': 4
        };

        const requesterLevel = roleLevels[requesterRole] || 0;

        if (requesterLevel < 3) {
            return res.status(403).json({ message: 'Você não tem permissão para remover membros.' });
        }

        if (uid === req.user.uid) {
            return res.status(400).json({ message: 'Você não pode remover a si mesmo.' });
        }

        const { data: requesterData } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('uid', req.user.uid)
            .single();

        if (!requesterData || !requesterData.congregation_id) {
            return res.status(403).json({ message: 'Você não está em uma congregação.' });
        }

        const { data: targetUser } = await supabase
            .from('users')
            .select('congregation_id, role')
            .eq('uid', uid)
            .single();

        if (!targetUser || targetUser.congregation_id !== requesterData.congregation_id) {
            return res.status(404).json({ message: 'Usuário não encontrado na sua congregação.' });
        }

        const targetUserLevel = roleLevels[targetUser.role || 'publisher'];

        if (requesterRole === 'service_overseer' && targetUserLevel >= 3) {
            return res.status(403).json({ message: 'Você não pode remover alguém com cargo igual ou superior ao seu.' });
        }

        if (targetUser.role === 'elder' && requesterRole === 'elder') {
            return res.status(403).json({ message: 'Anciãos não podem remover outros anciãos.' });
        }

        const { error } = await supabase
            .from('users')
            .update({ congregation_id: null, role: 'publisher' })
            .eq('uid', uid);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao remover membro.' });
        }

        res.json({ success: true, message: 'Membro removido com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover membro.' });
    }
});

app.delete('/api/congregations/leave', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ congregation_id: null })
            .eq('uid', req.user.uid);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao sair da congregação.' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao sair da congregação.' });
    }
});

// --- TERRITORY ROUTES ---

app.get('/api/territories', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('territories')
            .select('*');

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar territórios.' });
        }

        res.json(data || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar territórios.' });
    }
});

app.post('/api/territories', authenticateToken, async (req, res) => {
    try {
        const territory = req.body;

        const { error } = await supabase
            .from('territories')
            .insert({
                id: territory.id,
                user_id: territory.userId,
                code: territory.code,
                name: territory.name,
                address: territory.address,
                observations: territory.observations,
                status: territory.status,
                size: territory.size,
                geolocation: territory.geolocation,
                images: territory.images
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao salvar território.' });
        }

        res.status(201).json({ id: territory.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar território.' });
    }
});

app.put('/api/territories/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const dbUpdates = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.code !== undefined) dbUpdates.code = updates.code;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.observations !== undefined) dbUpdates.observations = updates.observations;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.size !== undefined) dbUpdates.size = updates.size;
        if (updates.lastWorkedDate !== undefined) dbUpdates.last_worked_date = updates.lastWorkedDate;
        if (updates.lastWorkedBy !== undefined) dbUpdates.last_worked_by = updates.lastWorkedBy;
        if (updates.daysSinceWork !== undefined) dbUpdates.days_since_work = updates.daysSinceWork;
        if (updates.geolocation !== undefined) dbUpdates.geolocation = updates.geolocation;
        if (updates.images !== undefined) dbUpdates.images = updates.images;

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase
                .from('territories')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao atualizar território.' });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar território.' });
    }
});

app.delete('/api/territories/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('territories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao excluir território.' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir território.' });
    }
});

// --- WORK RECORDS ---

app.get('/api/work-history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('work_records')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar histórico.' });
        }

        res.json(data || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico.' });
    }
});

app.post('/api/work-records', authenticateToken, async (req, res) => {
    try {
        const record = req.body;

        const { error } = await supabase
            .from('work_records')
            .insert({
                id: record.id,
                territory_id: record.territoryId,
                date: record.date,
                publisher_name: record.publisherName,
                notes: record.notes,
                photos: record.photos
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao registrar trabalho.' });
        }

        res.status(201).json({ id: record.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao registrar trabalho.' });
    }
});

// --- GROUPS ---

app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('territory_groups')
            .select('*');

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar grupos.' });
        }

        res.json(data || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar grupos.' });
    }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
    try {
        const group = req.body;

        const { error } = await supabase
            .from('territory_groups')
            .insert({
                id: group.id,
                name: group.name,
                description: group.description,
                color: group.color,
                territory_ids: group.territoryIds
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao salvar grupo.' });
        }

        res.status(201).json({ id: group.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar grupo.' });
    }
});

app.put('/api/groups/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, territoryIds } = req.body;

        const { error } = await supabase
            .from('territory_groups')
            .update({
                name,
                description,
                color,
                territory_ids: territoryIds
            })
            .eq('id', id);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar grupo.' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar grupo.' });
    }
});

app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('territory_groups')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao excluir grupo.' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir grupo.' });
    }
});

// --- WEEKLY PLANS ---

app.get('/api/weekly-plans', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('weekly_plans')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar planejamentos.' });
        }

        res.json(data || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar planejamentos.' });
    }
});

app.post('/api/weekly-plans', authenticateToken, async (req, res) => {
    try {
        const plan = req.body;

        const { error } = await supabase
            .from('weekly_plans')
            .insert({
                id: plan.id,
                group_id: plan.groupId,
                start_date: plan.startDate,
                days: plan.days
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao salvar planejamento.' });
        }

        res.status(201).json({ id: plan.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar planejamento.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Server running on port ${port} with Supabase!`);
});
