const bcrypt = require('bcryptjs');
const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);
        const { name, photoURL, email, password } = req.body;
        const uid = user.uid;

        console.log('--- Atualização de Perfil Recebida ---');

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (photoURL !== undefined) updates.photo_url = photoURL;
        if (email !== undefined) updates.email = email;
        if (password !== undefined && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.password = hashedPassword;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Nenhum dado para atualizar.' });
        }

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('uid', uid);

        if (error) {
            console.error('Erro na atualização:', error);
            if (error.code === '23505') {
                return res.status(400).json({ message: 'Este e-mail já está sendo usado.' });
            }
            return res.status(500).json({ message: 'Erro ao atualizar perfil.' });
        }

        // Fetch updated user
        const { data: userData } = await supabase
            .from('users')
            .select('uid, name, email, photo_url')
            .eq('uid', uid)
            .single();

        res.status(200).json({ user: { ...userData, photoURL: userData.photo_url } });
    } catch (error) {
        console.error('Erro na atualização de perfil:', error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao atualizar perfil.' });
    }
};

module.exports = allowCors(handler);
