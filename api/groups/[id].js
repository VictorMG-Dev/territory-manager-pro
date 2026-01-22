const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    try {
        verifyToken(req);
        const { id } = req.query;

        if (req.method === 'PUT') {
            const { name, description, color, territoryIds } = req.body;

            const { error } = await supabase
                .from('territory_groups')
                .update({
                    name,
                    description,
                    color,
                    territory_ids: territoryIds
                })
                .eq('id', id);

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao atualizar grupo.' });
            }

            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { error } = await supabase
                .from('territory_groups')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao excluir grupo.' });
            }

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });

    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro no servidor.' });
    }
};

module.exports = allowCors(handler);
