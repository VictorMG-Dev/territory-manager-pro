// Shared utilities for Vercel Serverless Functions
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase client
const getSupabaseClient = () => {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
};

// Verify JWT token
const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }

    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Handle CORS preflight
const handleCors = (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(200).json({});
        return true;
    }
    return false;
};

// Error response helper
const errorResponse = (res, message, status = 400) => {
    return res.status(status).json({ error: message });
};

// Success response helper
const successResponse = (res, data, status = 200) => {
    return res.status(status).json(data);
};

module.exports = {
    getSupabaseClient,
    verifyToken,
    corsHeaders,
    handleCors,
    errorResponse,
    successResponse
};
