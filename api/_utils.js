const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// CORS Helper
const allowCors = (fn) => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    return await fn(req, res);
};

// Auth Verification Helper
// Returns the user object if valid, throws error if not
const verifyToken = (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        throw { status: 401, message: 'Token não fornecido' };
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'yoursecret');
        return user;
    } catch (err) {
        throw { status: 403, message: 'Token inválido' };
    }
};

module.exports = {
    supabase,
    allowCors,
    verifyToken
};
