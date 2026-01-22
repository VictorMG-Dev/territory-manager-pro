const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabaseClient, handleCors, errorResponse, successResponse } = require('../_utils');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return errorResponse(res, 'Method not allowed', 405);
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email e senha são obrigatórios');
        }

        const supabase = getSupabaseClient();

        // Find user by email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return errorResponse(res, 'Credenciais inválidas', 401);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return errorResponse(res, 'Credenciais inválidas', 401);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse(res, {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                congregationId: user.congregation_id,
                profileImage: user.profile_image,
                preferences: user.preferences
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse(res, 'Erro interno do servidor', 500);
    }
};
