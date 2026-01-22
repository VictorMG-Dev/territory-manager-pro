const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    try {
        verifyToken(req);

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('territory_groups')
                .select('*');

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao buscar grupos.' });
            }

            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const group = req.body;

            const { error } = await supabase
                .from('territory_groups')
                .insert({
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    color: group.color,
                    territory_ids: group.territoryIds
                });

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao salvar grupo.' });
            }

            return res.status(201).json({ id: group.id });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });

    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro no servidor.' });
    }
};

module.exports = allowCors(handler);
