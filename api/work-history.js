const { supabase, allowCors, verifyToken } = require('./_utils');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        verifyToken(req);

        const { data, error } = await supabase
            .from('work_records')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar histórico.' });
        }

        res.status(200).json(data || []);
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao buscar histórico.' });
    }
};

module.exports = allowCors(handler);
