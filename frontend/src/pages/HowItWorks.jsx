import { Link } from 'react-router-dom';
import {
    Search,
    CalendarDays,
    CheckCircle2,
    Handshake,
    RotateCcw,
    Star,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import './InfoPages.css';

const steps = [
    {
        number: '01',
        icon: Search,
        title: 'Find what you need',
        description:
            'Browse equipment available in your community. Explore categories, compare rental prices, and find items near you.'
    },
    {
        number: '02',
        icon: CalendarDays,
        title: 'Choose your dates',
        description:
            'Check the listing details, select your borrowing dates, and send a request to the equipment owner.'
    },
    {
        number: '03',
        icon: CheckCircle2,
        title: 'Get confirmation',
        description:
            'The owner reviews your request and can approve or decline it. Check your request status and notifications for updates.'
    },
    {
        number: '04',
        icon: Handshake,
        title: 'Pick up and use it',
        description:
            'Once approved, coordinate the pickup with the owner and use the equipment for your planned project.'
    },
    {
        number: '05',
        icon: RotateCcw,
        title: 'Return the equipment',
        description:
            'Return the item by the agreed due date. The borrowing can then be marked as returned and completed.'
    },
    {
        number: '06',
        icon: Star,
        title: 'Share your experience',
        description:
            'After a completed borrowing, leave a review to help other community members make informed decisions.'
    }
];

function HowItWorks() {
    return (
        <main className="info-page">
            <section className="info-hero">
                <div className="info-container">
                    <p className="info-eyebrow">A SIMPLE WAY TO SHARE</p>

                    <h1>
                        Less buying.
                        <span>More sharing.</span>
                    </h1>

                    <p className="info-hero-description">
                        Get access to the equipment you need without
                        buying something you may only use once.
                        Lendr helps neighbors make better use of
                        the things they already have.
                    </p>

                    <div className="info-hero-actions">
                        <Link to="/browse" className="info-primary-button">
                            Find equipment <ArrowRight size={16} />
                        </Link>

                        <Link
                            to="/list-equipment"
                            className="info-secondary-button"
                        >
                            Share your equipment
                        </Link>
                    </div>

                    <div className="info-hero-note">
                        <ShieldCheck size={17} />
                        <span>
                            Clear requests, visible prices, and community reviews.
                        </span>
                    </div>
                </div>
            </section>

            <section className="info-section">
                <div className="info-container">
                    <div className="info-section-heading">
                        <p className="info-eyebrow">HOW LENDR WORKS</p>
                        <h2>From finding to returning, made simple.</h2>
                        <p>
                            Whether you need an item or have one to share,
                            follow these straightforward steps.
                        </p>
                    </div>

                    <div className="how-steps-grid">
                        {steps.map((step) => {
                            const Icon = step.icon;

                            return (
                                <article className="how-step-card" key={step.number}>
                                    <div className="how-step-top">
                                        <span className="how-step-number">
                                            {step.number}
                                        </span>

                                        <span className="how-step-icon">
                                            <Icon size={21} strokeWidth={1.7} />
                                        </span>
                                    </div>

                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="info-section info-section-soft">
                <div className="info-container">
                    <div className="info-two-column">
                        <div>
                            <p className="info-eyebrow">BORROW WHEN YOU NEED IT</p>
                            <h2>One project shouldn't mean one more purchase.</h2>
                        </div>

                        <div className="info-side-copy">
                            <p>
                                From drills and ladders to sports and
                                photography equipment, find useful items
                                listed by people in your community.
                            </p>

                            <Link to="/browse" className="info-text-link">
                                Browse available equipment
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <div className="info-two-column info-two-column-divider">
                        <div>
                            <p className="info-eyebrow">LEND WHAT YOU OWN</p>
                            <h2>Give useful equipment more opportunities to be used.</h2>
                        </div>

                        <div className="info-side-copy">
                            <p>
                                List equipment you are willing to share,
                                set the rental details, manage requests,
                                and help someone nearby get a job done.
                            </p>

                            <Link to="/list-equipment" className="info-text-link">
                                List your equipment
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="info-cta-section">
                <div className="info-container">
                    <div className="info-cta">
                        <div>
                            <p className="info-eyebrow">READY TO GET STARTED?</p>
                            <h2>Make your next project a little easier.</h2>
                            <p>
                                Find equipment nearby or put your own
                                equipment to good use.
                            </p>
                        </div>

                        <Link to="/browse" className="info-light-button">
                            Explore Lendr <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default HowItWorks;