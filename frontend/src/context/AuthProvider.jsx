import { useEffect, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('lendrToken');

            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/me');

                setUser(response.data.user);
            } catch (error) {
                console.error('Failed to load user:', error);

                localStorage.removeItem('lendrToken');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', {
            email,
            password
        });

        localStorage.setItem('lendrToken', response.data.token);
        setUser(response.data.user);

        return response.data;
    };

    const register = async (name, email, password) => {
        const response = await api.post('/auth/register', {
            name,
            email,
            password
        });

        localStorage.setItem('lendrToken', response.data.token);
        setUser(response.data.user);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('lendrToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}