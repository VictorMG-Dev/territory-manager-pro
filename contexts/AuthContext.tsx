import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface User {
    uid: string;
    email: string;
    name: string;
    displayName?: string;
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
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const users = JSON.parse(localStorage.getItem('territory_users') || '[]');
            const foundUser = users.find((u: any) => u.email === email && u.password === password);

            if (foundUser) {
                const userObj = {
                    uid: foundUser.uid,
                    email: foundUser.email,
                    name: foundUser.name,
                    displayName: foundUser.displayName || foundUser.name,
                    photoURL: foundUser.photoURL
                };
                setUser(userObj);
                localStorage.setItem('territory_session', JSON.stringify(userObj));
                toast.success(`Bem-vindo de volta, ${foundUser.name}!`);
            } else {
                throw new Error('Email ou senha incorretos.');
            }
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
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const users = JSON.parse(localStorage.getItem('territory_users') || '[]');

            if (users.some((u: any) => u.email === email)) {
                throw new Error('Este email já está cadastrado.');
            }

            const newUser = {
                uid: crypto.randomUUID(),
                name,
                email,
                password // In a real app, never store passwords in plain text!
            };

            users.push(newUser);
            localStorage.setItem('territory_users', JSON.stringify(users));

            // Auto login after register
            const userObj = {
                uid: newUser.uid,
                email: newUser.email,
                name: newUser.name,
                displayName: newUser.name
            };
            setUser(userObj);
            localStorage.setItem('territory_session', JSON.stringify(userObj));

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
        toast.success('Você saiu do sistema.');
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const updatedUser = { ...user, ...data };

            // Sync name and displayName if one changes
            if (data.displayName) updatedUser.name = data.displayName;
            if (data.name) updatedUser.displayName = data.name;

            setUser(updatedUser);
            localStorage.setItem('territory_session', JSON.stringify(updatedUser));

            // Update in users storage
            const users = JSON.parse(localStorage.getItem('territory_users') || '[]');
            const updatedUsers = users.map((u: any) =>
                u.uid === user.uid ? { ...u, ...data, ...updatedUser } : u
            );
            localStorage.setItem('territory_users', JSON.stringify(updatedUsers));

            // toast.success('Perfil atualizado com sucesso!'); 
            // Commented out to avoid double toast with Profile.tsx
        } catch (error: any) {
            console.error(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (password: string) => {
        if (!user) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const users = JSON.parse(localStorage.getItem('territory_users') || '[]');
            const updatedUsers = users.map((u: any) =>
                u.uid === user.uid ? { ...u, password } : u
            );
            localStorage.setItem('territory_users', JSON.stringify(updatedUsers));

            toast.success('Senha atualizada com sucesso!');
        } catch (error: any) {
            console.error(error);
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
