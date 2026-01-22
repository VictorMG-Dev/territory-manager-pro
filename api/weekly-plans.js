const { supabase, allowCors, verifyToken } = require('./_utils');

const handler = async (req, res) => {
    try {
        verifyToken(req);

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('weekly_plans')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao buscar planejamentos.' });
            }

            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const plan = req.body;

            const { error } = await supabase
                .from('weekly_plans')
                .insert({
                    id: plan.id,
                    group_id: plan.groupId,
                    start_date: plan.startDate,
                    days: plan.days
                });

            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Erro ao salvar planejamento.' });
            }

            return res.status(201).json({ id: plan.id });
        }

        return res.status(405).json({ message: 'Method Not Allowed' });

    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro no servidor.' });
    }
};

module.exports = allowCors(handler);
