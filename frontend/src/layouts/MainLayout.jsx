import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { token, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <Link to="/" className="nav-brand" onClick={closeMenu}>ShopHub</Link>

        <button
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/products" onClick={closeMenu}>All Products</Link>
          {token ? (
            <>
              <Link to="/cart" onClick={closeMenu} className="nav-cart-link">
                Cart
              </Link>
              <Link to="/orders" onClick={closeMenu}>Orders</Link>
              {user?.role === 'seller' && (
                <Link to="/seller" onClick={closeMenu}>Seller Dashboard</Link>
              )}
              <Link to="/gift-profiles" onClick={closeMenu}>Gift Profiles</Link>
              <Link to="/ai-assistant" onClick={closeMenu}>AI Assistant</Link>
              <Link to="/profile" onClick={closeMenu}>Profile</Link>
              <button onClick={handleLogout} className="nav-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/signup" onClick={closeMenu}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <main className="main-content" key={location.pathname}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;