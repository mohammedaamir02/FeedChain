import { useState, useEffect } from 'react';
import { UtensilsCrossed, Users, Truck, Loader2 } from 'lucide-react';
import { impact } from '../api/client';
import type { ImpactSummary } from '../api/client';

export default function Impact() {
  const [data, setData] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    impact
      .summary()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Impact</h1>
        <p className="loading-msg"><Loader2 size={24} className="spin" /> Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1 className="page-title">Impact</h1>
        <p className="error-msg">{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Our impact</h1>
      <p className="impact-intro">
        Together we reduce food waste and feed people in need. Numbers update as NGOs distribute food.
      </p>
      <div className="impact-grid">
        <div className="impact-card card">
          <UtensilsCrossed size={36} />
          <div className="impact-value">{data?.meals_served ?? 0}</div>
          <div className="impact-label">Meals served</div>
        </div>
        <div className="impact-card card">
          <Truck size={36} />
          <div className="impact-value">{data?.successful_distributions ?? 0}</div>
          <div className="impact-label">Successful distributions</div>
        </div>
        <div className="impact-card card">
          <Users size={36} />
          <div className="impact-value">{data?.active_ngos ?? 0}</div>
          <div className="impact-label">Active NGOs</div>
        </div>
      </div>
    </div>
  );
}
