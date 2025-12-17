const hostawayData = require("../mock/hostaway.json");

// Initialize reviews with proper approval field
let reviews = hostawayData.result.map((r) => ({
    id: r.id,
    listing: r.listingName,
    guestName: r.guestName,
    comment: r.publicReview,
    overallRating:
        r.reviewCategory.reduce((sum, c) => sum + c.rating, 0) /
        r.reviewCategory.length,
    categories: Object.fromEntries(
        r.reviewCategory.map((c) => [c.category, c.rating])
    ),
    submittedAt: new Date(r.submittedAt).toISOString(),
    channel: "hostaway",
    type: r.type,
    status: r.status,
    approved: r.approved === true, // FIXED: Proper boolean check
    date: new Date(r.submittedAt), // For date filtering
    yearMonth: new Date(r.submittedAt).toISOString().slice(0, 7) // For trend analysis
}));

function normalizeHostawayReviews() {
    return reviews;
}

function toggleReviewApproval(reviewId) {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return null;

    review.approved = !review.approved;
    return review;
}

function getPublicReviewsByListing(listingName) {
    return reviews.filter(
        (r) => r.approved === true && r.listing === listingName
    );
}

// New function for analytics
function getDashboardAnalytics() {
    const total = reviews.length;
    const approved = reviews.filter(r => r.approved).length;
    const averageRating = reviews.reduce((sum, r) => sum + r.overallRating, 0) / total;

    // Count by listing
    const byListing = reviews.reduce((acc, r) => {
        acc[r.listing] = (acc[r.listing] || 0) + 1;
        return acc;
    }, {});

    // Count by month (for trends)
    const byMonth = reviews.reduce((acc, r) => {
        const month = r.yearMonth;
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    // Category averages
    const categorySums = {};
    const categoryCounts = {};

    reviews.forEach(r => {
        Object.entries(r.categories).forEach(([category, rating]) => {
            categorySums[category] = (categorySums[category] || 0) + rating;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
    });

    const categoryAverages = {};
    Object.keys(categorySums).forEach(category => {
        categoryAverages[category] = categorySums[category] / categoryCounts[category];
    });

    return {
        totals: { total, approved, pending: total - approved },
        averageRating: parseFloat(averageRating.toFixed(2)),
        byListing,
        byMonth,
        categoryAverages
    };
}

module.exports = {
    normalizeHostawayReviews,
    toggleReviewApproval,
    getPublicReviewsByListing,
    getDashboardAnalytics
};