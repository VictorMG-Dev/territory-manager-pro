const { v4: uuidv4 } = require('uuid');
const { getSupabaseClient, verifyToken, handleCors, errorResponse, successResponse } = require('../_utils');

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return errorResponse(res, 'Method not allowed', 405);
    }

    try {
        const decoded = verifyToken(req);
        const { name, description } = req.body;

        if (!name) {
            return errorResponse(res, 'Nome da congregação é obrigatório');
        }

        const supabase = getSupabaseClient();
        const congregationId = uuidv4();
        const inviteCode = generateInviteCode();

        // Create congregation
        const { data: congregation, error: congError } = await supabase
            .from('congregations')
            .insert({
                id: congregationId,
                name,
                description: description || null,
                invite_code: inviteCode,
                created_by: decoded.userId
            })
            .select()
            .single();

        if (congError) {
            console.error('Congregation creation error:', congError);
            return errorResponse(res, 'Erro ao criar congregação');
        }

        // Update user to join congregation as elder
        const { error: updateError } = await supabase
            .from('users')
            .update({
                congregation_id: congregationId,
                role: 'elder'
            })
            .eq('id', decoded.userId);

        if (updateError) {
            console.error('User update error:', updateError);
        }

        return successResponse(res, {
            congregation: {
                id: congregation.id,
                name: congregation.name,
                description: congregation.description,
                inviteCode: congregation.invite_code
            }
        }, 201);

    } catch (error) {
        console.error('Create congregation error:', error);
        if (error.message === 'No token provided' || error.message === 'Invalid token') {
            return errorResponse(res, error.message, 401);
        }
        return errorResponse(res, 'Erro interno do servidor', 500);
    }
};
