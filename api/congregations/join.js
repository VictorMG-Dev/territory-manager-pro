const jwt = require('jsonwebtoken');
const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);
        const { inviteCode } = req.body;

        const { data, error } = await supabase
            .from('congregations')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: 'Código de convite inválido.' });
        }

        const congregationId = data.id;

        const { error: updateError } = await supabase
            .from('users')
            .update({ congregation_id: congregationId })
            .eq('uid', user.uid);

        if (updateError) {
            console.error(updateError);
            return res.status(500).json({ message: 'Erro ao entrar na congregação.' });
        }

        // Generate new token with updated congregationId
        const newToken = jwt.sign({ uid: user.uid, email: user.email, role: user.role, congregationId }, process.env.JWT_SECRET || 'yoursecret');

        res.status(200).json({ success: true, congregationId, token: newToken });
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao entrar na congregação.' });
    }
};

module.exports = allowCors(handler);
