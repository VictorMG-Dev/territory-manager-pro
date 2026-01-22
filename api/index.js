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

        if (congregationData) {
            if (congregationData.inviteCode) {
                const { data: congData, error } = await supabase.from('congregations').select('id').eq('invite_code', congregationData.inviteCode).single();
                if (error || !congData) return res.status(400).json({ message: 'Código inválido.' });
                congregationId = congData.id;
            } else if (congregationData.name) {
                const crypto = require('crypto');
                congregationId = crypto.randomUUID();
                const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                await supabase.from('congregations').insert({ id: congregationId, name: congregationData.name, description: congregationData.description || '', invite_code: inviteCode, created_by: uid });
                role = 'elder';
            }
        }

        const { error: userError } = await supabase.from('users').insert({ uid, name, email, password: hashedPassword, congregation_id: congregationId, role });
        if (userError) return res.status(400).json({ message: 'Erro ao criar usuário.' });

        const token = jwt.sign({ uid, email, role, congregationId }, process.env.JWT_SECRET || 'yoursecret');
        res.status(201).json({ token, user: { uid, name, email, congregationId, role } });
    } catch (error) { res.status(500).json({ message: 'Erro interno: ' + error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: users, error } = await supabase.from('users').select('*').eq('email', email);
        if (error || !users || users.length === 0) return res.status(400).json({ message: 'Credenciais inválidas.' });

        const user = users[0];
        if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: 'Credenciais inválidas.' });

        let congregationName = null;
        if (user.congregation_id) {
            const { data: congData } = await supabase.from('congregations').select('name').eq('id', user.congregation_id).single();
            if (congData) congregationName = congData.name;
        }

        const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role, congregationId: user.congregation_id }, process.env.JWT_SECRET || 'yoursecret');
        res.json({ token, user: { uid: user.uid, name: user.name, email: user.email, photoURL: user.photo_url, congregationId: user.congregation_id, congregationName, role: user.role } });
    } catch (error) { res.status(500).json({ message: 'Erro no login.' }); }
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

        const { data: userData } = await supabase.from('users').select('uid, name, email, photo_url').eq('uid', req.user.uid).single();
        res.json({ user: { ...userData, photoURL: userData.photo_url } });
    } catch (error) { res.status(500).json({ message: 'Erro ao atualizar perfil.' }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const { data: users } = await supabase.from('users').select('uid').eq('email', email);
        if (!users || users.length === 0) return res.json({ message: 'Email enviado se existir.' }); // Security obscure

        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);
        await supabase.from('password_reset_tokens').insert({ user_id: users[0].uid, token, expires_at: expiresAt.toISOString() });

        console.log('Reset Token:', token); // Log for now since no email service
        res.json({ message: 'Instruções enviadas.' });
    } catch (error) { res.status(500).json({ message: 'Erro ao processar.' }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const { data: tokens } = await supabase.from('password_reset_tokens').select('*').eq('token', token).eq('used', false);
        if (!tokens || tokens.length === 0) return res.status(400).json({ message: 'Token inválido.' });
        if (new Date(tokens[0].expires_at) < new Date()) return res.status(400).json({ message: 'Token expirado.' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('users').update({ password: hashedPassword }).eq('uid', tokens[0].user_id);
        await supabase.from('password_reset_tokens').update({ used: true }).eq('id', tokens[0].id);
        res.json({ message: 'Senha redefinida.' });
    } catch (error) { res.status(500).json({ message: 'Erro ao redefinir.' }); }
});

// --- CONGREGATION ROUTES ---

app.post('/api/congregations', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const id = require('crypto').randomUUID();
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        await supabase.from('congregations').insert({ id, name, description, invite_code: inviteCode, created_by: req.user.uid });
        await supabase.from('users').update({ congregation_id: id, role: 'elder' }).eq('uid', req.user.uid);

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
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('congregation_id', user.congregation_id);
        if (cong) { cong.memberCount = count || 0; cong.inviteCode = cong.invite_code; }
        res.json(cong);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.get('/api/congregations/members', authenticateToken, async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').select('congregation_id').eq('uid', req.user.uid).single();
        if (!user || !user.congregation_id) return res.json([]);
        const { data: members } = await supabase.from('users').select('uid, name, email, photo_url, role, created_at').eq('congregation_id', user.congregation_id);
        res.json(members.map(m => ({ uid: m.uid, name: m.name, email: m.email, photoURL: m.photo_url, role: m.role, joinedAt: m.created_at })));
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.put('/api/congregations/members/:uid/role', authenticateToken, async (req, res) => {
    // Simplified checks for brevity, rely on Supabase policies ideally or strict checks if needed
    try {
        const { role } = req.body;
        if (req.user.role !== 'elder') return res.status(403).json({ message: 'Apenas anciãos.' });
        await supabase.from('users').update({ role }).eq('uid', req.params.uid);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.delete('/api/congregations/members/:uid', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'elder' && req.user.role !== 'service_overseer') return res.status(403).json({ message: 'Sem permissão.' });
        await supabase.from('users').update({ congregation_id: null, role: 'publisher' }).eq('uid', req.params.uid);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.delete('/api/congregations/leave', authenticateToken, async (req, res) => {
    try {
        await supabase.from('users').update({ congregation_id: null }).eq('uid', req.user.uid);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// --- TERRITORY ROUTES ---

app.get('/api/territories', authenticateToken, async (req, res) => {
    try {
        const { data } = await supabase.from('territories').select('*');
        res.json(data || []);
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/territories', authenticateToken, async (req, res) => {
    try {
        const t = req.body;
        const { error } = await supabase.from('territories').insert({ id: t.id, user_id: t.userId, code: t.code, name: t.name, address: t.address, observations: t.observations, status: t.status, size: t.size, geolocation: t.geolocation, images: t.images });
        if (error) throw error;
        res.status(201).json({ id: t.id });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.put('/api/territories/:id', authenticateToken, async (req, res) => {
    try {
        const u = req.body;
        const dbU = {};
        if (u.name) dbU.name = u.name;
        if (u.code) dbU.code = u.code;
        if (u.address) dbU.address = u.address;
        if (u.observations) dbU.observations = u.observations;
        if (u.status) dbU.status = u.status;
        if (u.size) dbU.size = u.size;
        if (u.lastWorkedDate) dbU.last_worked_date = u.lastWorkedDate;
        if (u.lastWorkedBy) dbU.last_worked_by = u.lastWorkedBy;
        if (u.daysSinceWork) dbU.days_since_work = u.daysSinceWork;
        if (u.geolocation) dbU.geolocation = u.geolocation;
        if (u.images) dbU.images = u.images;

        await supabase.from('territories').update(dbU).eq('id', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

app.delete('/api/territories/:id', authenticateToken, async (req, res) => {
    try {
        await supabase.from('territories').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Erro.' }); }
});

// --- WORK records, GROUPS, WEEKLY PLANS (Simplified) ---

app.get('/api/work-history', authenticateToken, async (req, res) => {
    const { data } = await supabase.from('work_records').select('*').order('date', { ascending: false });
    res.json(data || []);
});

app.post('/api/work-records', authenticateToken, async (req, res) => {
    const r = req.body;
    await supabase.from('work_records').insert({ id: r.id, territory_id: r.territoryId, date: r.date, publisher_name: r.publisherName, notes: r.notes, photos: r.photos });
    res.status(201).json({ id: r.id });
});

app.get('/api/groups', authenticateToken, async (req, res) => {
    const { data } = await supabase.from('territory_groups').select('*');
    res.json(data || []);
});

app.post('/api/groups', authenticateToken, async (req, res) => {
    const g = req.body;
    await supabase.from('territory_groups').insert({ id: g.id, name: g.name, description: g.description, color: g.color, territory_ids: g.territoryIds });
    res.status(201).json({ id: g.id });
});

app.put('/api/groups/:id', authenticateToken, async (req, res) => {
    const { name, description, color, territoryIds } = req.body;
    await supabase.from('territory_groups').update({ name, description, color, territory_ids: territoryIds }).eq('id', req.params.id);
    res.json({ success: true });
});

app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
    await supabase.from('territory_groups').delete().eq('id', req.params.id);
    res.json({ success: true });
});

app.get('/api/weekly-plans', authenticateToken, async (req, res) => {
    const { data } = await supabase.from('weekly_plans').select('*').order('start_date', { ascending: false });
    res.json(data || []);
});

app.post('/api/weekly-plans', authenticateToken, async (req, res) => {
    const p = req.body;
    await supabase.from('weekly_plans').insert({ id: p.id, group_id: p.groupId, start_date: p.startDate, days: p.days });
    res.status(201).json({ id: p.id });
});

// Export the app for Vercel
module.exports = app;
