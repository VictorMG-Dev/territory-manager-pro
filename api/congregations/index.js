const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase, allowCors, verifyToken } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const user = verifyToken(req);
        const { name, description } = req.body;

        const id = crypto.randomUUID();
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const { error: congError } = await supabase
            .from('congregations')
            .insert({
                id,
                name,
                description: description || '',
                invite_code: inviteCode,
                created_by: user.uid
            });

        if (congError) {
            console.error(congError);
            return res.status(500).json({ message: 'Erro ao criar congregação.' });
        }

        // Update user's congregation and make them an elder
        const { error: userError } = await supabase
            .from('users')
            .update({ congregation_id: id, role: 'elder' })
            .eq('uid', user.uid);

        if (userError) {
            console.error(userError);
        }

        // Generate new token with updated congregationId and role
        const newToken = jwt.sign({ uid: user.uid, email: user.email, role: 'elder', congregationId: id }, process.env.JWT_SECRET || 'yoursecret');

        res.status(201).json({
            id,
            name,
            description,
            inviteCode,
            createdBy: user.uid,
            role: 'elder',
            token: newToken
        });
    } catch (error) {
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Erro ao criar congregação.' });
    }
};

module.exports = allowCors(handler);
