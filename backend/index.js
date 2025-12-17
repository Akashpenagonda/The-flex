const express = require("express");
const cors = require("cors");

const app = express();

// Configure CORS properly
app.use(cors({
  origin: "*"
}));


// Routes
const reviewsRoutes = require("./routes/reviews");
const googleRoutes = require("./routes/google");

app.use("/api/reviews", reviewsRoutes);
app.use("/api/google", googleRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "Flex Living Reviews API"
    });
});

app.get("/", (req, res) => {
    res.send(`
    <html>
      <head><title>Flex Living API</title></head>
      <body>
        <h1>Flex Living Reviews API</h1>
        <p>Available endpoints:</p>
        <ul>
          <li><a href="/api/reviews/hostaway">GET /api/reviews/hostaway</a> - All reviews</li>
          <li><a href="/api/reviews/analytics">GET /api/reviews/analytics</a> - Dashboard analytics</li>
          <li><a href="/api/google/explore">GET /api/google/explore</a> - Google Reviews findings</li>
          <li><a href="/health">GET /health</a> - Health check</li>
        </ul>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Frontend expected at: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});