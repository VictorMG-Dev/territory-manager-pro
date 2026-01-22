const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getSupabaseClient, corsHeaders, handleCors, errorResponse, successResponse } = require('../_utils');

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
        const { name, email, password, congregationId } = req.body;

        if (!name || !email || !password) {
            return errorResponse(res, 'Nome, email e senha são obrigatórios');
        }

        const supabase = getSupabaseClient();

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return errorResponse(res, 'Email já cadastrado');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userId = uuidv4();
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                name,
                email,
                password: hashedPassword,
                congregation_id: congregationId || null,
                role: 'publisher',
                preferences: {}
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return errorResponse(res, 'Erro ao criar usuário');
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse(res, {
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                congregationId: newUser.congregation_id,
                preferences: newUser.preferences
            }
        }, 201);

    } catch (error) {
        console.error('Register error:', error);
        return errorResponse(res, 'Erro interno do servidor', 500);
    }
};
