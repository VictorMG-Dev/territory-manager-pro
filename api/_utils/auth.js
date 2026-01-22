const jwt = require('jsonwebtoken');

function authenticateToken(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return { error: 'No token provided', status: 401 };
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'yoursecret');
        return { user };
    } catch (err) {
        return { error: 'Invalid token', status: 403 };
    }
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

function handleCors(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

module.exports = { authenticateToken, corsHeaders, handleCors };
