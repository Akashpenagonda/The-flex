const express = require("express");
const router = express.Router();

const {
    normalizeHostawayReviews,
    toggleReviewApproval,
    getPublicReviewsByListing,
    getDashboardAnalytics
} = require("../controllers/reviewsController");

// MANAGER DASHBOARD – ALL REVIEWS WITH FILTERING
router.get("/hostaway", (req, res) => {
    try {
        const {
            minRating,
            maxRating,
            listing,
            approved,
            startDate,
            endDate,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        let reviews = normalizeHostawayReviews();

        // Apply filters
        if (minRating) {
            reviews = reviews.filter(r => r.overallRating >= parseFloat(minRating));
        }

        if (maxRating) {
            reviews = reviews.filter(r => r.overallRating <= parseFloat(maxRating));
        }

        if (listing && listing !== 'all') {
            reviews = reviews.filter(r => r.listing === listing);
        }

        if (approved === 'true') {
            reviews = reviews.filter(r => r.approved);
        } else if (approved === 'false') {
            reviews = reviews.filter(r => !r.approved);
        }

        if (startDate) {
            reviews = reviews.filter(r => new Date(r.submittedAt) >= new Date(startDate));
        }

        if (endDate) {
            reviews = reviews.filter(r => new Date(r.submittedAt) <= new Date(endDate));
        }

        // Apply sorting
        reviews.sort((a, b) => {
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

        res.json({
            source: "hostaway",
            total: reviews.length,
            reviews,
            filters: req.query
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DASHBOARD ANALYTICS
router.get("/analytics", (req, res) => {
    try {
        const analytics = getDashboardAnalytics();
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// APPROVE / UNAPPROVE REVIEW
router.patch("/:id/approve", (req, res) => {
    try {
        const reviewId = parseInt(req.params.id, 10);
        const updated = toggleReviewApproval(reviewId);

        if (!updated) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.json({
            message: "Review approval updated",
            review: updated,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUBLIC PROPERTY PAGE
router.get("/public/:listing", (req, res) => {
    try {
        const listingName = decodeURIComponent(req.params.listing);
        const approvedReviews = getPublicReviewsByListing(listingName);

        // Sort by date (newest first)
        approvedReviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        res.json({
            listing: listingName,
            total: approvedReviews.length,
            reviews: approvedReviews,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;