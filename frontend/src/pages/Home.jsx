import { useEffect, useState } from 'react';
import api from '../services/api';

function Home() {
    const [message, setMessage] = useState('Connecting...');
    const [error, setError] = useState('');

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await api.get('/');

                setMessage(response.data.message);
            } catch (error) {
                console.error(error);

                setError('Could not connect to Lendr backend');
            }
        };

        checkBackend();
    }, []);

    return (
        <main>
            <h1>Lendr</h1>

            {error ? (
                <p>{error}</p>
            ) : (
                <p>{message}</p>
            )}
        </main>
    );
}

export default Home;