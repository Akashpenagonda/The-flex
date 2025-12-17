import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL + "/api/reviews";


export default function PublicReviewsPage() {
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Enhanced filtering and sorting
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [selectedRating, setSelectedRating] = useState("all");

    // Add smooth scroll state
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const fetchAllApprovedReviews = async () => {
            try {
                setLoading(true);

                // Fetch ALL reviews first, then filter approved ones
                const response = await fetch(`${API}/hostaway`);
                if (!response.ok) throw new Error("Failed to fetch reviews");

                const data = await response.json();

                // Filter for approved reviews only on the client side
                const approvedReviews = (data.reviews || []).filter(review => review.approved === true);

                setAllReviews(approvedReviews);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error("Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllApprovedReviews();
    }, []);

    // Use useMemo for optimized filtering
    const { filteredGroupedReviews, totalFilteredReviews, groupedReviews, uniqueProperties, ratingDistribution } = useMemo(() => {
        if (allReviews.length === 0) {
            return {
                filteredGroupedReviews: {},
                totalFilteredReviews: 0,
                groupedReviews: {},
                uniqueProperties: ["all"],
                ratingDistribution: {}
            };
        }

        // First, group reviews by property
        const grouped = allReviews.reduce((acc, review) => {
            if (!acc[review.listing]) {
                acc[review.listing] = [];
            }
            acc[review.listing].push(review);
            return acc;
        }, {});

        // Get unique properties for filter
        const properties = ["all", ...Object.keys(grouped).sort()];

        // Get rating distribution for visual
        const distribution = allReviews.reduce((acc, review) => {
            const rating = Math.floor(review.overallRating);
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {});

        // Apply all filters
        const filteredGrouped = Object.entries(grouped).reduce((acc, [property, reviews]) => {
            // Apply property filter
            if (selectedProperty !== "all" && property !== selectedProperty) return acc;

            let filteredReviews = reviews.filter(review => {
                // Apply search filter - FIXED: Search in property name, comment, AND guest name
                const searchLower = searchQuery.toLowerCase().trim();
                if (searchLower) {
                    const inProperty = property.toLowerCase().includes(searchLower);
                    const inComment = review.comment?.toLowerCase().includes(searchLower) || false;
                    const inGuestName = review.guestName?.toLowerCase().includes(searchLower) || false;

                    // Show review if ANY of these match
                    if (!inProperty && !inComment && !inGuestName) {
                        return false;
                    }
                }

                // Apply rating filter
                if (selectedRating !== "all") {
                    if (selectedRating === "high" && review.overallRating < 9) return false;
                    if (selectedRating === "medium" && (review.overallRating < 7 || review.overallRating >= 9)) return false;
                    if (selectedRating === "low" && review.overallRating >= 7) return false;
                }

                return true;
            });

            if (filteredReviews.length === 0) return acc;

            // Sort reviews by date (newest first) within each property
            filteredReviews.sort((a, b) => {
                const aDate = new Date(a.submittedAt).getTime();
                const bDate = new Date(b.submittedAt).getTime();
                return bDate - aDate; // Descending (newest first)
            });

            acc[property] = filteredReviews;
            return acc;
        }, {});

        // Sort properties alphabetically
        const sortedProperties = Object.entries(filteredGrouped).sort(([propA], [propB]) => {
            return propA.localeCompare(propB);
        });

        // Convert back to object with sorted properties
        const sortedFilteredGrouped = Object.fromEntries(sortedProperties);
        
        const totalFiltered = Object.values(sortedFilteredGrouped).flat().length;

        return {
            filteredGroupedReviews: sortedFilteredGrouped,
            totalFilteredReviews: totalFiltered,
            groupedReviews: grouped,
            uniqueProperties: properties,
            ratingDistribution: distribution
        };
    }, [allReviews, searchQuery, selectedProperty, selectedRating]);

    // Calculate statistics
    const totalReviews = allReviews.length;
    const totalProperties = Object.keys(groupedReviews).length;
    const averageRating = totalReviews > 0
        ? (allReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(1)
        : 0;

    // Enhanced smooth scrolling function with cubic-bezier easing
    const smoothScrollToElement = (elementId, offset = 80) => {
        if (isScrolling) return;

        setIsScrolling(true);
        const element = document.getElementById(elementId);
        if (!element) {
            setIsScrolling(false);
            return;
        }

        const startPosition = window.pageYOffset;
        const elementPosition = element.getBoundingClientRect().top;
        const targetPosition = startPosition + elementPosition - offset;
        const distance = targetPosition - startPosition;
        const duration = 800; // ms
        let startTime = null;

        const easeInOutCubic = (t) => {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = easeInOutCubic(progress);

            window.scrollTo(0, startPosition + distance * easeProgress);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            } else {
                setIsScrolling(false);
            }
        };

        requestAnimationFrame(animation);
    };

    // Handle search with improved logic
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Handle clear search
    const handleClearSearch = () => {
        setSearchQuery("");
    };

    // Handle filter changes with smooth scroll
    const handlePropertyChange = (value) => {
        setSelectedProperty(value);
        if (value !== "all") {
            setTimeout(() => smoothScrollToElement('reviews-results-section'), 100);
        }
    };

    const handleRatingChange = (value) => {
        setSelectedRating(value);
        if (value !== "all") {
            setTimeout(() => smoothScrollToElement('reviews-results-section'), 100);
        }
    };

    // Scroll to results when filters change
    useEffect(() => {
        if (searchQuery.trim() !== "") {
            const timer = setTimeout(() => {
                smoothScrollToElement('reviews-results-section');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    // Add smooth scroll to top on component mount
    useEffect(() => {
        if (!loading) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    }, [loading]);

    if (loading) return (
        <div className="container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading all approved reviews...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="container">
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Reviews</h3>
                <p>{error}</p>
                <button
                    className="btn-primary"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="container animate-slide-in">
            {/* ⭐ ENHANCED PREMIUM HEADER WITH NEXT-LEVEL DESIGN ⭐ */}
            <div className="premium-public-header">
                <div className="header-gradient-overlay animate-gradient-flow"></div>
                <div className="header-aurora-effect"></div>
                <div className="header-content-wrapper">

                    <div className="header-main-section">
                        <div className="title-section">
                            <h1 className="premium-main-title">
                                <span className="title-gradient-glow">🌟 Guest Reviews</span>
                                <span className="title-sparkle">✨</span>
                            </h1>
                            <p className="premium-subtitle">
                                Discover authentic experiences from our valued guests at Flex Living properties
                            </p>
                        </div>

                        <div className="header-stats-grid-premium">
                            {/* Total Reviews Card */}
                            <div className="premium-stat-card-gradient total-reviews-card">
                                <div className="stat-card-glow"></div>
                                <div className="stat-icon-circle">
                                    <span className="stat-icon">📝</span>
                                    <div className="icon-pulse"></div>
                                </div>
                                <div className="stat-content-premium">
                                    <div className="stat-value-gradient">{totalReviews}</div>
                                    <div className="stat-label-premium">Total Reviews</div>
                                </div>
                            </div>

                            {/* Properties Card */}
                            <div className="premium-stat-card-gradient properties-card">
                                <div className="stat-card-glow"></div>
                                <div className="stat-icon-circle">
                                    <span className="stat-icon">🏠</span>
                                    <div className="icon-pulse"></div>
                                </div>
                                <div className="stat-content-premium">
                                    <div className="stat-value-gradient">{totalProperties}</div>
                                    <div className="stat-label-premium">Properties</div>
                                </div>
                            </div>

                            {/* Average Rating Card */}
                            <div className="premium-stat-card-gradient rating-card">
                                <div className="stat-card-glow"></div>
                                <div className="stat-icon-circle">
                                    <span className="stat-icon">⭐</span>
                                    <div className="icon-pulse"></div>
                                </div>
                                <div className="stat-content-premium">
                                    <div className="stat-value-gradient">{averageRating}<span className="rating-scale">/10</span></div>
                                    <div className="stat-label-premium">Avg Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Search and Filter Bar */}
                    <div className="premium-controls-section">
                        <div className="search-bar-premium">
                            <div className="search-icon">🔍</div>
                            <input
                                type="text"
                                placeholder="Search property names, guest names, or reviews..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="search-input-premium"
                                id="search-input"
                            />
                            {searchQuery && (
                                <button
                                    className="clear-search-btn"
                                    onClick={handleClearSearch}
                                    type="button"
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="filter-controls-premium">
                            <div className="filter-group-premium">
                                <label className="filter-label-premium" htmlFor="property-select">Property</label>
                                <div className="select-wrapper-premium">
                                    <select
                                        id="property-select"
                                        value={selectedProperty}
                                        onChange={(e) => handlePropertyChange(e.target.value)}
                                        className="filter-select-premium"
                                    >
                                        {uniqueProperties.map(property => (
                                            <option key={property} value={property}>
                                                {property === "all" ? "🏠 All Properties" : property}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="select-arrow">▼</div>
                                </div>
                            </div>

                            <div className="filter-group-premium">
                                <label className="filter-label-premium" htmlFor="rating-select">Rating</label>
                                <div className="select-wrapper-premium">
                                    <select
                                        id="rating-select"
                                        value={selectedRating}
                                        onChange={(e) => handleRatingChange(e.target.value)}
                                        className="filter-select-premium"
                                    >
                                        <option value="all">⭐ All Ratings</option>
                                        <option value="high">⭐ 9+ Excellent</option>
                                        <option value="medium">⭐ 7-8 Good</option>
                                        <option value="low">⭐ &lt;7 Needs Attention</option>
                                    </select>
                                    <div className="select-arrow">▼</div>
                                </div>
                            </div>

                            {/* REMOVED: Sort By dropdown - Now only 2 filter groups */}
                        </div>

                        {/* Active Filters Display */}
                        {(searchQuery || selectedProperty !== "all" || selectedRating !== "all") && (
                            <div className="active-filters-premium">
                                <div className="active-filters-label">Active Filters:</div>
                                <div className="active-filters-tags">
                                    {searchQuery && (
                                        <span className="filter-tag-premium">
                                            🔍 "{searchQuery}"
                                            <button onClick={handleClearSearch} type="button" aria-label="Clear search">×</button>
                                        </span>
                                    )}
                                    {selectedProperty !== "all" && (
                                        <span className="filter-tag-premium">
                                            🏠 {selectedProperty}
                                            <button onClick={() => setSelectedProperty("all")} type="button" aria-label="Clear property filter">×</button>
                                        </span>
                                    )}
                                    {selectedRating !== "all" && (
                                        <span className="filter-tag-premium">
                                            ⭐ {selectedRating === "high" ? "9+ Excellent" :
                                                selectedRating === "medium" ? "7-8 Good" : "<7 Needs Attention"}
                                            <button onClick={() => setSelectedRating("all")} type="button" aria-label="Clear rating filter">×</button>
                                        </span>
                                    )}
                                    <button
                                        className="clear-all-filters-premium"
                                        onClick={() => {
                                            handleClearSearch();
                                            setSelectedProperty("all");
                                            setSelectedRating("all");
                                        }}
                                        type="button"
                                        aria-label="Clear all filters"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Results Summary */}
                    <div className="results-summary-premium">
                        <div className="results-count">
                            Showing <span className="highlight-count">{totalFilteredReviews}</span> review{totalFilteredReviews !== 1 ? 's' : ''}
                            {selectedProperty !== "all" && ` for "${selectedProperty}"`}
                            {searchQuery && ` matching "${searchQuery}"`}
                        </div>
                        <div className="rating-distribution">
                            {Object.entries(ratingDistribution)
                                .sort(([a], [b]) => b - a)
                                .map(([rating, count]) => (
                                    <div key={rating} className="distribution-bar">
                                        <div className="distribution-label">⭐ {rating}</div>
                                        <div className="distribution-track">
                                            <div
                                                className="distribution-fill"
                                                style={{
                                                    width: `${(count / totalReviews) * 100}%`,
                                                    background: `linear-gradient(90deg, 
                            ${rating >= 9 ? '#00b09b' : rating >= 7 ? '#f6ad55' : '#fa709a'} 0%,
                            ${rating >= 9 ? '#96c93d' : rating >= 7 ? '#ed8936' : '#fee140'} 100%)`
                                                }}
                                            ></div>
                                        </div>
                                        <div className="distribution-count">{count}</div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Button */}
            <div className="page-navigation-premium">
                <Link
                    to="/dashboard"
                    className="nav-btn-premium back-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        smoothScrollToElement('root', 0);
                        setTimeout(() => {
                            window.location.href = "/dashboard";
                        }, 400);
                    }}
                >
                    <span className="btn-icon">←</span>
                    <span className="btn-text">Back to Dashboard</span>
                    <div className="btn-glow"></div>
                </Link>
            </div>

            {/* Reviews Content */}
            <div id="reviews-results-section">
                {totalFilteredReviews === 0 ? (
                    <div className="empty-state-premium">
                        <div className="empty-illustration-premium">
                            <div className="empty-icon">🔍</div>
                            <div className="empty-sparkle">✨</div>
                        </div>
                        <h3 className="empty-title">No Reviews Match Your Search</h3>
                        <p className="empty-subtitle">
                            {searchQuery ? `No results found for "${searchQuery}"` : 'Try adjusting your filters or search criteria'}
                        </p>
                        <button
                            className="btn-reset-filters"
                            onClick={() => {
                                handleClearSearch();
                                setSelectedProperty("all");
                                setSelectedRating("all");
                            }}
                            type="button"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div className="public-reviews-container-premium">
                        {Object.entries(filteredGroupedReviews).map(([propertyName, reviews]) => {
                            const propertyAverage = reviews.length > 0
                                ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
                                : 0;

                            return (
                                <div className="property-section-premium" key={propertyName} id={`property-${propertyName.replace(/\s+/g, '-')}`}>
                                    <div className="property-header-premium">
                                        <div className="property-title-section">
                                            <h2 className="property-title-glow">{propertyName}</h2>
                                            <div className="property-badges">
                                                <span className="property-badge reviews-badge">
                                                    <span className="badge-icon">📝</span>
                                                    <span className="badge-text">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                                                </span>
                                                <span className="property-badge rating-badge">
                                                    <span className="badge-icon">⭐</span>
                                                    <span className="badge-text">{propertyAverage} average</span>
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            to={`/property/${encodeURIComponent(propertyName)}`}
                                            className="view-property-btn-premium"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                smoothScrollToElement('root', 0);
                                                setTimeout(() => {
                                                    window.location.href = `/property/${encodeURIComponent(propertyName)}`;
                                                }, 400);
                                            }}
                                        >
                                            <span className="btn-text">View Property Details</span>
                                            <span className="btn-arrow">→</span>
                                            <div className="btn-hover-glow"></div>
                                        </Link>
                                    </div>

                                    <div className="property-reviews-grid-premium">
                                        {reviews.map((review) => (
                                            <div className="public-review-card-premium" key={review.id}>
                                                <div className="review-card-gradient-border"></div>

                                                <div className="review-header-premium">
                                                    <div className="reviewer-info-premium">
                                                        <div className="guest-avatar-premium"
                                                            style={{
                                                                background: `linear-gradient(135deg, 
                                     ${review.overallRating >= 9 ? '#00b09b' : review.overallRating >= 7 ? '#f6ad55' : '#fa709a'} 0%,
                                     ${review.overallRating >= 9 ? '#96c93d' : review.overallRating >= 7 ? '#ed8936' : '#fee140'} 100%)`
                                                            }}>
                                                            {review.guestName?.charAt(0) || 'G'}
                                                        </div>
                                                        <div className="guest-details-premium">
                                                            <h3 className="guest-name">{review.guestName || 'Guest'}</h3>
                                                            <div className="guest-meta-premium">
                                                                <span className="review-date-premium">
                                                                    {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    }) : 'Recently'}
                                                                </span>
                                                                <span className="review-channel">{review.channel || 'Hostaway'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="review-rating-premium">
                                                        <div className="rating-display-premium">
                                                            <div className="rating-stars-premium">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={`star ${i < Math.floor((review.overallRating || 0) / 2) ? 'filled' : ''}`}
                                                                        style={{
                                                                            color: i < Math.floor((review.overallRating || 0) / 2)
                                                                                ? ((review.overallRating || 0) >= 9 ? '#00b09b' : (review.overallRating || 0) >= 7 ? '#f6ad55' : '#fa709a')
                                                                                : '#e2e8f0'
                                                                        }}
                                                                    >
                                                                        ★
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="rating-value-premium"
                                                                style={{
                                                                    background: `linear-gradient(135deg, 
                                       ${(review.overallRating || 0) >= 9 ? '#00b09b' : (review.overallRating || 0) >= 7 ? '#f6ad55' : '#fa709a'} 0%,
                                       ${(review.overallRating || 0) >= 9 ? '#96c93d' : (review.overallRating || 0) >= 7 ? '#ed8936' : '#fee140'} 100%)`
                                                                }}>
                                                                {(review.overallRating || 0).toFixed(1)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="review-content-premium">
                                                    <div className="quote-icon">"</div>
                                                    <p className="review-text-premium">{review.comment || 'No comment provided'}</p>
                                                    <div className="quote-icon end">"</div>
                                                </div>

                                                {review.categories && Object.keys(review.categories).length > 0 && (
                                                    <div className="review-categories-premium">
                                                        <div className="categories-label">Category Ratings</div>
                                                        <div className="categories-grid-premium">
                                                            {Object.entries(review.categories).map(([category, rating]) => (
                                                                <div
                                                                    key={category}
                                                                    className="category-chip-premium"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, 
                                      rgba(${rating >= 9 ? '0, 176, 155' : rating >= 7 ? '246, 173, 85' : '250, 112, 154'}, 0.1) 0%,
                                      rgba(${rating >= 9 ? '150, 201, 61' : rating >= 7 ? '237, 137, 54' : '254, 225, 64'}, 0.1) 100%)`,
                                                                        borderLeft: `4px solid ${rating >= 9 ? '#00b09b' : rating >= 7 ? '#f6ad55' : '#fa709a'}`
                                                                    }}
                                                                >
                                                                    <span className="category-name-premium">
                                                                        {category.replace('_', ' ')}
                                                                    </span>
                                                                    <span
                                                                        className="category-rating-premium"
                                                                        style={{
                                                                            color: rating >= 9 ? '#00b09b' : rating >= 7 ? '#f6ad55' : '#fa709a'
                                                                        }}
                                                                    >
                                                                        {rating}/10
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="review-footer-premium">
                                                    <div className="review-source">
                                                        <span className="source-icon">🌐</span>
                                                        <span className="source-text">via {review.channel || 'Hostaway'}</span>
                                                    </div>
                                                    <div className="review-actions">
                                                        <span className="review-status approved-status">
                                                            ✅ Approved
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Enhanced Footer with smooth scroll */}
            <div className="public-footer-premium">
                <div className="footer-stats-premium">
                    <div className="footer-stat-item">
                        <div className="footer-stat-value">{totalFilteredReviews}</div>
                        <div className="footer-stat-label">Reviews Displayed</div>
                    </div>
                    <div className="footer-stat-item">
                        <div className="footer-stat-value">{Object.keys(filteredGroupedReviews).length}</div>
                        <div className="footer-stat-label">Properties</div>
                    </div>
                    <div className="footer-stat-item">
                        <div className="footer-stat-value">{averageRating}</div>
                        <div className="footer-stat-label">Average Rating</div>
                    </div>
                </div>
                <div className="footer-actions-premium">
                    <button
                        className="footer-nav-btn"
                        onClick={() => smoothScrollToElement('search-input')}
                        type="button"
                    >
                        🔍 Back to Search
                    </button>
                    <Link
                        to="/dashboard"
                        className="footer-nav-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            smoothScrollToElement('root', 0);
                            setTimeout(() => {
                                window.location.href = "/dashboard";
                            }, 400);
                        }}
                    >
                        ← Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}