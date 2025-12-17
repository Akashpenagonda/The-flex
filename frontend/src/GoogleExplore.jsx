import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL + "/api/google";

const [findingsRes, reviewsRes] = await Promise.all([
  fetch(`${API}/explore`),
  fetch(`${API}/mock`)
]);


export default function GoogleExplore() {
    const [findings, setFindings] = useState(null);
    const [googleReviews, setGoogleReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoogleData = async () => {
            try {
                const [findingsRes, reviewsRes] = await Promise.all([
                    fetch(`${API}/explore`),
                    fetch(`${API}/mock`)
                ]);

                const findingsData = await findingsRes.json();
                const reviewsData = await reviewsRes.json();

                setFindings(findingsData);
                setGoogleReviews(reviewsData.reviews || []);
            } catch (error) {
                console.error("Failed to fetch Google data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGoogleData();
    }, []);

    if (loading) return (
        <div className="container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading Google integration findings...</p>
            </div>
        </div>
    );

    return (
        <div className="container animate-slide-in">
            <h1 className="dashboard-title">🔍 Google Reviews Integration</h1>

            <div className="findings-section">
                <h2>Feasibility Findings</h2>
                <div className="findings-grid">
                    <div className="finding-card">
                        <h3>Method</h3>
                        <p>{findings.method}</p>
                    </div>

                    <div className="finding-card">
                        <h3>Feasibility</h3>
                        <p className="feasibility-good">{findings.feasibility}</p>
                    </div>

                    <div className="finding-card">
                        <h3>API Cost</h3>
                        <p>~$0.032 per request</p>
                    </div>
                </div>
            </div>

            <div className="requirements-section">
                <h3>📋 Requirements</h3>
                <ul className="requirements-list">
                    {findings.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                    ))}
                </ul>
            </div>

            <div className="limitations-section">
                <h3>⚠️ Limitations</h3>
                <ul className="limitations-list">
                    {findings.limitations.map((limit, index) => (
                        <li key={index}>{limit}</li>
                    ))}
                </ul>
            </div>

            <div className="implementation-section">
                <h3>Implementation Steps</h3>
                <div className="steps-list">
                    {findings.implementationSteps.map((step, index) => (
                        <div key={index} className="step-item">
                            <div className="step-marker">
                                <span className="step-number">{index + 1}</span>
                            </div>
                            <div className="step-content">
                                <div className="step-text">{step.replace(/^\d+\.\s*/, '')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sample-section">
                <h3>📝 Sample API Request</h3>
                <pre className="code-sample">
                    {findings.sampleRequest}
                </pre>
                <p className="note">Note: You'll need a valid Google Places API key to use this endpoint.</p>
            </div>

            <div className="mock-data-section">
                <h3>Mock Google Reviews Data</h3>
                <p className="note">This is how Google reviews would appear after integration:</p>

                <div className="reviews-grid">
                    {googleReviews.map((review) => (
                        <div className="review-card google-review" key={review.id}>
                            <div className="card-header">
                                <div className="property-info">
                                    <h3>{review.listing}</h3>
                                    <div className="rating-display">
                                        <div className="rating-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="star">
                                                    {i < Math.floor(review.overallRating / 2) ? '★' : '☆'}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="rating-value">{review.overallRating.toFixed(1)}</span>
                                    </div>
                                </div>
                                <span className="channel-tag google">Google</span>
                            </div>

                            <div className="card-body">
                                <div className="guest-info">
                                    <div className="guest-avatar">
                                        {review.guestName.charAt(0)}
                                    </div>
                                    <div className="guest-details">
                                        <h4>{review.guestName}</h4>
                                        <div className="guest-meta">
                                            <span>{new Date(review.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="review-text">"{review.comment}"</p>
                            </div>

                            <div className="card-footer">
                                <div className="action-buttons">
                                    <button className="btn-secondary" disabled>
                                        ⏳ Requires Full Integration
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="conclusion-section">
                <h3>Conclusion</h3>
                <p>
                    Google Reviews integration is technically feasible using the Google Places API.
                    The main challenges are API costs, rate limits, and the need for Place IDs for each property.
                </p>
                <p className="mt-2">
                    A recommended implementation approach is to:
                </p>
                <div className="recommendation-steps">
                    <div className="recommendation-item">
                        <div className="recommendation-marker">→</div>
                        <div className="recommendation-content">Start with a pilot for 2-3 properties</div>
                    </div>
                    <div className="recommendation-item">
                        <div className="recommendation-marker">→</div>
                        <div className="recommendation-content">Fetch reviews nightly via cron job</div>
                    </div>
                    <div className="recommendation-item">
                        <div className="recommendation-marker">→</div>
                        <div className="recommendation-content">Store them in the same database with a <code>channel: "google"</code> field</div>
                    </div>
                    <div className="recommendation-item">
                        <div className="recommendation-marker">→</div>
                        <div className="recommendation-content">Apply the same approval workflow as Hostaway reviews</div>
                    </div>
                </div>
            </div>
        </div>
    );
}