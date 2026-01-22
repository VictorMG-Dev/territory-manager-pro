const { getSupabaseClient, corsHeaders, handleCors, errorResponse, successResponse } = require('../_utils');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });

    // Handle CORS preflight
    if (handleCors(req, res)) return;

    // Only allow POST
    if (req.method !== 'POST') {
        return errorResponse(res, 'Method not allowed', 405);
    }

    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return errorResponse(res, 'Token e nova senha são obrigatórios.');
        }

        if (newPassword.length < 6) {
            return errorResponse(res, 'A senha deve ter pelo menos 6 caracteres.');
        }

        const supabase = getSupabaseClient();

        // Find valid token
        const { data: tokens, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false);

        if (tokenError || !tokens || tokens.length === 0) {
            return errorResponse(res, 'Token inválido ou expirado.');
        }

        const resetToken = tokens[0];

        // Check if token is expired
        if (new Date(resetToken.expires_at) < new Date()) {
            return errorResponse(res, 'Token expirado.');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('uid', resetToken.user_id);

        if (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            return errorResponse(res, 'Erro ao redefinir senha.', 500);
        }

        // Mark token as used
        await supabase
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id', resetToken.id);

        console.log(`✅ Senha redefinida com sucesso para usuário: ${resetToken.user_id}`);
        return successResponse(res, { message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        return errorResponse(res, 'Erro ao redefinir senha.', 500);
    }
};
