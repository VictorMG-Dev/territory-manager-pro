const { supabase, allowCors, verifyToken } = require('../../_utils');

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);

        const { data: userData } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('uid', user.uid)
            .single();

        if (!userData || !userData.congregation_id) {
            return res.status(200).json([]);
        }

        const { data: members } = await supabase
            .from('users')
            .select('uid, name, email, photo_url, role, created_at')
            .eq('congregation_id', userData.congregation_id);

        const formattedMembers = (members || []).map(m => ({
            uid: m.uid,
            name: m.name,
            email: m.email,
            photoURL: m.photo_url,
            role: m.role,
            joinedAt: m.created_at
        }));

        res.status(200).json(formattedMembers);
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao buscar membros.' });
    }
};

module.exports = allowCors(handler);
