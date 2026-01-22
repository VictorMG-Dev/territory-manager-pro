const { supabase, allowCors } = require('../../_utils');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Vercel extracts path parameters into req.query
        const { inviteCode } = req.query;

        const { data, error } = await supabase
            .from('congregations')
            .select('id, name, description')
            .eq('invite_code', inviteCode)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: 'Código de convite inválido.' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao validar código.' });
    }
};

module.exports = allowCors(handler);
