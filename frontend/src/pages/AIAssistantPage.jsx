import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { API_URL, proxyImage } from '../config';

const OCCASIONS = ['Birthday', "Valentine's Day", 'Christmas', 'Anniversary', "Mother's Day", "Father's Day", 'Graduation', 'Wedding', 'Housewarming', 'Thank You', 'Just Because'];

const AIAssistantPage = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const chatEndRef = useRef(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch(`${API_URL}/gift-profiles`, { headers });
        const data = await res.json();
        const profileList = data.data || [];
        setProfiles(profileList);

        const profileParam = searchParams.get('profile');
        if (profileParam) {
          const found = profileList.find(p => p.profile_id === profileParam);
          if (found) {
            setSelectedProfile(found);
            setMessages([{
              role: 'assistant',
              content: `Hi! I'm ready to help you find the perfect gift for **${found.name}** (your ${found.relationship}). What occasion are you shopping for? Or just ask me anything!`
            }]);
          }
        }
      } catch { /* ignore */ }
    };
    fetchProfiles();
    if (!searchParams.get('profile')) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI gift assistant 🎁\n\nI can help you find the perfect gift for your loved ones. You can:\n• Select a profile below and ask for suggestions\n• Tell me about the person and occasion\n• Ask me anything about gift ideas!\n\nHow can I help you today?`
      }]);
    }
  }, [token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Split AI reply + products into interleaved per-item messages
  const buildInterleavedMessages = (reply, products) => {
    const newMessages = [];

    if (products && products.length > 0) {
      // Split on numbered list items: "1. " "2. " etc.
      const sections = reply.split(/(?=\d+\.\s)/).map(s => s.trim()).filter(Boolean);

      // If we got clean numbered sections, interleave text + product card
      if (sections.length > 1) {
        // First section may be an intro (no number) — show it alone
        if (!/^\d+\./.test(sections[0])) {
          newMessages.push({ role: 'assistant', content: sections[0] });
          sections.shift();
        }
        sections.forEach((section, idx) => {
          newMessages.push({ role: 'assistant', content: section });
          if (products[idx]) {
            newMessages.push({ role: 'product', product: products[idx] });
          }
        });
        // Any extra products beyond numbered sections
        products.slice(sections.length).forEach(p => {
          newMessages.push({ role: 'product', product: p });
        });
        return newMessages;
      }
    }

    // Fallback: one text message, then product cards after
    newMessages.push({ role: 'assistant', content: reply });
    (products || []).forEach(p => newMessages.push({ role: 'product', product: p }));
    return newMessages;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/ai-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          profile_id: selectedProfile?.profile_id || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to get response');
      }

      const data = await res.json();
      const newMessages = buildInterleavedMessages(data.reply, data.recommended_products);
      if (data.recommended_products?.length > 0) setSuggestedProducts(data.recommended_products);
      setMessages(prev => [...prev, ...newMessages]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleSuggest = async (occasion) => {
    if (!selectedProfile || sending) return;

    const userMsg = { role: 'user', content: `Suggest gifts for ${selectedProfile.name} for ${occasion}` };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/ai-chat/suggest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          profile_id: selectedProfile.profile_id,
          occasion
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to get suggestions');
      }

      const data = await res.json();
      const newMessages = buildInterleavedMessages(data.reply, data.recommended_products);
      if (data.recommended_products?.length > 0) setSuggestedProducts(data.recommended_products);
      setMessages(prev => [...prev, ...newMessages]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const addToCart = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Added to cart!');
    } catch { showToast('Failed to add to cart', 'error'); }
  };

  // Render plain text with bold support
  const renderTextContent = (content) => {
    return content.split('\n').map((line, j) => (
      <p key={j}>{line.replace(/\*\*(.*?)\*\*/g, (_, text) => text)}</p>
    ));
  };

  return (
    <div className="page-container ai-assistant-page">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="ai-assistant-layout">
        {/* Sidebar */}
        <div className="ai-sidebar">
          <h3>🎁 Gift Profiles</h3>
          <div className="ai-profile-list">
            {profiles.length === 0 ? (
              <div className="ai-no-profiles">
                <p>No profiles yet</p>
                <Link to="/gift-profiles" className="btn-primary btn-sm">Create One</Link>
              </div>
            ) : (
              profiles.map(p => (
                <button
                  key={p.profile_id}
                  className={`ai-profile-btn ${selectedProfile?.profile_id === p.profile_id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedProfile(p);
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: `Switched to **${p.name}** (${p.relationship}). What occasion are you shopping for?`
                    }]);
                    // Store selected profile for cart autofill
                    localStorage.setItem('selectedGiftProfile', JSON.stringify({
                      profile_id: p.profile_id,
                      name: p.name,
                      relationship: p.relationship
                    }));
                  }}
                >
                  <span className="ai-profile-btn-name">{p.name}</span>
                  <span className="ai-profile-btn-rel">{p.relationship}</span>
                </button>
              ))
            )}
          </div>

          {selectedProfile && (
            <div className="ai-occasions">
              <h4>Quick Suggestions</h4>
              <div className="ai-occasion-chips">
                {OCCASIONS.map(o => (
                  <button
                    key={o}
                    className="ai-occasion-chip"
                    onClick={() => handleSuggest(o)}
                    disabled={sending}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Products */}
          {suggestedProducts.length > 0 && (
            <div className="ai-suggested-products">
              <h4>Recommended Products</h4>
              <div className="ai-products-list">
                {suggestedProducts.map(p => (
                  <div key={p.product_id} className="ai-product-card">
                    {p.image_url && (
                      <img src={proxyImage(p.image_url)} alt={p.product_name} onError={e => { e.target.style.display = 'none'; }} />
                    )}
                    <div className="ai-product-info">
                      <a
                        href={`/products/${p.product_id}`}
                        className="ai-product-name"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {p.product_name}
                      </a>
                      <span className="ai-product-price">${p.final_price}</span>
                      {p.rating && <span className="ai-product-rating">⭐ {p.rating}</span>}
                    </div>
                    <button className="btn-primary btn-xs" onClick={() => addToCart(p.product_id)}>Add to Cart</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="ai-chat-area">
          <div className="ai-chat-header">
            <h3>🤖 AI Gift Assistant</h3>
            {selectedProfile && (
              <span className="ai-chat-profile-badge">
                Shopping for: <strong>{selectedProfile.name}</strong> ({selectedProfile.relationship})
              </span>
            )}
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, i) => {
              if (msg.role === 'product') {
                const p = msg.product;
                return (
                  <div key={i} className="ai-chat-msg ai-chat-msg-assistant">
                    <div className="ai-chat-msg-avatar">🛍️</div>
                    <a
                      href={`/products/${p.product_id}`}
                      className="ai-chat-product-card"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {p.image_url && (
                        <img src={proxyImage(p.image_url)} alt={p.product_name} onError={e => { e.target.style.display = 'none'; }} />
                      )}
                      <div className="ai-chat-product-info">
                        <span className="ai-chat-product-name">{p.product_name}</span>
                        <span className="ai-chat-product-brand">{p.brand}</span>
                        <div className="ai-chat-product-meta">
                          <span className="ai-chat-product-price">${p.final_price}</span>
                          {p.rating && <span className="ai-chat-product-rating">⭐ {p.rating}</span>}
                        </div>
                      </div>
                      <div className="ai-chat-product-actions">
                        <span className="btn-primary btn-xs">View Product →</span>
                        <button className="btn-secondary btn-xs" onClick={(e) => { e.preventDefault(); addToCart(p.product_id); }}>
                          🛒 Add to Cart
                        </button>
                      </div>
                    </a>
                  </div>
                );
              }

              return (
                <div key={i} className={`ai-chat-msg ai-chat-msg-${msg.role}`}>
                  <div className="ai-chat-msg-avatar">
                    {msg.role === 'assistant' ? '🤖' : '👤'}
                  </div>
                  <div className="ai-chat-msg-content">
                    {renderTextContent(msg.content)}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="ai-chat-msg ai-chat-msg-assistant">
                <div className="ai-chat-msg-avatar">🤖</div>
                <div className="ai-chat-msg-content">
                  <div className="ai-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="ai-chat-input-area">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedProfile
                ? `Ask about gifts for ${selectedProfile.name}...`
                : 'Ask me about gift ideas...'}
              rows={1}
              disabled={sending}
            />
            <button
              className="btn-primary ai-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
            >
              {sending ? '...' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;