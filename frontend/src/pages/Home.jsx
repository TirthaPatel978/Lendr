import { useEffect, useState } from 'react';
import api from '../services/api';
import {
    ArrowRight,
    MapPin,
    Search,
    ShieldCheck,
    Repeat2
} from 'lucide-react';

import { Link, createSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
function Home() {
    const { user } = useAuth();
    const [communityStats, setCommunityStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCommunityStats = async () => {
            try {
                const response = await api.get('/stats/community');

                if (isMounted) {
                    setCommunityStats(response.data);
                    setStatsError(false);
                }
            } catch (error) {
                console.error('Failed to load community statistics:', error);

                if (isMounted) {
                    setStatsError(true);
                }
            } finally {
                if (isMounted) {
                    setStatsLoading(false);
                }
            }
        };

        fetchCommunityStats();

        return () => {
            isMounted = false;
        };
    }, []);
    return (
        <main className="home">

            {/* HERO */}

            <section className="hero">
                <div className="home-container">

                    <div className="hero-grid">

                        <div className="hero-content">

                            <div className="hero-location">
                                <MapPin size={14} />
                                Equipment sharing, close to home
                            </div>

                            <h1 className="hero-title">
                                Borrow useful things.
                                <span>
                                    Share what you have.
                                </span>
                            </h1>

                            <p className="hero-description">
                                Lendr makes it easy to find equipment
                                from people nearby. From drills and
                                ladders to everyday tools, discover what
                                your community already has.
                            </p>

                            <div className="hero-actions">

                                <Link
                                    to={user ? '/dashboard' : '/register'}
                                    className="primary-button"
                                >
                                    Get started
                                    <ArrowRight size={16} />
                                </Link>

                                <Link
                                    to="/browse"
                                    className="secondary-button"
                                >
                                    <Search size={16} />
                                    Explore equipment
                                </Link>

                            </div>

                            <div className="hero-trust">

                                <div className="hero-trust-item">
                                    <ShieldCheck size={15} />
                                    Trusted community
                                </div>

                                <div className="hero-trust-item">
                                    <MapPin size={15} />
                                    Hyperlocal discovery
                                </div>

                                <div className="hero-trust-item">
                                    <Repeat2 size={15} />
                                    Free or paid sharing
                                </div>

                            </div>

                        </div>

                        <div className="hero-visual">

                            <div className="equipment-shape equipment-one" />
                            <div className="equipment-shape equipment-two" />
                            <div className="equipment-shape equipment-three" />

                            <div className="nearby-card">

                                <div className="nearby-header">

                                    <div>
                                        <p className="nearby-subtitle">
                                            NEARBY
                                        </p>

                                        <p className="nearby-title">
                                            Equipment around you
                                        </p>
                                    </div>

                                    <span className="nearby-distance">
                                        Within 5 km
                                    </span>

                                </div>

                                <div className="nearby-search">
                                    <Search size={15} />
                                    Search for drills, ladders, tools...
                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            </section>


            {/* CATEGORIES */}

            <section className="section section-white">
                <div className="home-container">

                    <div className="section-heading">

                        <div>
                            <p className="eyebrow">
                                EXPLORE LENDR
                            </p>

                            <h2 className="section-title">
                                Find the right equipment
                                for your next project.
                            </h2>

                            <p className="section-description">
                                Why buy something you'll only need
                                occasionally? Find it nearby and borrow
                                it from someone in your community.
                            </p>
                        </div>

                        <Link
                            to="/browse"
                            className="text-link"
                        >
                            Explore all equipment
                            <ArrowRight size={15} />
                        </Link>

                    </div>

                    <div className="category-grid">

                        <Category
                            title="Power Tools"
                            description="Drills, sanders, saws and more."
                            className="category-blue"
                        />

                        <Category
                            title="Home & Garden"
                            description="Ladders, cleaners and home equipment."
                            className="category-green"
                        />

                        <Category
                            title="Outdoor"
                            description="Camping gear and outdoor equipment."
                            className="category-sand"
                        />

                        <Category
                            title="Everyday Tools"
                            description="Useful tools for occasional jobs."
                            className="category-lilac"
                        />

                        <Category
                            title="Sports"
                            description="Equipment for sports and fitness."
                            className="category-blue"
                        />

                        <Category
                            title="Recreational"
                            description="Equipment for hobbies and leisure."
                            className="category-green"
                        />

                        <Category
                            title="Photography"
                            description="Photography gear and accessories."
                            className="category-sand"
                        />

                        <Category
                            title="Other"
                            description="Discover other useful community items."
                            className="category-lilac"
                        />

                    </div>

                </div>
            </section>

            {/* COMMUNITY STATISTICS */}

            <section className="community-stats-section">
                <div className="home-container">
                    <div className="community-stats-heading">
                        <p className="eyebrow">OUR COMMUNITY</p>

                        <h2 className="section-title">
                            Sharing more.
                            <br />
                            Wasting less.
                        </h2>

                        <p className="section-description">
                            Every listing gives useful equipment another purpose
                            and helps neighbours get more out of what they already have.
                        </p>
                    </div>

                    {statsLoading ? (
                        <p className="community-stats-message" role="status">
                            Loading community statistics...
                        </p>
                    ) : statsError || !communityStats ? (
                        <p className="community-stats-message" role="status">
                            Community statistics are temporarily unavailable.
                        </p>
                    ) : (
                        <>
                            <div className="community-stats-grid">
                                <article className="community-stat-card">
                                    <span className="community-stat-number">
                                        {communityStats.totalUsers.toLocaleString('en-IN')}
                                    </span>
                                    <span className="community-stat-label">
                                        Community members
                                    </span>
                                    <span className="community-stat-detail">
                                        People sharing within their community
                                    </span>
                                </article>

                                <article className="community-stat-card">
                                    <span className="community-stat-number">
                                        {communityStats.totalItems.toLocaleString('en-IN')}
                                    </span>
                                    <span className="community-stat-label">
                                        Equipment listed
                                    </span>
                                    <span className="community-stat-detail">
                                        Active listings on Lendr
                                    </span>
                                </article>

                                <article className="community-stat-card">
                                    <span className="community-stat-number">
                                        {communityStats.completedBorrowings.toLocaleString('en-IN')}
                                    </span>
                                    <span className="community-stat-label">
                                        Successful rentals
                                    </span>
                                    <span className="community-stat-detail">
                                        Borrowings completed successfully
                                    </span>
                                </article>

                                <article className="community-stat-card">
                                    <span className="community-stat-number">
                                        {communityStats.totalSharingDays.toLocaleString('en-IN')}
                                    </span>
                                    <span className="community-stat-label">
                                        Equipment-sharing days
                                    </span>
                                    <span className="community-stat-detail">
                                        Days across completed borrowing periods
                                    </span>
                                </article>
                            </div>

                            {communityStats.popularCategories?.length > 0 && (
                                <div className="community-popular-categories">
                                    <p className="community-popular-title">
                                        What our community shares
                                    </p>

                                    <div className="community-category-list">
                                        {communityStats.popularCategories.map((category) => (
                                            <span
                                                className="community-category-chip"
                                                key={category.category}
                                            >
                                                {category.category}
                                                <span>{category.count}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* HOW IT WORKS */}

            <section className="section section-sage">
                <div className="home-container">

                    <div className="process-layout">

                        <div>

                            <p className="eyebrow">
                                HOW LENDR WORKS
                            </p>

                            <h2 className="section-title">
                                From finding an item
                                to getting it back.
                            </h2>

                            <p className="section-description">
                                A simple borrowing flow designed around
                                people sharing useful equipment within
                                their local community.
                            </p>

                        </div>

                        <div className="process-list">

                            <Process
                                number="01"
                                title="Find"
                                text="Search for equipment near you and filter by category, distance, availability and rental type."
                            />

                            <Process
                                number="02"
                                title="Request"
                                text="Choose your dates, see the rental price upfront and send a borrowing request to the owner."
                            />

                            <Process
                                number="03"
                                title="Borrow"
                                text="Once approved, collect the equipment, use it responsibly and return it on time."
                            />

                        </div>

                    </div>

                </div>
            </section>


            {/* OWNER CTA */}

            <section className="cta-section">
                <div className="home-container">

                    <div className="cta">

                        <div>

                            <p className="eyebrow">
                                HAVE SOMETHING TO SHARE?
                            </p>

                            <h2 className="cta-title">
                                Put your unused equipment
                                back to work.
                            </h2>

                            <p className="cta-description">
                                List something you rarely use, choose
                                whether to share it for free or set a
                                rental price, and help someone nearby
                                get what they need.
                            </p>

                        </div>

                        <Link
                            to={user ? '/dashboard' : '/register'}
                            className="cta-button"
                        >
                            Start sharing
                            <ArrowRight size={16} />
                        </Link>

                    </div>

                </div>
            </section>

        </main>
    );
}

function Category({
title,
description,
className
}) {
return (
<Link
to={{
pathname: '/browse',
search: createSearchParams({
category: title
}).toString()
}}
className={`category-card ${className}`}
aria-label={`Browse ${title} equipment`}
>

        <div>
            <p className="category-label">
                LENDR CATEGORY
            </p>

            <h3 className="category-title">
                {title}
            </h3>

            <p className="category-description">
                {description}
            </p>
        </div>

        <div className="category-object" />

    </Link>
);


}


function Process({
    number,
    title,
    text
}) {
    return (
        <div className="process-item">

            <span className="process-number">
                {number}
            </span>

            <h3 className="process-title">
                {title}
            </h3>

            <p className="process-text">
                {text}
            </p>

        </div>
    );
}

export default Home;