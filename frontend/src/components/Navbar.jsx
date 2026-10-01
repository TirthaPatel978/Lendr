import { useState } from 'react';

import {
    Link,
    useNavigate
} from 'react-router-dom';

import {
    Search,
    UserRound,
    Bell,
    ShieldAlert
} from 'lucide-react';

import { useAuth } from '../context/useAuth';
//import './Navbar.css';
function Navbar() {
    const { user, logout } = useAuth();

    const navigate = useNavigate();

    const [search, setSearch] = useState('');

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

                    <a
                        href="/home#how-it-works"
                        className="navbar-link"
                    >
                        How it works
                    </a>

                    <a
                        href="/home#about"
                        className="navbar-link"
                    >
                        About
                    </a>

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
                        <Link
                                to="/notifications"
                                className="navbar-link"
                                title="Notifications"
                            >
                                <Bell size={17} />
                            </Link>
                            <Link
                                to="/disputes"
                                className="navbar-link"
                                title="Disputes"
                            >
                                <ShieldAlert size={17} />
                            </Link>
                            <Link
                                to="/dashboard"
                                className="navbar-user"
                                aria-label="Dashboard"
                            >
                                <UserRound size={17} />
                            </Link>

                            <button
                                type="button"
                                onClick={logout}
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