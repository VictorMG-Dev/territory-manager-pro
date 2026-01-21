import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

export interface User {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for active session
        const session = localStorage.getItem('territory_session');
        if (session) {
            try {
                setUser(JSON.parse(session));
            } catch (error) {
                console.error('Failed to parse session', error);
                localStorage.removeItem('territory_session');
                localStorage.removeItem('territory_token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const data = await api.post('/auth/login', { email, password });

            setUser(data.user);
            localStorage.setItem('territory_session', JSON.stringify(data.user));
            localStorage.setItem('territory_token', data.token);

            toast.success(`Bem-vindo de volta, ${data.user.name}!`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao realizar login');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setLoading(true);
        console.log('Iniciando registro para:', email);
        try {
            const uid = uuidv4();
            const data = await api.post('/auth/register', { uid, name, email, password });
            console.log('Resposta do registro:', data);

            setUser(data.user);
            localStorage.setItem('territory_session', JSON.stringify(data.user));
            localStorage.setItem('territory_token', data.token);

            toast.success('Conta criada com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao criar conta');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('territory_session');
        localStorage.removeItem('territory_token');
        toast.success('Você saiu do sistema.');
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.put('/auth/profile', data);
            const updatedUser = response.user;

            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao atualizar perfil');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (password: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await api.put('/auth/profile', { password });
            toast.success('Senha atualizada com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao atualizar senha');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updatePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
