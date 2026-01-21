
const API_URL = 'http://localhost:3002/api';

const getHeaders = () => {
    const token = localStorage.getItem('territory_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    async post(endpoint: string, body: any) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Erro do servidor: ${response.status}`);
            }
            return data;
        } catch (error: any) {
            console.error('API Post Error:', error);
            throw new Error(error.message === 'Failed to fetch'
                ? 'Não foi possível conectar ao servidor. Verifique se o node index.js está rodando.'
                : error.message);
        }
    },

    async get(endpoint: string) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: getHeaders()
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Erro do servidor: ${response.status}`);
            }
            return data;
        } catch (error: any) {
            console.error('API Get Error:', error);
            throw new Error(error.message);
        }
    },

    async put(endpoint: string, body: any) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Erro do servidor: ${response.status}`);
            }
            return data;
        } catch (error: any) {
            console.error('API Put Error:', error);
            throw new Error(error.message);
        }
    }
};
