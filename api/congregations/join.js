const { getSupabaseClient, verifyToken, handleCors, errorResponse, successResponse } = require('../_utils');

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
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return errorResponse(res, 'Código de convite é obrigatório');
        }

        const supabase = getSupabaseClient();

        // Find congregation by invite code
        const { data: congregation, error: congError } = await supabase
            .from('congregations')
            .select('id, name')
            .eq('invite_code', inviteCode)
            .single();

        if (congError || !congregation) {
            return errorResponse(res, 'Código de convite inválido');
        }

        // Update user to join congregation
        const { error: updateError } = await supabase
            .from('users')
            .update({
                congregation_id: congregation.id,
                role: 'publisher'
            })
            .eq('id', decoded.userId);

        if (updateError) {
            console.error('User update error:', updateError);
            return errorResponse(res, 'Erro ao entrar na congregação');
        }

        return successResponse(res, {
            congregation: {
                id: congregation.id,
                name: congregation.name
            }
        });

    } catch (error) {
        console.error('Join congregation error:', error);
        if (error.message === 'No token provided' || error.message === 'Invalid token') {
            return errorResponse(res, error.message, 401);
        }
        return errorResponse(res, 'Erro interno do servidor', 500);
    }
};
