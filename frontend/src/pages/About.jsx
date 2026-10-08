import { Link } from 'react-router-dom';
import {
    Users,
    Recycle,
    MapPin,
    Wrench,
    ArrowRight
} from 'lucide-react';
import './InfoPages.css';

const values = [
    {
        icon: Users,
        title: 'Community first',
        description:
            'Connect people who have useful equipment with people who need it, helping neighbors support one another.'
    },
    {
        icon: Recycle,
        title: 'Use more, waste less',
        description:
            'Make better use of existing equipment instead of purchasing new items for every occasional task.'
    },
    {
        icon: MapPin,
        title: 'Sharing close to home',
        description:
            'Discover equipment in your local area and make neighborhood sharing more practical.'
    },
    {
        icon: Wrench,
        title: 'Useful things, accessible',
        description:
            'Find equipment for home projects, outdoor activities, hobbies, and everyday jobs.'
    }
];

function About() {
    return (
        <main className="info-page">
            <section className="info-hero about-hero">
                <div className="info-container about-hero-grid">
                    <div>
                        <p className="info-eyebrow">ABOUT LENDR</p>

                        <h1>
                            A community that
                            <span>shares more.</span>
                        </h1>

                        <p className="info-hero-description">
                            Lendr is a hyperlocal equipment-sharing
                            platform built around a simple idea:
                            people should be able to access useful
                            things without always having to own them.
                        </p>

                        <div className="info-hero-actions">
                            <Link to="/browse" className="info-primary-button">
                                Explore equipment <ArrowRight size={16} />
                            </Link>

                            <Link
                                to="/home"
                                className="info-secondary-button"
                            >
                                Back to home
                            </Link>
                        </div>
                    </div>

                    <div className="about-visual" aria-hidden="true">
                        <div className="about-visual-circle">
                            <span className="about-visual-small">BORROW</span>
                            <span className="about-visual-main">Share</span>
                            <span className="about-visual-main about-visual-italic">
                                locally.
                            </span>
                            <span className="about-visual-small">
                                MAKE MORE POSSIBLE
                            </span>
                        </div>
                        <span className="about-decoration about-decoration-one" />
                        <span className="about-decoration about-decoration-two" />
                    </div>
                </div>
            </section>

            <section className="info-section">
                <div className="info-container about-story">
                    <div>
                        <p className="info-eyebrow">WHY LENDR EXISTS</p>
                        <h2>Access can matter more than ownership.</h2>
                    </div>

                    <div className="about-story-copy">
                        <p>
                            Think about the drill used for one weekend
                            project, the ladder needed for a quick repair,
                            or the camera used for a special occasion.
                            Useful equipment can spend much of its life
                            sitting unused.
                        </p>

                        <p>
                            Lendr offers a way for people to list equipment
                            they are willing to share and for others to
                            discover items they need nearby. Owners can
                            set rental terms, and borrowers can review
                            the listing details before sending a request.
                        </p>

                        <p>
                            The goal is to make local sharing easier,
                            more transparent, and more useful for
                            everyone involved.
                        </p>
                    </div>
                </div>
            </section>

            <section className="info-section info-section-soft">
                <div className="info-container">
                    <div className="info-section-heading">
                        <p className="info-eyebrow">WHAT WE BELIEVE IN</p>
                        <h2>Small exchanges can make a real difference.</h2>
                        <p>
                            Lendr is built around four simple principles.
                        </p>
                    </div>

                    <div className="about-values-grid">
                        {values.map((value) => {
                            const Icon = value.icon;

                            return (
                                <article className="about-value-card" key={value.title}>
                                    <span className="about-value-icon">
                                        <Icon size={22} strokeWidth={1.7} />
                                    </span>

                                    <h3>{value.title}</h3>
                                    <p>{value.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="info-cta-section">
                <div className="info-container">
                    <div className="info-cta">
                        <div>
                            <p className="info-eyebrow">BE PART OF THE COMMUNITY</p>
                            <h2>Have something useful to share?</h2>
                            <p>
                                Start exploring local listings or add
                                equipment of your own.
                            </p>
                        </div>

                        <div className="info-cta-actions">
                            <Link to="/browse" className="info-light-button">
                                Browse equipment <ArrowRight size={16} />
                            </Link>

                            <Link to="/list-equipment" className="info-cta-secondary">
                                List equipment
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default About;