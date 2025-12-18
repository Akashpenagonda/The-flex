const express = require("express");
const cors = require("cors");

const app = express();

/**
 * ✅ Allowed frontend origins
 * - Local development
 * - Vercel production & preview deployments
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://the-flex-project.vercel.app",
  "https://the-flex-sooty.vercel.app",
  "https://the-flex-ivory.vercel.app"
];

/**
 * ✅ CORS Configuration
 */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server or tools like curl/postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// Parse JSON
app.use(express.json());

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

// Root API info
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Flex Living API</title></head>
      <body>
        <h1>Flex Living Reviews API</h1>
        <p>Available endpoints:</p>
        <ul>
          <li><a href="/api/reviews/hostaway">GET /api/reviews/hostaway</a></li>
          <li><a href="/api/reviews/analytics">GET /api/reviews/analytics</a></li>
          <li><a href="/api/google/explore">GET /api/google/explore</a></li>
          <li><a href="/health">GET /health</a></li>
        </ul>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
