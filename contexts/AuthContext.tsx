import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface User {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    congregationId?: string;
    congregationName?: string;
    role?: 'publisher' | 'territory_servant' | 'service_overseer' | 'elder' | 'admin';
    serviceRole?: 'publisher' | 'auxiliary_pioneer' | 'regular_pioneer';
    banner?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    googleLogin: () => Promise<void>;
    register: (name: string, email: string, password: string, congregationData?: { name?: string; description?: string; inviteCode?: string }) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    createCongregation: (name: string, description?: string) => Promise<any>;
    joinCongregation: (inviteCode: string) => Promise<void>;
    deleteCongregation: (congregationId: string) => Promise<void>;
    leaveCongregation: () => Promise<void>;
    switchCongregation: (inviteCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for active session from custom auth
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

        // Listen for Supabase Auth changes (Google Login)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const currentToken = localStorage.getItem('territory_token');
                // Only sync if we don't have a valid custom token or if we want to ensure sync
                // For simplicity, checking if we are not "logged in" in our custom system, or if the user is different?
                // Let's just do it if no user is set or no token.
                if (!localStorage.getItem('territory_token')) {
                    setLoading(true);
                    try {
                        const response = await api.post('/auth/google', { access_token: session.access_token });

                        setUser(response.user);
                        localStorage.setItem('territory_session', JSON.stringify(response.user));
                        localStorage.setItem('territory_token', response.token);

                        toast.success(`Bem-vindo pelo Google, ${response.user.name}!`);
                    } catch (error: any) {
                        console.error('Google Auth Error:', error);
                        toast.error(error.message || 'Erro ao autenticar com Google');
                        await supabase.auth.signOut(); // Force sign out if backend rejected
                    } finally {
                        setLoading(false);
                    }
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
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

    const googleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/login',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao conectar com Google');
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, congregationData?: { name?: string; description?: string; inviteCode?: string }) => {
        setLoading(true);
        console.log('Iniciando registro para:', email);
        try {
            const uid = uuidv4();
            const data = await api.post('/auth/register', { uid, name, email, password, congregationData });
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

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('territory_session');
        localStorage.removeItem('territory_token');
        await supabase.auth.signOut();
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

    const createCongregation = async (name: string, description?: string) => {
        if (!user) return;
        setLoading(true);
        try {
            const congregation = await api.post('/congregations', { name, description });

            // Update user with congregation info and new token
            const updatedUser = { ...user, congregationId: congregation.id, congregationName: name, role: 'elder' as const };
            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));

            // Update token if returned
            if (congregation.token) {
                localStorage.setItem('territory_token', congregation.token);
            }

            toast.success('Congregação criada com sucesso!');
            return congregation;
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao criar congregação');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const joinCongregation = async (inviteCode: string) => {
        if (!user) return;
        setLoading(true);
        try {
            const joinResponse = await api.post('/congregations/join', { inviteCode });

            // Refresh user data
            const response = await api.get('/congregations/my');
            const updatedUser = { ...user, congregationId: response.id, congregationName: response.name };
            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));

            // Update token if returned
            if (joinResponse.token) {
                localStorage.setItem('territory_token', joinResponse.token);
            }

            toast.success('Você entrou na congregação!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao entrar na congregação');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteCongregation = async (congregationId: string) => {
        setLoading(true);
        try {
            await api.delete(`/congregations/${congregationId}`);

            // Update user state (remove congregation)
            const updatedUser = { ...user!, congregationId: undefined, congregationName: undefined, role: 'publisher' as const };
            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));

            toast.success('Congregação excluída com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao excluir congregação');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const leaveCongregation = async () => {
        setLoading(true);
        try {
            const response = await api.post('/congregations/leave', {});

            // Update user state
            const updatedUser = { ...user!, congregationId: undefined, congregationName: undefined, role: 'publisher' as const };
            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));

            // Update token if returned
            if (response.token) {
                localStorage.setItem('territory_token', response.token);
            }

            toast.success('Você saiu da congregação.');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao sair da congregação');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const switchCongregation = async (inviteCode: string) => {
        setLoading(true);
        try {
            const response = await api.post('/congregations/switch', { inviteCode });

            // Update user state with new congregation
            const updatedUser = {
                ...user!,
                congregationId: response.congregationId,
                congregationName: response.congregationName,
                role: 'publisher' as const
            };
            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));

            // Update token if returned
            if (response.token) {
                localStorage.setItem('territory_token', response.token);
            }

            toast.success(response.message || 'Você trocou de congregação!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao trocar de congregação');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateProfile, updatePassword, createCongregation, joinCongregation, deleteCongregation, leaveCongregation, switchCongregation }}>
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

