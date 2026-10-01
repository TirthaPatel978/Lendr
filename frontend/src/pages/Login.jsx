import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Eye,
    EyeOff,
    MapPin,
    ArrowRight
} from 'lucide-react';

import { useAuth } from '../context/useAuth';

import './Login.css';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const from =
        location.state?.from?.pathname ||
        '/dashboard';

    const handleChange = (event) => {
        setFormData((current) => ({
            ...current,
            [event.target.name]: event.target.value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await login(
                formData.email.trim(),
                formData.password
            );

            navigate(from, {
                replace: true
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to log in. Please check your details and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">

            <div className="login-layout">

                {/* LEFT SIDE */}
                <section className="login-left">

                    <div className="login-left-glow" />

                    <div className="login-left-content">

                        <div className="login-location-badge">
                            <MapPin size={14} />
                            <span>
                                Equipment sharing, close to home
                            </span>
                        </div>

                        <h1 className="login-main-heading">
                            Borrow what
                            <br />
                            you need.
                            <br />
                            <em>Share what you have.</em>
                        </h1>

                        <p className="login-description">
                            Find useful equipment around you,
                            borrow it from people nearby, and
                            keep useful things moving through
                            your community.
                        </p>

                    </div>

                    {/* Decorative cards */}
                    <div className="login-decoration">

                        <div className="login-decoration-card login-card-one" />

                        <div className="login-decoration-card login-card-two" />

                        <div className="login-decoration-card login-card-three" />

                    </div>

                    <div className="login-decoration-circle" />

                </section>


                {/* RIGHT SIDE */}
                <section className="login-right">

                    <div className="login-form-container">

                        {/* Logo */}
                        <Link
                            to="/"
                            className="login-logo"
                        >
                            lendr<span>.</span>
                        </Link>


                        {/* Header */}
                        <div className="login-header">

                            <span className="login-eyebrow">
                                YOUR LENDR SPACE
                            </span>

                            <h2>
                                Sign in to Lendr
                            </h2>

                            <p>
                                Access your listings, borrowings
                                and requests.
                            </p>

                        </div>


                        {/* Error */}
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}


                        {/* Form */}
                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="login-field">

                                <label htmlFor="email">
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />

                            </div>


                            <div className="login-field">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="login-password">

                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="login-password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                (current) => !current
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>

                                </div>

                            </div>


                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                            >

                                <span>
                                    {loading
                                        ? 'Signing in...'
                                        : 'Sign in'}
                                </span>

                                {!loading && (
                                    <ArrowRight size={17} />
                                )}

                            </button>

                        </form>


                        {/* Register */}
                        <div className="login-register">

                            <span>
                                Don't have an account?
                            </span>

                            <Link to="/register">
                                Get started
                                <ArrowRight size={14} />
                            </Link>

                        </div>


                        {/* Footer */}
                        <p className="login-footer">
                            By signing in, you agree to use Lendr responsibly
                            and respect the people and equipment in your
                            community.
                        </p>

                    </div>

                </section>

            </div>

        </main>
    );
}

export default Login;