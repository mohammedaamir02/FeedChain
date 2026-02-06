import { Link } from 'react-router-dom';
import { Heart, UtensilsCrossed, Users, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-badge">Reduce waste. Feed people.</div>
        <h1 className="hero-title">
          Connect surplus food from events & restaurants to NGOs
        </h1>
        <p className="hero-desc">
          FeedChain helps donors list surplus food and NGOs claim and distribute it
          to people in need. Every meal counts.
        </p>
        {!user ? (
          <Link to="/login" className="btn btn-accent btn-lg">
            Sign in to get started
            <ArrowRight size={20} />
          </Link>
        ) : (
          <div className="hero-actions">
            {user.role === 'donor' && (
              <Link to="/donor" className="btn btn-primary btn-lg">
                <UtensilsCrossed size={20} />
                Post surplus food
              </Link>
            )}
            {user.role === 'ngo' && (
              <Link to="/ngo" className="btn btn-primary btn-lg">
                <Users size={20} />
                Find food to claim
              </Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-primary btn-lg">
                Admin overview
              </Link>
            )}
            <Link to="/impact" className="btn btn-ghost btn-lg">
              <BarChart3 size={20} />
              View impact
            </Link>
          </div>
        )}
      </section>

      <section className="features">
        <h2>How it works</h2>
        <div className="feature-grid">
          <div className="feature-card card">
            <UtensilsCrossed size={32} />
            <h3>Donors post food</h3>
            <p>Restaurants and events list surplus food with type, quantity, and pickup details.</p>
          </div>
          <div className="feature-card card">
            <Users size={32} />
            <h3>NGOs claim & pick up</h3>
            <p>NGOs discover nearby posts, claim food, and verify pickup with OTP.</p>
          </div>
          <div className="feature-card card">
            <Heart size={32} />
            <h3>Distribute to people</h3>
            <p>NGOs record distribution and people served so we can measure impact.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
