const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, allowCors } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;

        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error || !users || users.length === 0) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: 'Email ou senha incorretos.' });
        }

        // Get congregation info if user has one
        let congregationName = null;
        if (user.congregation_id) {
            const { data: congData } = await supabase
                .from('congregations')
                .select('name')
                .eq('id', user.congregation_id)
                .single();

            if (congData) {
                congregationName = congData.name;
            }
        }

        const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role, congregationId: user.congregation_id }, process.env.JWT_SECRET || 'yoursecret');

        res.status(200).json({
            token,
            user: {
                uid: user.uid,
                name: user.name,
                email: user.email,
                photoURL: user.photo_url,
                congregationId: user.congregation_id,
                congregationName: congregationName,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao realizar login.' });
    }
};

module.exports = allowCors(handler);
