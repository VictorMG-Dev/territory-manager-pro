const { supabase, allowCors, verifyToken } = require('../../../_utils');

const handler = async (req, res) => {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);
        const { uid } = req.query; // target uid from path
        const { role } = req.body;
        const requesterRole = user.role;

        // Role hierarchy levels
        const roleLevels = {
            'publisher': 1,
            'territory_servant': 2,
            'service_overseer': 3,
            'elder': 4
        };

        const requesterLevel = roleLevels[requesterRole] || 0;
        const newRoleLevel = roleLevels[role] || 0;

        if (requesterLevel < 2) {
            return res.status(403).json({ message: 'Você não tem permissão para gerenciar cargos.' });
        }

        if (requesterRole !== 'elder' && newRoleLevel >= requesterLevel) {
            return res.status(403).json({ message: 'Você não pode promover alguém a um cargo igual ou superior ao seu.' });
        }

        // Verify target user
        const { data: targetUser } = await supabase
            .from('users')
            .select('congregation_id, role')
            .eq('uid', uid)
            .single();

        if (!targetUser || targetUser.congregation_id !== user.congregationId) {
            return res.status(404).json({ message: 'Usuário não encontrado na sua congregação.' });
        }

        const targetUserLevel = roleLevels[targetUser.role || 'publisher'];

        if (requesterRole !== 'elder' && targetUserLevel >= requesterLevel) {
            return res.status(403).json({ message: 'Você não pode alterar o cargo de alguém com hierarquia igual ou superior.' });
        }

        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('uid', uid);

        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar cargo.' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao atualizar cargo.' });
    }
};

module.exports = allowCors(handler);
