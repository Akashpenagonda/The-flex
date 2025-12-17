import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Dashboard from "./Dashboard";
import PropertyPage from "./PropertyPage";
import GoogleExplore from "./GoogleExplore";
import PublicReviewsPage from "./PublicReviewsPage";
import ThemeToggle from "./components/ThemeToggle";

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Custom NavLink component for active styling
function NavLink({ to, children, ...props }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const handleClick = () => {
    // Scroll to top when clicking any navbar link
    window.scrollTo(0, 0);
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`nav-link ${isActive ? 'primary' : 'secondary'} ${isActive ? 'active' : ''}`}
      {...props}
    >
      {children}
    </Link>
  );
}

function App() {
  return (
    <div className="app">
      {/* Scroll to top on route change */}
      <ScrollToTop />

      {/* Premium Navbar with Theme Toggle INSIDE */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="brand-logo">🏠</div>
            <div className="brand-text">FlexLiving Reviews</div>
          </div>

          <div className="nav-links">
            <NavLink to="/dashboard">
              📊 Dashboard
            </NavLink>
            <NavLink to="/public-reviews">
              👁️ Public Reviews
            </NavLink>
            <NavLink to="/google-explore">
              🔍 Google Integration
            </NavLink>
            <a
              href={import.meta.env.VITE_API_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 API Docs
            </a>


            {/* Theme Toggle inside navbar */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/property/:listing" element={<PropertyPage />} />
        <Route path="/public-reviews" element={<PublicReviewsPage />} />
        <Route path="/google-explore" element={<GoogleExplore />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>

      {/* Premium Footer */}
      <footer className="premium-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">🏠</div>
            <h3>FlexLiving Reviews</h3>
            <p>Professional Review Management System</p>
          </div>
          <div className="footer-links">
            <Link
              to="/dashboard"
              onClick={() => window.scrollTo(0, 0)}
            >
              Dashboard
            </Link>
            <Link
              to="/public-reviews"
              onClick={() => window.scrollTo(0, 0)}
            >
              Public Reviews
            </Link>
            <Link
              to="/google-explore"
              onClick={() => window.scrollTo(0, 0)}
            >
              Google Integration
            </Link>
          </div>
          <div className="footer-stats">
            <div className="footer-stat">
              <span className="stat-number">100+</span>
              <span className="stat-label">Reviews Managed</span>
            </div>
            <div className="footer-stat">
              <span className="stat-number">4.8</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 FlexLiving. All rights reserved. | Professional Review Dashboard</p>
        </div>
      </footer>
    </div>
  );
}

export default App;