import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user } = useAuth();

  if (!user) return <div className="loader">Loading profile...</div>;

  return (
    <div className="page-container">
      <h2>My Profile</h2>
      <div className="profile-card">
        <div className="profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
        <div className="profile-details">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <span className={`role-badge role-${user.role}`}>{user.role}</span>
          <p className="profile-date">Member since: {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="profile-quick-links">
        <Link to="/orders" className="profile-link-card">
          <span className="profile-link-icon">📦</span>
          <span>My Orders</span>
        </Link>
        <Link to="/cart" className="profile-link-card">
          <span className="profile-link-icon">🛒</span>
          <span>My Cart</span>
        </Link>
        {user.role === 'seller' && (
          <Link to="/seller" className="profile-link-card">
            <span className="profile-link-icon">📊</span>
            <span>Seller Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
