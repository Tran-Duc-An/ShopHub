import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const RELATIONSHIPS = ['girlfriend', 'boyfriend', 'wife', 'husband', 'mom', 'dad', 'sister', 'brother', 'friend', 'child', 'colleague', 'other'];

const RELATIONSHIP_EMOJIS = {
  girlfriend: '💕', boyfriend: '💙', wife: '💍', husband: '💍',
  mom: '🌸', dad: '👔', sister: '👯', brother: '🤝',
  friend: '🤗', child: '🧒', colleague: '💼', other: '🎁'
};

const GiftProfilesPage = () => {
  const { token } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '', relationship: 'girlfriend', birthday: '',
    interests: '', preferred_categories: '',
    price_range_min: 0, price_range_max: 500, notes: ''
  });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/gift-profiles`, { headers });
      const data = await res.json();
      setProfiles(data.data || []);
    } catch { showToast('Failed to load profiles', 'error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const resetForm = () => {
    setForm({ name: '', relationship: 'girlfriend', birthday: '', interests: '', preferred_categories: '', price_range_min: 0, price_range_max: 500, notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      relationship: p.relationship,
      birthday: p.birthday ? new Date(p.birthday).toISOString().split('T')[0] : '',
      interests: (p.interests || []).join(', '),
      preferred_categories: (p.preferred_categories || []).join(', '),
      price_range_min: p.price_range_min || 0,
      price_range_max: p.price_range_max || 500,
      notes: p.notes || ''
    });
    setEditingId(p.profile_id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      interests: form.interests ? form.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
      preferred_categories: form.preferred_categories ? form.preferred_categories.split(',').map(s => s.trim()).filter(Boolean) : [],
      birthday: form.birthday || undefined
    };

    try {
      const url = editingId ? `${API_URL}/gift-profiles/${editingId}` : `${API_URL}/gift-profiles`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      showToast(editingId ? 'Profile updated!' : 'Profile created!');
      resetForm();
      fetchProfiles();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this gift profile?')) return;
    try {
      await fetch(`${API_URL}/gift-profiles/${id}`, { method: 'DELETE', headers });
      showToast('Profile deleted');
      fetchProfiles();
    } catch { showToast('Failed to delete', 'error'); }
  };

  if (loading) return <div className="loader">Loading profiles...</div>;

  return (
    <div className="page-container">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="gift-profiles-header">
        <div>
          <h2>🎁 Gift Profiles</h2>
          <p className="gift-profiles-subtitle">Create profiles for your loved ones and get AI-powered gift suggestions</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Profile
        </button>
      </div>

      {showForm && (
        <div className="gift-form-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <form className="gift-form" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Edit Profile' : 'Create New Profile'}</h3>

            <div className="gift-form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Sarah" />
              </div>

              <div className="form-group">
                <label>Relationship *</label>
                <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Birthday</label>
                <input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Interests (comma-separated)</label>
                <input type="text" value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} placeholder="e.g. fashion, tech, cooking" />
              </div>

              <div className="form-group">
                <label>Preferred Categories (comma-separated)</label>
                <input type="text" value={form.preferred_categories} onChange={e => setForm({ ...form, preferred_categories: e.target.value })} placeholder="e.g. Electronics, Fashion" />
              </div>

              <div className="form-group form-group-row">
                <div>
                  <label>Min Budget ($)</label>
                  <input type="number" value={form.price_range_min} onChange={e => setForm({ ...form, price_range_min: Number(e.target.value) })} min="0" />
                </div>
                <div>
                  <label>Max Budget ($)</label>
                  <input type="number" value={form.price_range_max} onChange={e => setForm({ ...form, price_range_max: Number(e.target.value) })} min="0" />
                </div>
              </div>

              <div className="form-group form-group-full">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional details..." rows={3} />
              </div>
            </div>

            <div className="gift-form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'} Profile</button>
            </div>
          </form>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎁</span>
          <h3>No gift profiles yet</h3>
          <p>Create a profile for someone special to get personalized gift suggestions!</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Create Your First Profile</button>
        </div>
      ) : (
        <div className="gift-profiles-grid">
          {profiles.map(p => (
            <div key={p.profile_id} className="gift-profile-card">
              <div className="gift-profile-card-header">
                <span className="gift-profile-emoji">{RELATIONSHIP_EMOJIS[p.relationship] || '🎁'}</span>
                <div>
                  <h3>{p.name}</h3>
                  <span className="gift-profile-relationship">{p.relationship}</span>
                </div>
              </div>

              <div className="gift-profile-card-body">
                {p.birthday && (
                  <div className="gift-profile-detail">
                    <span>🎂</span> {new Date(p.birthday).toLocaleDateString()}
                  </div>
                )}
                {p.interests?.length > 0 && (
                  <div className="gift-profile-detail">
                    <span>💡</span> {p.interests.join(', ')}
                  </div>
                )}
                <div className="gift-profile-detail">
                  <span>💰</span> ${p.price_range_min} - ${p.price_range_max}
                </div>
                {p.gift_history?.length > 0 && (
                  <div className="gift-profile-detail">
                    <span>📦</span> {p.gift_history.length} gift{p.gift_history.length > 1 ? 's' : ''} given
                  </div>
                )}
              </div>

              <div className="gift-profile-card-actions">
                <Link to={`/ai-assistant?profile=${p.profile_id}`} className="btn-primary btn-sm">
                  🤖 Get Suggestions
                </Link>
                <button className="btn-secondary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(p.profile_id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftProfilesPage;
