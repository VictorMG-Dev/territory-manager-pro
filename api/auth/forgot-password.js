const { getSupabaseClient, corsHeaders, handleCors, errorResponse, successResponse } = require('../_utils');

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
        const { email } = req.body;

        if (!email) {
            return errorResponse(res, 'Email é obrigatório.');
        }

        const supabase = getSupabaseClient();

        // Check if user exists
        const { data: users, error } = await supabase
            .from('users')
            .select('uid, email, name')
            .eq('email', email);

        if (error || !users || users.length === 0) {
            // Don't reveal if email exists or not for security
            return successResponse(res, {
                message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
            });
        }

        const user = users[0];

        // Generate reset token
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        const { error: tokenError } = await supabase
            .from('password_reset_tokens')
            .insert({
                user_id: user.uid,
                token,
                expires_at: expiresAt.toISOString()
            });

        if (tokenError) {
            console.error('Erro ao criar token:', tokenError);
            return errorResponse(res, 'Erro ao processar solicitação.', 500);
        }

        // In production, send email with reset link
        // For now, log the token to console
        console.log('🔑 PASSWORD RESET TOKEN 🔑');
        console.log('Email:', email);
        console.log('Token:', token);
        console.log('Reset URL:', `https://territory-manager-pro.vercel.app/reset-password?token=${token}`);
        console.log('Expires at:', expiresAt.toLocaleString());
        console.log('========================');

        return successResponse(res, {
            message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
        });
    } catch (error) {
        console.error('Erro ao processar recuperação de senha:', error);
        return errorResponse(res, 'Erro ao processar solicitação.', 500);
    }
};
