const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    try {
        const user = verifyToken(req);

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('territories')
                .select('*');

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao buscar territórios.' });
            }

            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const territory = req.body;

            const { error } = await supabase
                .from('territories')
                .insert({
                    id: territory.id,
                    user_id: territory.userId,
                    code: territory.code,
                    name: territory.name,
                    address: territory.address,
                    observations: territory.observations,
                    status: territory.status,
                    size: territory.size,
                    geolocation: territory.geolocation,
                    images: territory.images
                });

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao salvar território.' });
            }

            return res.status(201).json({ id: territory.id });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });

    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro no servidor.' });
    }
};

module.exports = allowCors(handler);
