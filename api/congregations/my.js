const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req); // Only needs verification, getting data from DB fresh

        const { data: userData } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('uid', user.uid)
            .single();

        if (!userData || !userData.congregation_id) {
            return res.status(200).json(null);
        }

        const { data: congData } = await supabase
            .from('congregations')
            .select('*')
            .eq('id', userData.congregation_id)
            .single();

        if (!congData) {
            return res.status(200).json(null);
        }

        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('congregation_id', userData.congregation_id);

        congData.memberCount = count || 0;
        congData.inviteCode = congData.invite_code;

        res.status(200).json(congData);
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao buscar congregação.' });
    }
};

module.exports = allowCors(handler);
