import { useState } from 'react';

import {
    Link,
    useNavigate
} from 'react-router-dom';

import {
    Search,
    UserRound,
    Bell,
    ShieldCheck
} from 'lucide-react';

import { useAuth } from '../context/useAuth';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');

    const isAdmin = user?.role === 'ADMIN';

    const handleSearch = (event) => {
        event.preventDefault();

        const value = search.trim();

        if (!value) {
            navigate('/browse');
            return;
        }

        navigate(
            `/browse?search=${encodeURIComponent(value)}`
        );
    };

    const handleLogout = async () => {
        await logout();
        navigate('/home');
    };

    return (
        <header className="navbar">
            <div className="navbar-inner">

                <Link
                    to="/home"
                    className="navbar-logo"
                >
                    lendr<span>.</span>
                </Link>

                <nav className="navbar-center">
                    <Link
                        to="/home"
                        className="navbar-link"
                    >
                        Home
                    </Link>

                    <Link
                        to="/browse"
                        className="navbar-link"
                    >
                        Browse
                    </Link>

                    <Link to="/how-it-works" className="navbar-link">
                        How it works
                    </Link>

                    <Link to="/about" className="navbar-link">
                        About
                    </Link>
                </nav>

                <form
                    className="navbar-search"
                    onSubmit={handleSearch}
                >
                    <Search size={16} />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search equipment..."
                        aria-label="Search equipment"
                    />
                </form>

                <div className="navbar-actions">
                    {user ? (
                        <>
                            {!isAdmin && (
                                <>
                                    <Link
                                        to="/notifications"
                                        className="navbar-link"
                                        title="Notifications"
                                        aria-label="Notifications"
                                    >
                                        <Bell size={17} />
                                    </Link>

                                    <Link
                                        to="/disputes"
                                        className="navbar-link"
                                        title="Disputes"
                                        aria-label="Disputes"
                                    >
                                        <ShieldCheck size={17} />
                                    </Link>
                                </>
                            )}

                            <Link
                                to={isAdmin ? '/admin' : '/dashboard'}
                                className="navbar-user"
                                aria-label={
                                    isAdmin
                                        ? 'Admin Dashboard'
                                        : 'Dashboard'
                                }
                                title={
                                    isAdmin
                                        ? 'Admin Dashboard'
                                        : 'Dashboard'
                                }
                            >
                                {isAdmin ? (
                                    <UserRound size={17} />
                                ) : (
                                    <ShieldCheck size={17} />
                                )}
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="navbar-cta"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="navbar-signin"
                            >
                                Sign in
                            </Link>

                            <Link
                                to="/register"
                                className="navbar-cta"
                            >
                                Get started
                            </Link>
                        </>
                    )}
                </div>

            </div>
        </header>
    );
}

export default Navbar;