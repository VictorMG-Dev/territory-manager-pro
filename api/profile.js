const { getSupabaseClient, verifyToken, handleCors, errorResponse, successResponse } = require('./_utils');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (handleCors(req, res)) return;

    try {
        const decoded = verifyToken(req);
        const supabase = getSupabaseClient();

        if (req.method === 'GET') {
            // Get user profile
            const { data: user, error } = await supabase
                .from('users')
                .select(`
                    id,
                    name,
                    email,
                    role,
                    profile_image,
                    congregation_id,
                    preferences,
                    created_at
                `)
                .eq('id', decoded.userId)
                .single();

            if (error) {
                console.error('Profile fetch error:', error);
                return errorResponse(res, 'Erro ao buscar perfil');
            }

            // Get congregation info if user has one
            let congregation = null;
            if (user.congregation_id) {
                const { data: congData } = await supabase
                    .from('congregations')
                    .select('id, name, description, invite_code')
                    .eq('id', user.congregation_id)
                    .single();

                if (congData) {
                    congregation = {
                        id: congData.id,
                        name: congData.name,
                        description: congData.description,
                        inviteCode: congData.invite_code
                    };
                }
            }

            return successResponse(res, {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profile_image,
                congregationId: user.congregation_id,
                congregation,
                preferences: user.preferences,
                createdAt: user.created_at
            });

        } else if (req.method === 'PUT') {
            // Update user profile
            const { name, profileImage, preferences } = req.body;

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (profileImage !== undefined) updates.profile_image = profileImage;
            if (preferences !== undefined) updates.preferences = preferences;

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', decoded.userId)
                .select()
                .single();

            if (error) {
                console.error('Profile update error:', error);
                return errorResponse(res, 'Erro ao atualizar perfil');
            }

            return successResponse(res, {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                profileImage: updatedUser.profile_image,
                congregationId: updatedUser.congregation_id,
                preferences: updatedUser.preferences
            });

        } else {
            return errorResponse(res, 'Method not allowed', 405);
        }

    } catch (error) {
        console.error('Profile error:', error);
        if (error.message === 'No token provided' || error.message === 'Invalid token') {
            return errorResponse(res, error.message, 401);
        }
        return errorResponse(res, 'Erro interno do servidor', 500);
    }
};
