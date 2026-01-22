const { getSupabaseClient, verifyToken, handleCors, errorResponse, successResponse } = require('../_utils');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (handleCors(req, res)) return;

    if (req.method !== 'GET') {
        return errorResponse(res, 'Method not allowed', 405);
    }

    try {
        const decoded = verifyToken(req);
        const supabase = getSupabaseClient();

        // Get user's congregation
        const { data: user } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('id', decoded.userId)
            .single();

        if (!user || !user.congregation_id) {
            return successResponse(res, { members: [] });
        }

        // Get all members of the congregation
        const { data: members, error } = await supabase
            .from('users')
            .select('id, name, email, role, profile_image, created_at')
            .eq('congregation_id', user.congregation_id)
            .order('name');

        if (error) {
            console.error('Members fetch error:', error);
            return errorResponse(res, 'Erro ao buscar membros');
        }

        return successResponse(res, {
            members: members.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
                profileImage: m.profile_image,
                joinedAt: m.created_at
            }))
        });

    } catch (error) {
        console.error('Get members error:', error);
        if (error.message === 'No token provided' || error.message === 'Invalid token') {
            return errorResponse(res, error.message, 401);
        }
        return errorResponse(res, 'Erro interno do servidor', 500);
    }
};
