const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    try {
        const user = verifyToken(req);
        const { id } = req.query; // From path [id]

        if (req.method === 'PUT') {
            const updates = req.body;
            const dbUpdates = {};

            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.code !== undefined) dbUpdates.code = updates.code;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.observations !== undefined) dbUpdates.observations = updates.observations;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.size !== undefined) dbUpdates.size = updates.size;
            if (updates.lastWorkedDate !== undefined) dbUpdates.last_worked_date = updates.lastWorkedDate;
            if (updates.lastWorkedBy !== undefined) dbUpdates.last_worked_by = updates.lastWorkedBy;
            if (updates.daysSinceWork !== undefined) dbUpdates.days_since_work = updates.daysSinceWork;
            if (updates.geolocation !== undefined) dbUpdates.geolocation = updates.geolocation;
            if (updates.images !== undefined) dbUpdates.images = updates.images;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase
                    .from('territories')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Erro ao atualizar território.' });
                }
            }

            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { error } = await supabase
                .from('territories')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao excluir território.' });
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
