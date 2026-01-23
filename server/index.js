const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS settings - Local dev needs to be permissive
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

console.log('🔌 Connecting to Supabase...');
console.log('URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');

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
    res.json({ status: 'ok', message: 'Servidor Local no ar!' });
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Register attempt:', req.body.email);
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
                role = 'admin'; // Criador vira Admin com acesso total
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
        res.status(201).json({ token, user: { uid, name, email, congregationId, role, serviceRole: 'publisher' } });

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
                role: user.role,
                serviceRole: user.service_role,
                banner: user.banner
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no login.' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ message: 'Token obrigatório' });

        const { data: { user: googleUser }, error } = await supabase.auth.getUser(access_token);
        if (error || !googleUser) return res.status(401).json({ message: 'Token inválido' });

        // Check if user exists in our custom table
        const { data: existingUsers } = await supabase.from('users').select('*').eq('email', googleUser.email);

        let user;
        let isNew = false;

        if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];
            // Update photo if not present?
            if (!user.photo_url && googleUser.user_metadata.avatar_url) {
                await supabase.from('users').update({ photo_url: googleUser.user_metadata.avatar_url }).eq('uid', user.uid);
                user.photo_url = googleUser.user_metadata.avatar_url;
            }
        } else {
            // Create new user
            isNew = true;
            // Use Supabase identifier as UID or create new? 
            // Better to use a consistent UUID to avoid conflicts if they register manually later.
            // But if email is unique, they can't register manually anyway.
            // Let's use googleUser.id (which is a UUID from Supabase Auth)
            const newUid = googleUser.id;

            const newUser = {
                uid: newUid,
                name: googleUser.user_metadata.full_name || googleUser.email.split('@')[0],
                email: googleUser.email,
                password: await bcrypt.hash(Math.random().toString(36) + newUid, 10), // Random complex password
                photo_url: googleUser.user_metadata.avatar_url,
                role: 'publisher', // Default role
                congregation_id: null
            };

            const { error: insertError } = await supabase.from('users').insert(newUser);
            if (insertError) {
                console.error('Erro ao criar usuário Google:', insertError);
                return res.status(500).json({ message: 'Erro ao criar usuário via Google' });
            }
            user = newUser;
        }

        // Generate Token
        const token = jwt.sign({
            uid: user.uid,
            email: user.email,
            role: user.role,
            congregationId: user.congregation_id
        }, process.env.JWT_SECRET || 'yoursecret');

        // Look up congregation name if needed
        let congregationName = null;
        if (user.congregation_id) {
            const { data: cong } = await supabase.from('congregations').select('name').eq('id', user.congregation_id).single();
            if (cong) congregationName = cong.name;
        }

        res.json({
            token,
            user: {
                uid: user.uid,
                name: user.name,
                email: user.email,
                photoURL: user.photo_url,
                congregationId: user.congregation_id,
                congregationName,
                role: user.role,
                serviceRole: user.service_role,
                banner: user.banner
            }
        });

    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Erro ao processar login com Google' });
    }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { name, photoURL, email, password, serviceRole, banner } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (photoURL) updates.photo_url = photoURL;
        if (email) updates.email = email;
        if (serviceRole) updates.service_role = serviceRole;
        if (banner) updates.banner = banner;
        if (password) updates.password = await bcrypt.hash(password, 10);

        if (Object.keys(updates).length === 0) return res.status(400).json({ message: 'Nada para atualizar.' });

        const { error } = await supabase.from('users').update(updates).eq('uid', req.user.uid);
        if (error) return res.status(500).json({ message: 'Erro ao atualizar.' });

        // CRITICAL: Include ALL user fields to prevent data loss on frontend
        const { data: userData } = await supabase.from('users').select('uid, name, email, photo_url, congregation_id, role, service_role, banner').eq('uid', req.user.uid).single();

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
                role: userData.role,
                serviceRole: userData.service_role,
                banner: userData.banner
            }
        });
    } catch (error) { res.status(500).json({ message: 'Erro ao atualizar perfil.' }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        // Check if user exists
        const { data: users } = await supabase.from('users').select('uid').eq('email', email);

        if (!users || users.length === 0) {
            // Return success even if email not found to prevent enumeration
            return res.json({ message: 'Se o email existir, as instruções foram enviadas.' });
        }

        const user = users[0];
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Save token to database
        const { error } = await supabase.from('password_reset_tokens').insert({
            user_id: user.uid,
            token: token,
            expires_at: expiresAt.toISOString(),
            used: false
        });

        if (error) throw error;

        // In production, send email here. In dev, log it.
        console.log(`[DEV] Reset Link for ${email}: http://localhost:3000/reset-password?token=${token}`);
        res.json({ message: 'Instruções enviadas.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Erro ao processar solicitação.' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        // Verify token
        const { data: tokens, error } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .single();

        if (error || !tokens) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        // Check expiration
        if (new Date(tokens.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Token expirado. Solicite um novo link.' });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('uid', tokens.user_id);

        if (updateError) throw updateError;

        // Mark token as used
        await supabase
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id', tokens.id);

        res.json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Erro ao redefinir senha.' });
    }
});

// --- CONGREGATION ROUTES ---

app.post('/api/congregations', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const id = require('crypto').randomUUID();
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        await supabase.from('congregations').insert({ id, name, description, invite_code: inviteCode, created_by: req.user.uid });
        await supabase.from('users').update({ congregation_id: id, role: 'admin' }).eq('uid', req.user.uid);

        // Atualizar token
        const token = jwt.sign({ uid: req.user.uid, email: req.user.email, role: 'admin', congregationId: id }, process.env.JWT_SECRET || 'yoursecret');
        res.status(201).json({ id, name, description, inviteCode, role: 'admin', token });
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

// --- HELPER FUNCTIONS ---

const uploadImageToStorage = async (base64Data, userId) => {
    try {
        // Check if it's already a URL
        if (base64Data.startsWith('http')) return base64Data;
        if (!base64Data.startsWith('data:image')) return base64Data; // Or throw error?

        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = type.split('/')[1];
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        const { data, error } = await supabase.storage
            .from('territory-images')
            .upload(fileName, buffer, {
                contentType: type,
                upsert: true
            });

        if (error) {
            // Se o bucket não existir, tentar criar (opcional, pode falhar dependendo das permissões)
            console.error('Erro upload:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('territory-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Erro ao processar imagem:', error);
        return null; // Falha silenciosa ou tratar
    }
};

// --- TERRITORY ROUTES ---

app.get('/api/territories', authenticateToken, async (req, res) => {
    try {
        // Filtrar por congregação do usuário! Importante para multi-tenant
        const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
        if (!user.congregation_id) return res.json([]);

        const { data } = await supabase.from('territories')
            .select('*')
            .eq('congregation_id', user.congregation_id);

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
            geolocation: t.geolocation,
            images: []
        };

        // Processar imagens
        if (t.images && Array.isArray(t.images)) {
            const uploadedImages = [];
            for (const img of t.images) {
                const url = await uploadImageToStorage(img, req.user.uid);
                if (url) uploadedImages.push(url);
            }
            newTerritory.images = uploadedImages;
        }

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
        if (u.geolocation) dbU.geolocation = u.geolocation;

        if (u.images) {
            const uploadedImages = [];
            for (const img of u.images) {
                // Se for objeto {url: ...}, extrair url. O frontend manda array de strings, mas previnir.
                const imgStr = typeof img === 'string' ? img : img.url;
                const url = await uploadImageToStorage(imgStr, req.user.uid);
                if (url) uploadedImages.push(url);
            }
            dbU.images = uploadedImages;
        }

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


// --- TRACKING ROUTES ---

app.post('/api/tracking/sessions', authenticateToken, async (req, res) => {
    try {
        const { userId, congregationId, startTime, endTime, durationSeconds, distanceMeters, points, observations, notes } = req.body;

        // 1. Create Session
        const { data: session, error: sessionError } = await supabase
            .from('tracking_sessions')
            .insert({
                user_id: req.user.uid, // Force user_id from token for security
                congregation_id: req.user.congregationId,
                start_time: startTime,
                end_time: endTime,
                duration_seconds: durationSeconds,
                distance_meters: distanceMeters,
                observations,
                notes,
                status: 'pending'
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // 2. Insert Points (if any)
        if (points && points.length > 0) {
            const formattedPoints = points.map(p => ({
                session_id: session.id,
                latitude: p.latitude,
                longitude: p.longitude,
                accuracy: p.accuracy,
                timestamp: p.timestamp || new Date().toISOString()
            }));

            const { error: pointsError } = await supabase
                .from('tracking_points')
                .insert(formattedPoints);

            if (pointsError) console.error("Error saving points:", pointsError); // Log but don't fail session
        }

        res.status(201).json(session);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao salvar sessão de rastreamento.' });
    }
});

app.get('/api/tracking/history', authenticateToken, async (req, res) => {
    try {
        const { data } = await supabase
            .from('tracking_sessions')
            .select('*')
            .eq('user_id', req.user.uid)
            .order('start_time', { ascending: false });

        // CamelCase mapping
        const mapped = (data || []).map(s => ({
            id: s.id,
            userId: s.user_id,
            congregationId: s.congregation_id,
            startTime: s.start_time,
            endTime: s.end_time,
            status: s.status,
            distanceMeters: s.distance_meters,
            durationSeconds: s.duration_seconds,
            observations: s.observations,
            notes: s.notes,
            createdAt: s.created_at
        }));

        res.json(mapped);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao buscar histórico.' });
    }
});

app.get('/api/tracking/pending', authenticateToken, requireRole(['elder', 'service_overseer', 'admin']), async (req, res) => {
    try {
        // Get sessions from same congregation
        const { data } = await supabase
            .from('tracking_sessions')
            .select('*, users:user_id(name)') // Join to get user name
            .eq('congregation_id', req.user.congregationId)
            .eq('status', 'pending')
            .order('start_time', { ascending: false });

        const mapped = (data || []).map(s => ({
            id: s.id,
            userId: s.user_id,
            userName: s.users?.name || 'Desconhecido',
            congregationId: s.congregation_id,
            startTime: s.start_time,
            endTime: s.end_time,
            status: s.status,
            distanceMeters: s.distance_meters,
            durationSeconds: s.duration_seconds,
            observations: s.observations,
            notes: s.notes,
            createdAt: s.created_at
        }));

        res.json(mapped);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao buscar relatórios pendentes.' });
    }
});

app.put('/api/tracking/sessions/:id/approve', authenticateToken, requireRole(['elder', 'service_overseer', 'admin']), async (req, res) => {
    try {
        await supabase
            .from('tracking_sessions')
            .update({ status: 'approved' })
            .eq('id', req.params.id)
            .eq('congregation_id', req.user.congregationId); // Security check

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao aprovar.' });
    }
});

app.put('/api/tracking/sessions/:id/reject', authenticateToken, requireRole(['elder', 'service_overseer', 'admin']), async (req, res) => {
    try {
        await supabase
            .from('tracking_sessions')
            .update({ status: 'rejected' })
            .eq('id', req.params.id)
            .eq('congregation_id', req.user.congregationId);

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao rejeitar.' });
    }
});

app.get('/api/tracking/sessions/:id', authenticateToken, async (req, res) => {
    try {
        // 1. Get Session Details
        const { data: session, error: sessionError } = await supabase
            .from('tracking_sessions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (sessionError || !session) return res.status(404).json({ message: 'Sessão não encontrada.' });

        // Security: Check if user owns session or is admin/elder of same congregation
        const isOwner = session.user_id === req.user.uid;
        const isAdminConfig = ['admin', 'elder', 'service_overseer'].includes(req.user.role)
            && session.congregation_id === req.user.congregationId;

        if (!isOwner && !isAdminConfig) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        // 2. Get Points
        const { data: points } = await supabase
            .from('tracking_points')
            .select('*')
            .eq('session_id', req.params.id)
            .order('timestamp', { ascending: true });

        // Map response
        const response = {
            id: session.id,
            userId: session.user_id,
            congregationId: session.congregation_id,
            startTime: session.start_time,
            endTime: session.end_time,
            status: session.status,
            distanceMeters: session.distance_meters,
            durationSeconds: session.duration_seconds,
            observations: session.observations,
            notes: session.notes,
            createdAt: session.created_at,
            points: (points || []).map(p => ({
                id: p.id,
                sessionId: p.session_id,
                latitude: p.latitude,
                longitude: p.longitude,
                accuracy: p.accuracy,
                timestamp: p.timestamp
            }))
        };

        res.json(response);

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao buscar detalhes da sessão.' });
    }
});



// --- SERVICE REPORTS ROUTES ---

app.get('/api/service-reports', authenticateToken, async (req, res) => {
    try {
        const { data } = await supabase
            .from('service_reports')
            .select('*')
            .eq('user_id', req.user.uid)
            .order('month', { ascending: false });

        const mapped = (data || []).map(r => ({
            id: r.id,
            userId: r.user_id,
            month: r.month,
            hours: r.hours,
            minutes: r.minutes,
            bibleStudies: r.bible_studies,
            participated: r.participated,
            isCampaign: r.is_campaign,
            submitted: r.submitted || false,
            submittedAt: r.submitted_at,
            dailyRecords: r.daily_records || {}
        }));
        res.json(mapped);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao buscar relatórios.' });
    }
});

app.post('/api/service-reports', authenticateToken, async (req, res) => {
    try {
        const r = req.body;
        console.log(`[ServiceReport] Saving for ${req.user.uid}, month: ${r.month}`);

        const payload = {
            user_id: req.user.uid,
            month: r.month,
            hours: parseInt(r.hours || 0),
            minutes: parseInt(r.minutes || 0),
            bible_studies: parseInt(r.bibleStudies || 0),
            participated: !!r.participated,
            is_campaign: !!r.isCampaign,
            daily_records: r.dailyRecords || {}
        };

        const { data, error } = await supabase
            .from('service_reports')
            .upsert(payload, { onConflict: 'user_id, month' })
            .select()
            .single();

        if (error) {
            console.error('[Supabase Error]', error);
            // Return 400 or 500 with details
            return res.status(error.code === 'PGRST116' ? 400 : 500).json({
                message: 'Erro ao salvar relatório no Supabase',
                error: error.message,
                code: error.code
            });
        }

        res.json({ id: data.id, ...r });
    } catch (e) {
        console.error('[Server Error]', e);
        res.status(500).json({ message: 'Erro interno no servidor', error: e.message });
    }
});

app.patch('/api/service-reports/submit', authenticateToken, async (req, res) => {
    try {
        const { month } = req.body;
        if (!month) return res.status(400).json({ message: 'Mês é obrigatório.' });

        const { data, error } = await supabase
            .from('service_reports')
            .update({
                submitted: true,
                submitted_at: new Date().toISOString()
            })
            .eq('user_id', req.user.uid)
            .eq('month', month)
            .select()
            .single();

        if (error) {
            console.error('[Submit Error]', error);
            return res.status(500).json({ message: 'Erro ao enviar relatório.' });
        }

        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

app.get('/api/congregation/reports', authenticateToken, requireRole(['elder', 'admin', 'service_overseer']), async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = supabase
            .from('service_reports')
            .select(`
                *,
                user:users!user_id (
                    name,
                    role,
                    email
                )
            `)
            .eq('submitted', true);

        // Safely check for congregation ID since it might be in different places depending on version/token
        const congregationId = req.user.congregationId;
        if (!congregationId) {
            return res.status(400).json({ message: 'Usuário não está vinculado a uma congregação.' });
        }

        // We need to filter by users of this congregation
        const { data: members, error: membersError } = await supabase
            .from('users')
            .select('uid')
            .eq('congregation_id', congregationId);

        if (membersError) throw membersError;
        const memberUids = (members || []).map(m => m.uid);

        query = query.in('user_id', memberUids);

        if (month) {
            query = query.eq('month', month);
        } else if (year) {
            query = query.like('month', `${year}-%`);
        }

        const { data, error } = await query.order('month', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map(r => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user?.name || 'Desconhecido',
            userRole: r.user?.role,
            month: r.month,
            hours: r.hours,
            minutes: r.minutes,
            bibleStudies: r.bible_studies,
            participated: r.participated,
            isCampaign: r.is_campaign,
            submittedAt: r.submitted_at,
            dailyRecords: r.daily_records
        }));

        res.json(mapped);
    } catch (e) {
        console.error('[API Congregation Reports Error]:', e);
        res.status(500).json({
            message: 'Erro ao buscar relatórios da congregação.',
            error: e.message,
            details: e.details || e.hint
        });
    }
});

// --- MONTHLY PLANNING ROUTES ---

app.get('/api/monthly-plans', authenticateToken, async (req, res) => {
    try {
        const { data: plans } = await supabase
            .from('monthly_plans')
            .select('*, weekly_schedules(*)')
            .eq('user_id', req.user.uid)
            .order('month', { ascending: false });

        const mapped = (plans || []).map(p => ({
            id: p.id,
            userId: p.user_id,
            month: p.month,
            targetHours: p.target_hours,
            totalPlannedHours: p.total_planned_hours,
            projectedCompletion: p.projected_completion,
            weeks: (p.weekly_schedules || []).map(w => ({
                id: w.id,
                userId: w.user_id,
                planId: w.plan_id,
                month: w.month,
                weekNumber: w.week_number,
                days: w.days,
                totalPlannedHours: w.total_planned_hours
            }))
        }));
        res.json(mapped);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao buscar planos mensais.' });
    }
});

app.post('/api/monthly-plans', authenticateToken, async (req, res) => {
    try {
        const p = req.body;
        const { data, error } = await supabase
            .from('monthly_plans')
            .upsert({
                user_id: req.user.uid,
                month: p.month,
                target_hours: p.targetHours,
                total_planned_hours: p.totalPlannedHours,
                projected_completion: p.projectedCompletion
            }, { onConflict: 'user_id, month' })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ id: data.id, ...p });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao criar plano mensal.' });
    }
});

app.put('/api/monthly-plans/:id', authenticateToken, async (req, res) => {
    try {
        const { targetHours, totalPlannedHours, projectedCompletion, weeks } = req.body;
        await supabase
            .from('monthly_plans')
            .update({
                target_hours: targetHours,
                total_planned_hours: totalPlannedHours,
                projected_completion: projectedCompletion
            })
            .eq('id', req.params.id)
            .eq('user_id', req.user.uid);

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao atualizar plano.' });
    }
});

app.delete('/api/monthly-plans/:id', authenticateToken, async (req, res) => {
    try {
        await supabase
            .from('monthly_plans')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.uid);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao excluir plano.' });
    }
});

app.post('/api/weekly-schedules', authenticateToken, async (req, res) => {
    try {
        const s = req.body;
        const { data, error } = await supabase
            .from('weekly_schedules')
            .upsert({
                user_id: req.user.uid,
                plan_id: s.planId,
                month: s.month,
                week_number: s.weekNumber,
                days: s.days,
                total_planned_hours: s.totalPlannedHours
            }, { onConflict: 'user_id, month, week_number' })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ id: data.id, ...s });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro ao salvar agenda semanal.' });
    }
});

// --- PLAN TEMPLATES ROUTES ---

app.get('/api/plan-templates', authenticateToken, async (req, res) => {
    try {
        const { data } = await supabase
            .from('plan_templates')
            .select('*')
            .eq('user_id', req.user.uid);

        const mapped = (data || []).map(t => ({
            id: t.id,
            userId: t.user_id,
            name: t.name,
            slots: t.slots || []
        }));
        res.json(mapped);
    } catch (e) {
        res.status(500).json({ message: 'Erro ao buscar templates.' });
    }
});

app.post('/api/plan-templates', authenticateToken, async (req, res) => {
    try {
        const t = req.body;
        const { data, error } = await supabase
            .from('plan_templates')
            .insert({
                user_id: req.user.uid,
                name: t.name,
                slots: t.slots
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ id: data.id, ...t });
    } catch (e) {
        res.status(500).json({ message: 'Erro ao criar template.' });
    }
});

app.delete('/api/plan-templates/:id', authenticateToken, async (req, res) => {
    try {
        await supabase
            .from('plan_templates')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.uid); // Ensure ownership
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: 'Erro ao excluir template.' });
    }
});


// Export app for Vercel
module.exports = app;

// Start server (Local Only)
if (require.main === module) {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`✅ Local Server running on port ${port}`);
    });
}
