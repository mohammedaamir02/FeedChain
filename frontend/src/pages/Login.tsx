import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'password' | 'demo'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'donor' | 'ngo' | 'admin'>('ngo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let nextRole = role;
      if (mode === 'password') {
        const res = await loginWithPassword(email.trim(), password);
        nextRole = res.role as 'donor' | 'ngo' | 'admin';
      } else {
        await login(role);
      }
      if (nextRole === 'donor') navigate('/donor');
      else if (nextRole === 'admin') navigate('/admin');
      else navigate('/ngo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <Heart size={48} strokeWidth={2} />
          <h1>FeedChain</h1>
          <p>Sign in to your account</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'password' ? 'active' : ''}
            onClick={() => setMode('password')}
          >
            Email & password
          </button>
          <button
            type="button"
            className={mode === 'demo' ? 'active' : ''}
            onClick={() => setMode('demo')}
          >
            Demo (role only)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'password' && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}
          {mode === 'demo' && (
            <div className="form-group">
              <label>I am a</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'donor' | 'ngo' | 'admin')}
                disabled={loading}
              >
                <option value="donor">Donor (restaurant / event)</option>
                <option value="ngo">NGO (claim & distribute food)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Loader2 size={20} className="spin" /> : 'Sign in'}
          </button>
        </form>

        <p className="login-footer">
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
