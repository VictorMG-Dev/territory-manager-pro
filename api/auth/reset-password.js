const bcrypt = require('bcryptjs');
const { supabase, allowCors } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        const { data: tokens, error: tokenError } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false);

        if (tokenError || !tokens || tokens.length === 0) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        const resetToken = tokens[0];

        if (new Date(resetToken.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Token expirado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('uid', resetToken.user_id);

        if (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            return res.status(500).json({ message: 'Erro ao redefinir senha.' });
        }

        await supabase
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id', resetToken.id);

        console.log(`✅ Senha redefinida com sucesso para usuário: ${resetToken.user_id}`);
        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ message: 'Erro ao redefinir senha.' });
    }
};

module.exports = allowCors(handler);
