const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase, allowCors } = require('../_utils');

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    console.log('--- Nova tentativa de Cadastro (Vercel) ---');
    console.log('Dados recebidos:', req.body);

    try {
        const { uid, name, email, password, congregationData } = req.body;

        if (!uid || !name || !email || !password) {
            console.log('❌ Dados incompletos');
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let congregationId = null;
        let role = 'publisher';

        // Handle congregation logic
        if (congregationData) {
            if (congregationData.inviteCode) {
                // Join existing congregation
                const { data: congData, error } = await supabase
                    .from('congregations')
                    .select('id')
                    .eq('invite_code', congregationData.inviteCode)
                    .single();

                if (error || !congData) {
                    return res.status(400).json({ message: 'Código de convite inválido.' });
                }
                congregationId = congData.id;
            } else if (congregationData.name) {
                // Create new congregation
                const crypto = require('crypto');
                congregationId = crypto.randomUUID();
                const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

                const { error } = await supabase
                    .from('congregations')
                    .insert({
                        id: congregationId,
                        name: congregationData.name,
                        description: congregationData.description || '',
                        invite_code: inviteCode,
                        created_by: uid
                    });

                if (error) {
                    console.error('Erro ao criar congregação:', error);
                    return res.status(500).json({ message: 'Erro ao criar congregação.' });
                }

                // Creator is an Elder
                role = 'elder';
            }
        }

        const { error: userError } = await supabase
            .from('users')
            .insert({
                uid,
                name,
                email,
                password: hashedPassword,
                congregation_id: congregationId,
                role
            });

        if (userError) {
            console.error('❌ Erro ao criar usuário:', userError);
            if (userError.code === '23505') { // Unique violation
                return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ message: 'Erro ao criar usuário.' });
        }

        const token = jwt.sign({ uid, email, role, congregationId }, process.env.JWT_SECRET || 'yoursecret');
        console.log(`✅ Usuário criado com sucesso: ${email}`);
        res.status(201).json({ token, user: { uid, name, email, congregationId, role } });

    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error.message);
        res.status(500).json({ message: 'Erro interno: ' + error.message });
    }
};

module.exports = allowCors(handler);
