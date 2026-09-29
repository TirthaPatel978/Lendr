import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, MapPin } from 'lucide-react';

import { useAuth } from '../context/useAuth';

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        if (!formData.name.trim()) {
            setError('Please enter your name.');
            return;
        }

        if (!formData.email.trim()) {
            setError('Please enter your email.');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must contain at least 6 characters.');
            return;
        }

        try {
            setLoading(true);

            await register(
                formData.name.trim(),
                formData.email.trim(),
                formData.password
            );

            navigate('/dashboard');

        } catch (error) {
            console.error('Registration error:', error);

            const backendMessage =
                error.response?.data?.message;

            setError(
                backendMessage ||
                'Unable to create your account. Please try again.'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">

            <section className="auth-visual">
                <div className="auth-visual-overlay" />

                <div className="auth-visual-content">

                    <div className="auth-location-pill">
                        <MapPin size={15} />
                        Equipment sharing, close to home
                    </div>

                    <h1>
                        Good things are
                        <span>better when shared.</span>
                    </h1>

                    <p>
                        Join your local community and discover useful
                        equipment without buying something you'll only
                        use once.
                    </p>

                    <div className="auth-visual-items">
                        <div className="visual-object visual-object-one" />
                        <div className="visual-object visual-object-two" />
                        <div className="visual-object visual-object-three" />
                    </div>

                </div>
            </section>

            <section className="auth-form-section">

                <div className="auth-form-wrapper">

                    <Link
                        to="/"
                        className="auth-logo"
                    >
                        lendr<span>.</span>
                    </Link>

                    <div className="auth-heading">
                        <p className="eyebrow">
                            JOIN LENDR
                        </p>

                        <h2>
                            Create your account
                        </h2>

                        <p>
                            Start discovering useful things from
                            people around you.
                        </p>
                    </div>

                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-field">
                            <label htmlFor="name">
                                Full name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="password-input">
                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading
                                ? 'Creating account...'
                                : 'Create account'
                            }

                            {!loading && (
                                <ArrowRight size={17} />
                            )}
                        </button>

                    </form>

                    <p className="auth-switch">
                        Already have an account?

                        <Link to="/login">
                            Sign in
                        </Link>
                    </p>

                    <p className="auth-terms">
                        By creating an account, you agree to use Lendr
                        responsibly and respect the people and equipment
                        in your community.
                    </p>

                </div>

            </section>

        </main>
    );
}

export default Register;