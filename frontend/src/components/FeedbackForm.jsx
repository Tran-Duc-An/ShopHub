import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function FeedbackForm({ productId, initial, token, onSubmitted }) {
  const [text, setText] = useState(initial?.message || '');
  const [rating, setRating] = useState(initial?.rating || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setText(initial?.message || '');
    setRating(initial?.rating || 0);
  }, [initial]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/ai-chat/feedback`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, message: text, rating })
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setSuccess('Feedback submitted!');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="feedback-form" onSubmit={submit} style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Rating:</span>
        {[1,2,3,4,5].map(n => (
          <span
            key={n}
            style={{ cursor: 'pointer', color: n <= rating ? '#f59e42' : '#ccc', fontSize: 22 }}
            onClick={() => setRating(n)}
            aria-label={`Rate ${n}`}
          >★</span>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your feedback..."
        rows={2}
        style={{ width: '100%', marginTop: 6 }}
        required
      />
      <button className="btn btn-primary btn-xs" type="submit" disabled={loading || !rating || !text.trim()} style={{ marginTop: 4 }}>
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </form>
  );
}
