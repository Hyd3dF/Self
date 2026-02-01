import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://pocketbase-v4okssck4c0s4ccowkoowccs.91.99.182.76.sslip.io');

interface User {
    id: string;
    or: string; // name
    email: string;
    explanation?: string;
    userprofile?: string;
    time?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    pb: PocketBase;
}

interface RegisterData {
    or: string; // name
    email: string;
    password: string;
    explanation?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            if (pb.authStore.isValid && pb.authStore.record) {
                const userData = pb.authStore.record as any;
                setUser({
                    id: userData.id,
                    or: userData.or || '',
                    email: userData.email || '',
                    explanation: userData.explanation,
                    userprofile: userData.userprofile,
                    time: userData.time,
                });
            }
        } catch (error) {
            console.log('No existing auth');
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        if (!user?.id) return;
        try {
            const userData = await pb.collection('deneme').getOne(user.id);
            setUser({
                id: userData.id,
                or: userData.or || '',
                email: userData.email || '',
                explanation: userData.explanation,
                userprofile: userData.userprofile,
                time: userData.time,
            });
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Find user by email
            const records = await pb.collection('deneme').getList(1, 1, {
                filter: `email="${email}"`,
            });

            if (records.items.length === 0) {
                return { success: false, error: 'User not found' };
            }

            const userData = records.items[0];

            // Check password (simple comparison since deneme is not auth collection)
            if (userData.password !== password) {
                return { success: false, error: 'Invalid password' };
            }

            setUser({
                id: userData.id,
                or: userData.or || '',
                email: userData.email || '',
                explanation: userData.explanation,
                userprofile: userData.userprofile,
                time: userData.time,
            });

            return { success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
        try {
            // Check if email already exists
            const existing = await pb.collection('deneme').getList(1, 1, {
                filter: `email="${data.email}"`,
            });

            if (existing.items.length > 0) {
                return { success: false, error: 'Email already registered' };
            }

            // Create new user
            const newUser = await pb.collection('deneme').create({
                or: data.or,
                email: data.email,
                password: data.password,
                explanation: data.explanation || '',
                time: new Date().toISOString(),
            });

            setUser({
                id: newUser.id,
                or: newUser.or || '',
                email: newUser.email || '',
                explanation: newUser.explanation,
                userprofile: newUser.userprofile,
                time: newUser.time,
            });

            return { success: true };
        } catch (error: any) {
            console.error('Register error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const logout = () => {
        pb.authStore.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                pb,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
