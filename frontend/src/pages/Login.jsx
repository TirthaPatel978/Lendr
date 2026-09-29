import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/useAuth';
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

    const from = location.state?.from?.pathname || '/dashboard';

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await login(
                formData.email,
                formData.password
            );

            navigate(from, { replace: true });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to log in. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-5 py-12 sm:px-8">
            <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">

                {/* Left visual section */}
                <div className="hidden bg-blue-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div className="mb-8 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                            Local sharing, made simple
                        </div>

                        <h1 className="max-w-md text-5xl font-semibold leading-tight tracking-tight">
                            Borrow what you need.
                            <br />
                            Share what you have.
                        </h1>

                        <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
                            Find useful equipment around you, rent it from
                            people nearby, and give your unused items a
                            second life.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                        <p className="text-sm leading-6 text-blue-50">
                            From drills and ladders to everyday equipment,
                            Lendr connects people in the same local
                            community.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex items-center justify-center p-7 sm:p-12 lg:p-16">
                    <div className="w-full max-w-md">

                        <div className="mb-8">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
                                Welcome back
                            </p>

                            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                                Sign in to Lendr
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Access your listings, borrowings and requests.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Password
                                </label>

                                <div className="relative">
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
                                        required
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? 'Signing in...'
                                    : 'Sign in'}

                                {!loading && <ArrowRight size={17} />}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Login;