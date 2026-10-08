import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Heart } from 'lucide-react';
import './Footer.css';

function Footer() {
    const { pathname } = useLocation();

    // Hide the footer on authentication pages.
    if (['/login', '/register'].includes(pathname)) {
        return null;
    }

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-main">
                    <div className="footer-brand">
                        <Link to="/home" className="footer-logo">
                            lendr<span>.</span>
                        </Link>

                        <p className="footer-description">
                            Borrow what you need. Share what you have.
                            Make your community go further, together.
                        </p>

                        <Link to="/browse" className="footer-explore-link">
                            Explore equipment
                            <ArrowUpRight size={15} />
                        </Link>
                    </div>

                    <div className="footer-column">
                        <h3>Explore</h3>
                        <Link to="/home">Home</Link>
                        <Link to="/browse">Browse equipment</Link>
                        <Link to="/list-equipment">List equipment</Link>
                        <Link to="/home#how-it-works">How it works</Link>
                    </div>

                    <div className="footer-column">
                        <h3>Your community</h3>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/profile">Your profile</Link>
                        <Link to="/reviews">Reviews</Link>
                        <Link to="/disputes">Disputes</Link>
                    </div>

                    <div className="footer-note">
                        <span className="footer-note-label">
                            A BETTER WAY TO SHARE
                        </span>

                    </div>
                </div>

                <div className="footer-bottom">
                    <p>
                        © {new Date().getFullYear()} Lendr. All rights reserved.
                    </p>

                    <p className="footer-made-with">
                        Made for sharing <Heart size={13} />
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
