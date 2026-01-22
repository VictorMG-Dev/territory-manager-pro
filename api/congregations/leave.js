const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);

        const { error } = await supabase
            .from('users')
            .update({ congregation_id: null })
            .eq('uid', user.uid);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao sair da congregação.' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao sair da congregação.' });
    }
};

module.exports = allowCors(handler);
