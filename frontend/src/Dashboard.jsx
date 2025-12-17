import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL + "/api/reviews";


export default function Dashboard() {
    const [allReviews, setAllReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [approvalFilter, setApprovalFilter] = useState("all");
    const [minRating, setMinRating] = useState(0);
    const [listingFilter, setListingFilter] = useState("all");
    const [dateRange, setDateRange] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [totalPages, setTotalPages] = useState(1);

    // Refs for scrolling and tracking updates
    const reviewsGridRef = useRef(null);
    const lastApprovalUpdateRef = useRef(null);

    // Fetch reviews and analytics - INITIAL LOAD ONLY
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [reviewsRes, analyticsRes] = await Promise.all([
                    fetch(`${API}/hostaway`),
                    fetch(`${API}/analytics`)
                ]);

                if (!reviewsRes.ok || !analyticsRes.ok) {
                    throw new Error("Failed to fetch data");
                }

                const reviewsData = await reviewsRes.json();
                const analyticsData = await analyticsRes.json();

                setAllReviews(reviewsData.reviews || []);
                setAnalytics(analyticsData);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Apply filters when filter state changes - SEPARATE from allReviews updates
    const applyFilters = useCallback(() => {
        if (allReviews.length === 0) return [];

        let filtered = [...allReviews];

        // Approval filter
        if (approvalFilter === "approved") {
            filtered = filtered.filter(r => r.approved);
        } else if (approvalFilter === "unapproved") {
            filtered = filtered.filter(r => !r.approved);
        }

        // Rating filter
        if (minRating > 0) {
            filtered = filtered.filter(r => r.overallRating >= minRating);
        }

        // Listing filter
        if (listingFilter !== "all") {
            filtered = filtered.filter(r => r.listing === listingFilter);
        }

        // Date range filter
        if (dateRange !== "all") {
            const now = new Date();
            let startDate = new Date();

            switch (dateRange) {
                case "7days":
                    startDate.setDate(now.getDate() - 7);
                    break;
                case "30days":
                    startDate.setDate(now.getDate() - 30);
                    break;
                case "90days":
                    startDate.setDate(now.getDate() - 90);
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                filtered = filtered.filter(r => new Date(r.submittedAt) >= startDate);
            }
        }

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'rating':
                    aVal = a.overallRating;
                    bVal = b.overallRating;
                    break;
                case 'date':
                    aVal = new Date(a.submittedAt);
                    bVal = new Date(b.submittedAt);
                    break;
                case 'guest':
                    aVal = a.guestName.toLowerCase();
                    bVal = b.guestName.toLowerCase();
                    break;
                default:
                    aVal = new Date(a.submittedAt);
                    bVal = new Date(b.submittedAt);
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filtered;
    }, [allReviews, approvalFilter, minRating, listingFilter, dateRange, sortBy, sortOrder]);

    // Update filteredReviews when filters change - BUT NOT when only approvals change
    useEffect(() => {
        const filtered = applyFilters();
        setFilteredReviews(filtered);
        // Only reset to page 1 when REAL filters change, not when just updating approvals
        if (lastApprovalUpdateRef.current !== 'skip-reset') {
            setCurrentPage(1);
        }
        lastApprovalUpdateRef.current = null;
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    }, [applyFilters, itemsPerPage]);

    // Scroll to reviews grid (only for pagination, not for navbar)
    const scrollToReviews = () => {
        setTimeout(() => {
            reviewsGridRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    // Prevent form submission on filter change
    const handleFilterChange = (setter, value) => {
        setter(value);
    };

    // Paginate reviews
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);

    // FIXED: Toggle approval without resetting pagination
    const toggleApproval = async (id) => {
        try {
            // Mark that we're doing an approval update
            lastApprovalUpdateRef.current = 'skip-reset';

            const res = await fetch(`${API}/${id}/approve`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error("Failed to update approval");

            const data = await res.json();

            // Update allReviews
            setAllReviews(prev => prev.map(r => r.id === id ? data.review : r));

            // Update filteredReviews directly with the new approval status
            // This updates the UI immediately without triggering full re-filter
            setFilteredReviews(prev => {
                const updated = prev.map(r =>
                    r.id === id ? {
                        ...r,
                        approved: data.review.approved
                    } : r
                );

                // If we have an active approval filter, we need to reapply it
                if (approvalFilter !== "all") {
                    return applyFilters();
                }

                return updated;
            });

            // Show success animation
            const button = document.getElementById(`approve-btn-${id}`);
            if (button) {
                button.classList.add('animate-pulse-glow');
                setTimeout(() => button.classList.remove('animate-pulse-glow'), 2000);
            }
        } catch (err) {
            lastApprovalUpdateRef.current = null;
            alert(`Error: ${err.message}`);
        }
    };

    // Get unique listings for the filter dropdown
    const listings = ["all", ...new Set(allReviews.map((r) => r.listing).filter(Boolean))];
    const uniqueProperties = allReviews.reduce((acc, r) => {
        if (r.listing && !acc.includes(r.listing)) acc.push(r.listing);
        return acc;
    }, []);

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating / 2);
        for (let i = 0; i < 5; i++) {
            stars.push(
                <span key={i} className="star">
                    {i < fullStars ? '★' : '☆'}
                </span>
            );
        }
        return stars;
    };

    // Pagination controls
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            scrollToReviews();
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            scrollToReviews();
        }
    };

    const goToPage = (page) => {
        setCurrentPage(page);
        scrollToReviews();
    };

    // Handle "View All Approved Reviews" link click
    const handleViewAllClick = (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        // Navigate after scroll
        setTimeout(() => {
            window.location.href = "/public-reviews";
        }, 50);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setApprovalFilter("all");
        setMinRating(0);
        setListingFilter("all");
        setDateRange("all");
        setSortBy("date");
        setSortOrder("desc");
    };

    if (loading) return (
        <div className="container">
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="container">
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Dashboard</h3>
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

    // Calculate stats for the premium header
    const approvedCount = allReviews.filter(r => r.approved).length;
    const pendingCount = allReviews.filter(r => !r.approved).length;
    const avgRating = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length).toFixed(1)
        : '0.0';

    return (
        <div className="container animate-slide-in">
            {/* ⭐ PREMIUM HEADER - REDESIGNED WITH WOW FACTOR ⭐ */}
            <div className="premium-dashboard-header">
                <div className="header-gradient-background animate-gradient-flow"></div>
                <div className="header-content">
                    <div className="header-main">
                        <div className="header-icon-wrapper">
                            <div className="header-icon animate-pulse">📊</div>
                            <div className="icon-glow"></div>
                        </div>
                        <div className="header-text">
                            <h1 className="header-title">
                                <span className="title-gradient">Reviews Dashboard</span>
                                <span className="title-subtle">PRO</span>
                            </h1>
                            <p className="header-subtitle">
                                Monitor guest feedback, manage property reputation, and make data-driven decisions
                                <span className="subtitle-sparkle">✨</span>
                            </p>
                        </div>
                    </div>

                    {/* Premium Stats Cards */}
                    <div className="header-stats-grid">
                        {/* Total Reviews Card */}
                        <div className="premium-stat-card total-reviews">
                            <div className="stat-glow"></div>
                            <div className="stat-content">
                                <div className="stat-icon">📈</div>
                                <div className="stat-details">
                                    <span className="stat-label">Total Reviews</span>
                                    <span className="stat-value">{allReviews.length}</span>
                                    <span className="stat-trend positive">↑ 12% this month</span>
                                </div>
                            </div>
                            <div className="stat-wave"></div>
                        </div>

                        {/* Approved Reviews Card */}
                        <div className="premium-stat-card approved-reviews">
                            <div className="stat-glow"></div>
                            <div className="stat-content">
                                <div className="stat-icon">✅</div>
                                <div className="stat-details">
                                    <span className="stat-label">Approved</span>
                                    <span className="stat-value">{approvedCount}</span>
                                    <span className="stat-trend ready">Ready for display</span>
                                </div>
                            </div>
                            <div className="stat-wave"></div>
                        </div>

                        {/* Pending Reviews Card */}
                        <div className="premium-stat-card pending-reviews">
                            <div className="stat-glow"></div>
                            <div className="stat-content">
                                <div className="stat-icon">⏳</div>
                                <div className="stat-details">
                                    <span className="stat-label">Pending</span>
                                    <span className="stat-value">{pendingCount}</span>
                                    <span className="stat-trend attention">Requires action</span>
                                </div>
                            </div>
                            <div className="stat-wave"></div>
                        </div>

                        {/* Average Rating Card */}
                        <div className="premium-stat-card avg-rating">
                            <div className="stat-glow"></div>
                            <div className="stat-content">
                                <div className="stat-icon">⭐</div>
                                <div className="stat-details">
                                    <span className="stat-label">Avg Rating</span>
                                    <span className="stat-value">{avgRating}<small>/10</small></span>
                                    <span className="stat-trend excellent">Excellent</span>
                                </div>
                            </div>
                            <div className="stat-wave"></div>
                        </div>
                    </div>

                    {/* Premium CTA Button */}
                    <div className="header-actions">
                        <Link
                            to="/public-reviews"
                            className="premium-cta-button"
                            onClick={handleViewAllClick}
                        >
                            <span className="cta-sparkle">✨</span>
                            <span className="cta-text">View All Approved Reviews</span>
                            <span className="cta-arrow">→</span>
                            <div className="cta-glow"></div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section glass-card">
                <div className="section-title">
                    <div className="section-title-icon">🔍</div>
                    <span>Filter & Sort Reviews</span>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="filters-grid">
                    <div className="filter-group">
                        <label className="filter-label">Approval Status</label>
                        <select
                            value={approvalFilter}
                            onChange={(e) => handleFilterChange(setApprovalFilter, e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">📋 All Status</option>
                            <option value="approved">✅ Approved Only</option>
                            <option value="unapproved">⏳ Pending Only</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Minimum Rating</label>
                        <select
                            value={minRating}
                            onChange={(e) => handleFilterChange(setMinRating, Number(e.target.value))}
                            className="filter-select"
                        >
                            <option value="0">⭐ All Ratings</option>
                            {[6, 7, 8, 9, 10].map((r) => (
                                <option key={r} value={r}>{r}+ /10</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Property</label>
                        <select
                            value={listingFilter}
                            onChange={(e) => handleFilterChange(setListingFilter, e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">🏠 All Properties</option>
                            {listings
                                .filter(listing => listing !== "all" && listing)
                                .map((listing) => (
                                    <option key={listing} value={listing}>
                                        {listing}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => handleFilterChange(setDateRange, e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">📅 All Time</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
                            className="filter-select"
                        >
                            <option value="date">📅 Date Submitted</option>
                            <option value="rating">⭐ Rating</option>
                            <option value="guest">👤 Guest Name</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-label">Order</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => handleFilterChange(setSortOrder, e.target.value)}
                            className="filter-select"
                        >
                            <option value="desc">⬇️ Descending (Newest First)</option>
                            <option value="asc">⬆️ Ascending (Oldest First)</option>
                        </select>
                    </div>
                </form>
            </div>

            {/* Active Filters Info */}
            {filteredReviews.length > 0 && (
                <div className="active-filters-info">
                    <div className="filter-tags">
                        {listingFilter !== 'all' && (
                            <span className="filter-tag">
                                🏠 {listingFilter}
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange(setListingFilter, 'all')}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {minRating > 0 && (
                            <span className="filter-tag">
                                ⭐ {minRating}+ Rating
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange(setMinRating, 0)}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {approvalFilter !== 'all' && (
                            <span className="filter-tag">
                                {approvalFilter === 'approved' ? '✅ Approved' : '⏳ Pending'}
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange(setApprovalFilter, 'all')}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {dateRange !== 'all' && (
                            <span className="filter-tag">
                                📅 Last {dateRange}
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange(setDateRange, 'all')}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {sortBy !== 'date' && (
                            <span className="filter-tag">
                                Sorted by: {sortBy === 'rating' ? '⭐ Rating' : '👤 Guest'}
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange(setSortBy, 'date')}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {sortOrder !== 'desc' && (
                            <span className="filter-tag">
                                Order: ⬆️ Ascending
                                <button
                                    type="button"
                                    onClick={() => handleFilterChange(setSortOrder, 'desc')}
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        className="clear-all-btn"
                        onClick={clearAllFilters}
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* Reviews Grid with Pagination */}
            {filteredReviews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-illustration">📭</div>
                    <h3>No Reviews Found</h3>
                    <p>Try adjusting your filters or check back later for new reviews.</p>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={clearAllFilters}
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="results-header">
                        <h3>
                            Showing <span className="highlight">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredReviews.length)}</span> of <span className="highlight">{filteredReviews.length}</span> review{filteredReviews.length !== 1 ? 's' : ''}
                            {listingFilter !== 'all' && ` for "${listingFilter}"`}
                        </h3>
                        <div className="view-options">
                            <Link
                                to="/public-reviews"
                                className="view-all-btn"
                                onClick={handleViewAllClick}
                            >
                                👁️ View All Approved Reviews
                            </Link>
                        </div>
                    </div>

                    {/* Reviews Grid with ref for scrolling */}
                    <div ref={reviewsGridRef} className="reviews-grid">
                        {currentReviews.map((r) => (
                            <div
                                className={`review-card ${r.approved ? 'approved' : 'pending'}`}
                                key={r.id}
                            >
                                <div className="card-header">
                                    <div className="property-info">
                                        <h3>{r.listing}</h3>
                                        <div className="property-address">
                                            <span>📍 {r.listing.split(' - ')[1] || r.listing}</span>
                                        </div>
                                        <div className="rating-display">
                                            <div className="rating-stars">
                                                {renderStars(r.overallRating)}
                                            </div>
                                            <span className="rating-value">{r.overallRating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${r.approved ? 'approved' : 'pending'}`}>
                                        {r.approved ? '✅ Approved' : '⏳ Pending'}
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

                                <div className="card-footer">
                                    <div className="action-buttons">
                                        <button
                                            id={`approve-btn-${r.id}`}
                                            onClick={() => toggleApproval(r.id)}
                                            className={`btn ${r.approved ? 'btn-secondary' : 'btn-primary'}`}
                                        >
                                            {r.approved ? '🗑️ Unapprove' : '✅ Approve'}
                                        </button>
                                    </div>
                                    <Link
                                        to={`/property/${encodeURIComponent(r.listing)}`}
                                        className="view-link"
                                        onClick={() => window.scrollTo(0, 0)}
                                    >
                                        👁️ View Property Page
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-section">
                            <button
                                type="button"
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                ← Previous
                            </button>

                            <div className="page-numbers">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            type="button"
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="page-info">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                type="button"
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {/* Footer Stats */}
                    <div className="dashboard-footer">
                        <div className="footer-stats">
                            <div className="stat-item">
                                <span className="number">{approvedCount}</span>
                                <span className="label">Approved</span>
                            </div>
                            <div className="stat-item">
                                <span className="number">{pendingCount}</span>
                                <span className="label">Pending</span>
                            </div>
                            <div className="stat-item">
                                <span className="number">{avgRating}</span>
                                <span className="label">Avg Rating</span>
                            </div>
                        </div>
                        <div className="footer-actions">
                            <Link
                                to="/public-reviews"
                                className="premium-cta-button compact"
                                onClick={handleViewAllClick}
                            >
                                <span className="cta-text">👁️ View All Approved</span>
                                <span className="cta-arrow">→</span>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}