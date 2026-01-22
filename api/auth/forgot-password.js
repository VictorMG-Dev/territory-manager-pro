const { supabase, allowCors } = require('../_utils');
const crypto = require('crypto');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email é obrigatório.' });
        }

        // Check if user exists
        const { data: users, error } = await supabase
            .from('users')
            .select('uid, email, name')
            .eq('email', email);

        if (error || !users || users.length === 0) {
            return res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha.' });
        }

        const user = users[0];

        // Generate reset token
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
            return res.status(500).json({ message: 'Erro ao processar solicitação.' });
        }

        // In production, send email with reset link
        console.log('🔑 PASSWORD RESET TOKEN 🔑');
        console.log('Email:', email);
        console.log('Token:', token);
        console.log('Expires at:', expiresAt.toLocaleString());
        console.log('========================');

        res.status(200).json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha.' });
    } catch (error) {
        console.error('Erro ao processar recuperação de senha:', error);
        res.status(500).json({ message: 'Erro ao processar solicitação.' });
    }
};

module.exports = allowCors(handler);
