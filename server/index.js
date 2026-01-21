const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2/promise');
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

// Test DB connection and Setup
async function setupDatabase() {
    try {
        console.log(`🔌 Tentando conectar ao MySQL (Usuário: ${process.env.DB_USER}, Senha: ${process.env.DB_PASSWORD ? '********' : 'VAZIA'})`);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('🔍 Verificando banco de dados...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'territory_manager'}\``);
        await connection.query(`USE \`${process.env.DB_NAME || 'territory_manager'}\``);

        // Create Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                uid VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                photoURL LONGTEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migrate existing photURL column if needed
        await connection.query('ALTER TABLE users MODIFY COLUMN photoURL LONGTEXT');

        console.log('✅ MySQL conectado e Tabelas verificadas!');
        connection.end();
    } catch (err) {
        console.error('❌ ERRO CRÍTICO NO MYSQL:', err.message);
        if (err.message.includes('Access denied')) {
            console.log('👉 MOTIVO: A senha do MySQL está errada ou vazia no arquivo .env');
        } else if (err.message.includes('ECONNREFUSED')) {
            console.log('👉 MOTIVO: O MySQL não está rodando no seu computador.');
        }
    }
}

setupDatabase();

// Database connection pool for routes
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'territory_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor no ar!' });
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
        const { uid, name, email, password } = req.body;

        if (!uid || !name || !email || !password) {
            console.log('❌ Dados incompletos:', { uid: !!uid, name: !!name, email: !!email, password: !!password });
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute(
            'INSERT INTO users (uid, name, email, password) VALUES (?, ?, ?, ?)',
            [uid, name, email, hashedPassword]
        );

        const token = jwt.sign({ uid, email }, process.env.JWT_SECRET || 'yoursecret');
        console.log(`✅ Usuário criado com sucesso no banco: ${email}`);
        res.status(201).json({ token, user: { uid, name, email } });
    } catch (error) {
        console.error('❌ ERRO CRÍTICO no banco de dados:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro interno no banco: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        const token = jwt.sign({ uid: user.uid, email: user.email }, process.env.JWT_SECRET || 'yoursecret');
        res.json({
            token,
            user: {
                uid: user.uid,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    console.log('--- Atualização de Perfil Recebida ---');
    console.log('Body:', { ...req.body, password: req.body.password ? '********' : undefined });
    try {
        const { name, photoURL, email, password } = req.body;
        const uid = req.user.uid;

        const fields = [];
        const values = [];

        if (name !== undefined) {
            fields.push('name = ?');
            values.push(name);
        }
        if (photoURL !== undefined) {
            fields.push('photoURL = ?');
            values.push(photoURL);
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email);
        }
        if (password !== undefined && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'Nenhum dado para atualizar.' });
        }

        values.push(uid);
        await pool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE uid = ?`,
            values
        );

        // Fetch updated user to return
        const [rows] = await pool.execute('SELECT uid, name, email, photoURL FROM users WHERE uid = ?', [uid]);
        res.json({ user: rows[0] });
    } catch (error) {
        console.error('Erro na atualização de perfil:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Este e-mail já está sendo usado por outro usuário.' });
        }
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});

// --- TERRITORY ROUTES ---

app.get('/api/territories', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM territories');
        // Parse JSON fields
        const territories = rows.map(t => ({
            ...t,
            geolocation: typeof t.geolocation === 'string' ? JSON.parse(t.geolocation) : t.geolocation,
            images: typeof t.images === 'string' ? JSON.parse(t.images) : t.images
        }));
        res.json(territories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar territórios.' });
    }
});

app.post('/api/territories', authenticateToken, async (req, res) => {
    try {
        const territory = req.body;
        await pool.execute(
            'INSERT INTO territories (id, userId, code, name, address, observations, status, size, geolocation, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                territory.id, territory.userId, territory.code, territory.name,
                territory.address, territory.observations, territory.status,
                territory.size, JSON.stringify(territory.geolocation),
                JSON.stringify(territory.images)
            ]
        );
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
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (['name', 'code', 'address', 'observations', 'status', 'size', 'lastWorkedDate', 'lastWorkedBy', 'daysSinceWork'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            } else if (['geolocation', 'images'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(JSON.stringify(value));
            }
        }

        if (fields.length > 0) {
            values.push(id);
            await pool.execute(`UPDATE territories SET ${fields.join(', ')} WHERE id = ?`, values);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar território.' });
    }
});

// --- WORK RECORDS ---

app.delete('/api/territories/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM territories WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir território.' });
    }
});

// --- WORK RECORDS ---

app.get('/api/work-history', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM work_records ORDER BY date DESC');
        const history = rows.map(r => ({
            ...r,
            photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos
        }));
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico.' });
    }
});

app.post('/api/work-records', authenticateToken, async (req, res) => {
    try {
        const record = req.body;
        await pool.execute(
            'INSERT INTO work_records (id, territoryId, date, publisherName, notes, photos) VALUES (?, ?, ?, ?, ?, ?)',
            [record.id, record.territoryId, record.date, record.publisherName, record.notes, JSON.stringify(record.photos)]
        );
        res.status(201).json({ id: record.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao registrar trabalho.' });
    }
});

// --- GROUPS ---

app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM territory_groups');
        const groups = rows.map(g => ({
            ...g,
            territoryIds: typeof g.territoryIds === 'string' ? JSON.parse(g.territoryIds) : g.territoryIds
        }));
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar grupos.' });
    }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
    try {
        const group = req.body;
        await pool.execute(
            'INSERT INTO territory_groups (id, name, description, color, territoryIds) VALUES (?, ?, ?, ?, ?)',
            [group.id, group.name, group.description, group.color, JSON.stringify(group.territoryIds)]
        );
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
        await pool.execute(
            'UPDATE territory_groups SET name = ?, description = ?, color = ?, territoryIds = ? WHERE id = ?',
            [name, description, color, JSON.stringify(territoryIds), id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar grupo.' });
    }
});

app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM territory_groups WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir grupo.' });
    }
});

// --- WEEKLY PLANS ---

app.get('/api/weekly-plans', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM weekly_plans ORDER BY startDate DESC');
        const plans = rows.map(p => ({
            ...p,
            days: typeof p.days === 'string' ? JSON.parse(p.days) : p.days
        }));
        res.json(plans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar planejamentos.' });
    }
});

app.post('/api/weekly-plans', authenticateToken, async (req, res) => {
    try {
        const plan = req.body;
        await pool.execute(
            'INSERT INTO weekly_plans (id, groupId, startDate, days) VALUES (?, ?, ?, ?)',
            [plan.id, plan.groupId, plan.startDate, JSON.stringify(plan.days)]
        );
        res.status(201).json({ id: plan.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao salvar planejamento.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
