import { useState, useEffect } from 'react';
import { Plus, Package, Clock, MapPin, Loader2 } from 'lucide-react';
import { foodPosts } from '../api/client';
import type { FoodPost } from '../api/client';

const STATUS_LABEL: Record<string, string> = {
  POSTED: 'Available',
  CLAIMED: 'Claimed',
  PICKED: 'Picked up',
  CLOSED: 'Closed',
};

export default function Donor() {
  const [list, setList] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    food_type: '',
    quantity: '',
    expiry_time: '',
    pickup_lat: '',
    pickup_lng: '',
  });

  function load() {
    setLoading(true);
    setError('');
    foodPosts
      .my()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const expiry = form.expiry_time
      ? new Date(form.expiry_time).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    foodPosts
      .create({
        food_type: form.food_type.trim(),
        quantity: form.quantity.trim(),
        expiry_time: expiry,
        pickup_lat: form.pickup_lat ? Number(form.pickup_lat) : undefined,
        pickup_lng: form.pickup_lng ? Number(form.pickup_lng) : undefined,
      })
      .then(() => {
        setForm({ food_type: '', quantity: '', expiry_time: '', pickup_lat: '', pickup_lng: '' });
        setShowForm(false);
        load();
      })
      .catch((e) => setError(e.message))
      .finally(() => setSubmitting(false));
  }

  const minExpiry = new Date();
  minExpiry.setMinutes(minExpiry.getMinutes() + 30);
  const minExpiryStr = minExpiry.toISOString().slice(0, 16);

  return (
    <div className="container">
      <div className="page-header">
        <h1>My food posts</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} />
          New post
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <div className="card form-card">
          <h2>Post surplus food</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Food type *</label>
              <input
                value={form.food_type}
                onChange={(e) => setForm((f) => ({ ...f, food_type: e.target.value }))}
                placeholder="e.g. Packed meals, vegetables"
                required
              />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="e.g. 50 plates, 10 kg"
                required
              />
            </div>
            <div className="form-group">
              <label>Expiry (local time) *</label>
              <input
                type="datetime-local"
                value={form.expiry_time}
                onChange={(e) => setForm((f) => ({ ...f, expiry_time: e.target.value }))}
                min={minExpiryStr}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Latitude (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={form.pickup_lat}
                  onChange={(e) => setForm((f) => ({ ...f, pickup_lat: e.target.value }))}
                  placeholder="e.g. 13.0827"
                />
              </div>
              <div className="form-group">
                <label>Longitude (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={form.pickup_lng}
                  onChange={(e) => setForm((f) => ({ ...f, pickup_lng: e.target.value }))}
                  placeholder="e.g. 80.2707"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <Loader2 size={18} className="spin" /> : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="loading-msg"><Loader2 size={24} className="spin" /> Loading…</p>
      ) : list.length === 0 ? (
        <div className="empty-state card">
          <Package size={48} />
          <p>No posts yet. Add surplus food to help NGOs find it.</p>
        </div>
      ) : (
        <ul className="post-list">
          {list.map((post) => (
            <li key={post.id} className="card post-card">
              <div className="post-meta">
                <span className="post-status status-{post.status.toLowerCase()}">
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
                {post.expiry_time && (
                  <span className="post-expiry">
                    <Clock size={14} />
                    Expires {new Date(post.expiry_time).toLocaleString()}
                  </span>
                )}
              </div>
              <h3>{post.food_type}</h3>
              <p className="post-quantity">{post.quantity}</p>
              {(post.pickup_lat != null || post.pickup_lng != null) && (
                <p className="post-location">
                  <MapPin size={14} />
                  {post.pickup_lat}, {post.pickup_lng}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
