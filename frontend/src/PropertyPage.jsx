import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL + "/api/reviews";


export default function PropertyPage() {
    const { listing } = useParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API}/public/${encodeURIComponent(listing)}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch reviews");
                return res.json();
            })
            .then((data) => setReviews(data.reviews || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [listing]);

    if (loading) return (
        <div className="container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading reviews...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="container">
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Reviews</h3>
                <p>{error}</p>
                <Link
                    to="/public-reviews"
                    className="btn-primary"
                    onClick={() => window.scrollTo(0, 0)}
                >
                    Back to All Reviews
                </Link>
            </div>
        </div>
    );

    return (
        <div className="container animate-slide-in">
            <div className="public-header">
                <h1 className="dashboard-title">{decodeURIComponent(listing)}</h1>
                <p className="page-subtitle">Guest Reviews</p>
                <div className="page-actions">
                    <Link
                        to="/public-reviews"
                        className="link-btn"
                        onClick={() => window.scrollTo(0, 0)}
                    >
                        👁️ View All Approved Reviews
                    </Link>
                    <Link
                        to="/dashboard"
                        className="link-btn secondary"
                        onClick={() => window.scrollTo(0, 0)}
                    >
                        ⬅️ Back to Dashboard
                    </Link>
                </div>
            </div>

            {reviews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-illustration">📭</div>
                    <h3>No Approved Reviews Available</h3>
                    <p>No approved reviews available for this property yet.</p>
                    <p>Managers need to approve reviews in the dashboard first.</p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/dashboard"
                            className="btn-primary"
                            onClick={() => window.scrollTo(0, 0)}
                        >
                            Go to Dashboard
                        </Link>
                        <Link
                            to="/public-reviews"
                            className="btn-secondary"
                            onClick={() => window.scrollTo(0, 0)}
                        >
                            View All Reviews
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    <div className="results-header">
                        <h3>
                            Showing <span className="highlight">{reviews.length}</span> approved review{reviews.length !== 1 ? 's' : ''} for this property
                        </h3>
                        <p className="average-rating">
                            Average Rating: <strong>⭐ {
                                (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
                            }</strong>
                        </p>
                    </div>

                    <div className="reviews-grid">
                        {reviews.map((r) => (
                            <div className="review-card approved" key={r.id}>
                                <div className="card-header">
                                    <div className="property-info">
                                        <h3>{decodeURIComponent(listing)}</h3>
                                        <div className="rating-display">
                                            <div className="rating-stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className="star">
                                                        {i < Math.floor(r.overallRating / 2) ? '★' : '☆'}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="rating-value">{r.overallRating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <div className="status-badge approved">
                                        ✅ Approved
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="guest-info">
                                        <div className="guest-avatar">
                                            {r.guestName.charAt(0)}
                                        </div>
                                        <div className="guest-details">
                                            <h4>{r.guestName}</h4>
                                            <div className="guest-meta">
                                                <span>{new Date(r.submittedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}</span>
                                                <span className="channel-badge">{r.channel}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="review-text">"{r.comment}"</p>

                                    {r.categories && Object.keys(r.categories).length > 0 && (
                                        <div className="categories-section">
                                            <h5>Category Ratings:</h5>
                                            <div className="categories-grid">
                                                {Object.entries(r.categories).map(([cat, rating]) => (
                                                    <div key={cat} className="category-chip">
                                                        <span className="category-name">
                                                            {cat.replace('_', ' ')}
                                                        </span>
                                                        <span className="category-rating">
                                                            {rating}/10
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}