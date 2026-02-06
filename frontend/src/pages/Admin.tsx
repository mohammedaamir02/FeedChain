import { useState, useEffect } from 'react';
import { Loader2, Package, FileCheck } from 'lucide-react';
import { admin } from '../api/client';
import type { FoodPost, Claim } from '../api/client';

export default function Admin() {
  const [foodPostsList, setFoodPostsList] = useState<FoodPost[]>([]);
  const [claimsList, setClaimsList] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    admin
      .overview()
      .then((res) => {
        setFoodPostsList(res.food_posts ?? []);
        setClaimsList(res.claims ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Admin overview</h1>
        <p className="loading-msg"><Loader2 size={24} className="spin" /> Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1 className="page-title">Admin overview</h1>
        <p className="error-msg">{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Admin overview</h1>
      <div className="admin-stats">
        <span>{foodPostsList.length} food posts</span>
        <span>{claimsList.length} claims</span>
      </div>

      <section className="admin-section">
        <h2><Package size={22} /> Food posts</h2>
        {foodPostsList.length === 0 ? (
          <p className="muted">No food posts.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {foodPostsList.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id.slice(0, 8)}…</code></td>
                    <td>{p.food_type}</td>
                    <td>{p.quantity}</td>
                    <td>{p.status}</td>
                    <td>{p.expiry_time ? new Date(p.expiry_time).toLocaleString() : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2><FileCheck size={22} /> Claims</h2>
        {claimsList.length === 0 ? (
          <p className="muted">No claims.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Claimed at</th>
                  <th>People served</th>
                </tr>
              </thead>
              <tbody>
                {claimsList.map((c) => (
                  <tr key={c.id}>
                    <td><code>{c.id.slice(0, 8)}…</code></td>
                    <td>{c.status}</td>
                    <td>{c.claimed_at ? new Date(c.claimed_at).toLocaleString() : '–'}</td>
                    <td>{c.people_served ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
