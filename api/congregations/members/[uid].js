const { supabase, allowCors, verifyToken } = require('../../_utils');

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);
        const { uid } = req.query; // target uid from path
        const requesterRole = user.role;

        const roleLevels = {
            'publisher': 1,
            'territory_servant': 2,
            'service_overseer': 3,
            'elder': 4
        };

        const requesterLevel = roleLevels[requesterRole] || 0;

        if (requesterLevel < 3) {
            return res.status(403).json({ message: 'Você não tem permissão para remover membros.' });
        }

        if (uid === user.uid) {
            return res.status(400).json({ message: 'Você não pode remover a si mesmo.' });
        }

        const { data: requesterData } = await supabase
            .from('users')
            .select('congregation_id')
            .eq('uid', user.uid)
            .single();

        if (!requesterData || !requesterData.congregation_id) {
            return res.status(403).json({ message: 'Você não está em uma congregação.' });
        }

        const { data: targetUser } = await supabase
            .from('users')
            .select('congregation_id, role')
            .eq('uid', uid)
            .single();

        if (!targetUser || targetUser.congregation_id !== requesterData.congregation_id) {
            return res.status(404).json({ message: 'Usuário não encontrado na sua congregação.' });
        }

        const targetUserLevel = roleLevels[targetUser.role || 'publisher'];

        if (requesterRole === 'service_overseer' && targetUserLevel >= 3) {
            return res.status(403).json({ message: 'Você não pode remover alguém com cargo igual ou superior ao seu.' });
        }

        if (targetUser.role === 'elder' && requesterRole === 'elder') {
            return res.status(403).json({ message: 'Anciãos não podem remover outros anciãos.' });
        }

        const { error } = await supabase
            .from('users')
            .update({ congregation_id: null, role: 'publisher' })
            .eq('uid', uid);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao remover membro.' });
        }

        res.status(200).json({ success: true, message: 'Membro removido com sucesso.' });
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao remover membro.' });
    }
};

module.exports = allowCors(handler);
