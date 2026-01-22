const { supabase, allowCors, verifyToken } = require('./_utils');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        verifyToken(req);
        const record = req.body;

        const { error } = await supabase
            .from('work_records')
            .insert({
                id: record.id,
                territory_id: record.territoryId,
                date: record.date,
                publisher_name: record.publisherName,
                notes: record.notes,
                photos: record.photos
            });

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao registrar trabalho.' });
        }

        res.status(201).json({ id: record.id });
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao registrar trabalho.' });
    }
};

module.exports = allowCors(handler);
