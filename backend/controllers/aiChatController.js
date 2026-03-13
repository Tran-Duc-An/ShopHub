const GiftProfile = require('../models/GiftProfile');
const Product = require('../models/Product');
const ChatHistory = require('../models/ChatHistory');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── AI caller ────────────────────────────────────────────

async function callAI(systemPrompt, userMessage) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1200,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Unknown Groq error');
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// ─── Occasion hints ───────────────────────────────────────

const OCCASION_CATEGORY_HINTS = {
  "valentine's day": ['Jewelry & Watches', 'Beauty & Personal Care', "Women's Clothing", 'Shoes & Footwear', 'Bags & Luggage', 'Art & Crafts'],
  'birthday':        ['Toys & Games', 'Gaming', 'Electronics', 'Jewelry & Watches', 'Books & Stationery', 'Beauty & Personal Care', 'Smartphones & Accessories'],
  'christmas':       ['Toys & Games', 'Gaming', 'Electronics', 'Home & Kitchen', 'Books & Stationery', "Men's Clothing", "Women's Clothing", 'Musical Instruments'],
  'anniversary':     ['Jewelry & Watches', 'Beauty & Personal Care', 'Furniture & Decor', 'Shoes & Footwear', 'Bags & Luggage', 'Food & Beverages'],
  "mother's day":    ['Beauty & Personal Care', 'Jewelry & Watches', 'Home & Kitchen', 'Furniture & Decor', "Women's Clothing", 'Health & Wellness', 'Garden & Outdoor Living'],
  "father's day":    ['Electronics', 'Sports & Outdoors', 'Fitness & Gym', 'Tools & Hardware', 'Automotive', "Men's Clothing", 'Books & Stationery'],
  'graduation':      ['Electronics', 'Computers & Laptops', 'Books & Stationery', 'Bags & Luggage', 'Office Supplies', 'Shoes & Footwear'],
  'wedding':         ['Home & Kitchen', 'Furniture & Decor', 'Jewelry & Watches', 'Lighting', 'Art & Crafts', 'Food & Beverages'],
  'housewarming':    ['Home & Kitchen', 'Furniture & Decor', 'Lighting', 'Garden & Outdoor Living', 'Tools & Hardware', 'Electronics'],
  'thank you':       ['Beauty & Personal Care', 'Books & Stationery', 'Home & Kitchen', 'Food & Beverages', 'Art & Crafts', 'Health & Wellness'],
  'just because':    [],
};

function detectOccasion(message) {
  const lower = message.toLowerCase();
  for (const key of Object.keys(OCCASION_CATEGORY_HINTS)) {
    if (lower.includes(key)) return key;
  }
  if (lower.includes('xmas'))                                return 'christmas';
  if (lower.includes('bday') || lower.includes('birth day')) return 'birthday';
  if (lower.includes('mom') || lower.includes('mother'))     return "mother's day";
  if (lower.includes('dad') || lower.includes('father'))     return "father's day";
  return '';
}

// ─── Product pool builder ─────────────────────────────────

async function getProductsForProfile(profile, occasion = '', excludeProductIds = []) {
  const SAMPLE_TIER1 = 25;
  const SAMPLE_TIER2 = 20;
  const SAMPLE_TIER3 = 15;
  const FALLBACK     = 50;
  const RATING_FLOOR = 3.0;

  const priceFilter = profile?.price_range_max
    ? { final_price: { $gte: profile.price_range_min || 0, $lte: profile.price_range_max } }
    : {};

  const excludeFilter = excludeProductIds.length > 0
    ? { _id: { $nin: excludeProductIds } }
    : {};

  const qualityFilter = { $or: [{ rating: { $gte: RATING_FLOOR } }, { rating: null }] };
  const collectedIds  = new Set(excludeProductIds.map(id => id.toString()));

  const sampleTier = async (matchStage, size) => {
    const mongoose = require('mongoose');
    const docs = await Product.aggregate([
      { $match: { ...matchStage, _id: { $nin: Array.from(collectedIds).map(id => new mongoose.Types.ObjectId(id)) } } },
      { $sample: { size: size * 3 } },
      { $match: qualityFilter },
      { $limit: size },
      { $project: { product_name: 1, brand: 1, category: 1, final_price: 1, rating: 1, image_url: 1 } }
    ]);
    docs.forEach(p => collectedIds.add(p._id.toString()));
    return docs;
  };

  let tier1 = [];
  if (profile?.preferred_categories?.length > 0) {
    tier1 = await sampleTier(
      { category: { $in: profile.preferred_categories }, ...priceFilter, ...excludeFilter },
      SAMPLE_TIER1
    );
  }

  const occasionKey   = occasion.toLowerCase().trim();
  const occasionHints = OCCASION_CATEGORY_HINTS[occasionKey] ?? [];
  const preferredSet  = new Set((profile?.preferred_categories || []).map(c => c.toLowerCase()));
  const freshHints    = occasionHints.filter(c => !preferredSet.has(c.toLowerCase()));

  let tier2 = [];
  if (freshHints.length > 0) {
    tier2 = await sampleTier(
      { category: { $in: freshHints }, ...priceFilter, ...excludeFilter },
      SAMPLE_TIER2
    );
  }

  let tier3 = [];
  if (profile?.interests?.length > 0) {
    const keywords = profile.interests
      .flatMap(i => i.split(/[\s,]+/))
      .filter(w => w.length > 2)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (keywords.length > 0) {
      const rx = new RegExp(keywords.join('|'), 'i');
      tier3 = await sampleTier(
        { $or: [{ product_name: rx }, { category: rx }, { brand: rx }], ...priceFilter, ...excludeFilter },
        SAMPLE_TIER3
      );
    }
  }

  const combined = [...tier1, ...tier2, ...tier3];

  if (combined.length < 10) {
    return await Product.aggregate([
      { $match: { ...priceFilter, ...excludeFilter, ...qualityFilter } },
      { $sample: { size: FALLBACK } },
      { $project: { product_name: 1, brand: 1, category: 1, final_price: 1, rating: 1, image_url: 1 } }
    ]);
  }

  return combined.sort(() => Math.random() - 0.5);
}

// ─── Profile context builder ──────────────────────────────

function buildProfileContext(profile) {
  const lines = [];
  lines.push(`Name: ${profile.name}`);
  lines.push(`Relationship: ${profile.relationship}`);
  if (profile.birthday) {
    lines.push(`Birthday: ${new Date(profile.birthday).toLocaleDateString()}`);
  }
  if (profile.interests?.length > 0) {
    lines.push(`Interests: ${profile.interests.join(', ')}`);
  }
  if (profile.preferred_categories?.length > 0) {
    lines.push(`Preferred categories: ${profile.preferred_categories.join(', ')}`);
  }
  lines.push(`Budget: $${profile.price_range_min} – $${profile.price_range_max}`);
  if (profile.notes) {
    lines.push(`Notes: ${profile.notes}`);
  }

  if (profile.gift_history?.length > 0) {
    lines.push('\nPrevious gifts given:');
    profile.gift_history.forEach(g => {
      const name     = g.product?.product_name || 'Unknown';
      const reaction = g.reaction     ? ` → they ${g.reaction} it` : '';
      const note     = g.feedback_note ? `: "${g.feedback_note}"`  : '';
      lines.push(`  - "${name}" for ${g.occasion}${reaction}${note}`);
    });

    const disliked = profile.gift_history
      .filter(g => g.reaction === 'disliked')
      .map(g => g.product?.product_name)
      .filter(Boolean);
    if (disliked.length > 0) {
      lines.push(`\n⚠ Do NOT suggest these again: ${disliked.join(', ')}`);
    }
  }

  return lines.join('\n');
}

// ─── System prompt ────────────────────────────────────────

function buildSystemPrompt(categories, products, profileContext) {
  let prompt = `You are a helpful and friendly AI gift assistant for ShopHub.

Available categories: ${categories.join(', ')}

Available products — ONLY suggest from this list, NEVER invent products or IDs:
${products.map(p =>
  `- [ID:${p._id}] ${p.product_name} by ${p.brand || 'N/A'} ($${p.final_price}, ${p.category}, ⭐${p.rating ?? 'N/A'})`
).join('\n')}
`;

  if (profileContext) {
    prompt += `\nShopping for:\n${profileContext}\n`;
  }

  prompt += `
RULES:
1. ONLY suggest products from the list above
2. For EVERY product you mention include [PRODUCT:id] using the EXACT 24-char id shown
3. Never invent IDs — copy them verbatim from the list
4. Respect the person's budget, interests, and past feedback
5. Never suggest products marked ⚠ Do NOT suggest
6. Explain briefly why each product fits this person
7. Always show the price
8. Be warm and enthusiastic`;

  return prompt;
}

// ─── Product DTO ──────────────────────────────────────────

function toDTO(p) {
  return {
    product_id:   p._id,
    product_name: p.product_name,
    brand:        p.brand,
    category:     p.category,
    final_price:  p.final_price,
    rating:       p.rating,
    image_url:    p.image_url,
  };
}

// ─── Extract products AI referenced ──────────────────────

function extractReferencedProducts(aiReply, productPool) {
  const result = [];
  const added  = new Set();

  const tryAdd = (p) => {
    const key = p._id.toString();
    if (!added.has(key)) { added.add(key); result.push(toDTO(p)); }
  };

  const idPattern = /\[PRODUCT:\s*([a-f0-9]{24})\s*\]/gi;
  let match;
  while ((match = idPattern.exec(aiReply)) !== null) {
    const product = productPool.find(p => p._id.toString() === match[1].trim());
    if (product) tryAdd(product);
    else console.warn('AI hallucinated product ID:', match[1]);
  }

  const byLength = [...productPool].sort((a, b) => b.product_name.length - a.product_name.length);
  for (const p of byLength) {
    if (added.has(p._id.toString())) continue;
    const escaped = p.product_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i').test(aiReply)) tryAdd(p);
  }

  result.sort((a, b) => {
    const posA = aiReply.toLowerCase().indexOf(a.product_name.toLowerCase());
    const posB = aiReply.toLowerCase().indexOf(b.product_name.toLowerCase());
    return posA - posB;
  });

  return result;
}

// ─── Routes ───────────────────────────────────────────────

const chat = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY not set' });
    }

    const { message, profile_id, product_id, feedbackType, context } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required' });

    let profile        = null;
    let profileContext = '';
    let excludeIds     = [];

    if (profile_id) {
      // Only populate gift_history.product — no product_preferences
      profile = await GiftProfile.findById(profile_id)
        .populate('gift_history.product', 'product_name brand category final_price');

      if (profile?.user.toString() === req.user.id) {
        profileContext = buildProfileContext(profile);
        excludeIds = profile.gift_history
          .filter(g => g.reaction === 'disliked' && g.product?._id)
          .map(g => g.product._id);
      } else {
        profile = null;
      }
    }

    const occasion = detectOccasion(message);
    const [categories, products] = await Promise.all([
      Product.distinct('category'),
      getProductsForProfile(profile, occasion, excludeIds),
    ]);

    const systemPrompt = buildSystemPrompt(categories, products, profileContext);
    const rawReply     = await callAI(systemPrompt, message);

    const referencedProducts = extractReferencedProducts(rawReply, products);
    const cleanReply = rawReply
      .replace(/\[PRODUCT:\s*[^\]]*\]/gi, '')
      .replace(/  +/g, ' ')
      .trim();

    try {
      await ChatHistory.create({
        user:         req.user.id,
        product:      product_id || referencedProducts[0]?.product_id || null,
        message,
        feedbackType: feedbackType || null,
        context:      context || null,
      });
    } catch (err) {
      console.error('ChatHistory save failed:', err.message);
    }

    res.json({ reply: cleanReply, recommended_products: referencedProducts });
  } catch (error) {
    res.status(502).json({ message: `AI service error: ${error.message}` });
  }
};

const suggest = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY not set' });
    }

    const { profile_id, occasion } = req.body;
    if (!profile_id || !occasion) {
      return res.status(400).json({ message: 'profile_id and occasion are required' });
    }

    // Only populate gift_history.product — no product_preferences
    const profile = await GiftProfile.findById(profile_id)
      .populate('gift_history.product', 'product_name brand category final_price');

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const profileContext = buildProfileContext(profile);
    const excludeIds = profile.gift_history
      .filter(g => g.reaction === 'disliked' && g.product?._id)
      .map(g => g.product._id);

    const matchingProducts = await getProductsForProfile(profile, occasion, excludeIds);

    const productList = matchingProducts.map(p =>
      `- [ID:${p._id}] ${p.product_name} by ${p.brand || 'N/A'} ($${p.final_price}, ${p.category}, ⭐${p.rating ?? 'N/A'})`
    ).join('\n');

    const userMessage = [
      `Suggest gifts for ${occasion} for:`,
      profileContext,
      `\nAvailable products:\n${productList}`,
      `\nRecommend the top 5 best gifts. For each include [PRODUCT:id] with the exact ID. Explain why each fits this person and occasion.`,
    ].join('\n');

    const systemPrompt = `You are a thoughtful gift recommendation assistant for ShopHub. Suggest gifts ONLY from the provided list. For every product you mention include [PRODUCT:id] using the EXACT 24-char ID shown. Never invent IDs. Be warm and format with numbered suggestions.`;

    const rawReply = await callAI(systemPrompt, userMessage);

    const referencedProducts = extractReferencedProducts(rawReply, matchingProducts);
    const cleanReply = rawReply
      .replace(/\[PRODUCT:\s*[^\]]*\]/gi, '')
      .replace(/  +/g, ' ')
      .trim();

    res.json({
      reply:                cleanReply,
      occasion,
      profile_name:         profile.name,
      recommended_products: referencedProducts,
    });
  } catch (error) {
    res.status(502).json({ message: `AI service error: ${error.message}` });
  }
};

// ─── Feedback ─────────────────────────────────────────────

const getFeedback = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.product_id) filter.product = req.query.product_id;
    const feedbacks = await ChatHistory.find(filter)
      .populate('product', 'product_name brand image_url')
      .sort({ createdAt: -1 });
    res.json({ data: feedbacks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const postFeedback = async (req, res) => {
  try {
    const { product_id, message, rating, context } = req.body;
    if (!product_id || !message || !rating) {
      return res.status(400).json({ message: 'product_id, message, and rating are required' });
    }
    const feedback = await ChatHistory.create({
      user:    req.user.id,
      product: product_id,
      message,
      rating,
      context: context || null,
    });
    res.status(201).json({ data: feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { chat, suggest, getFeedback, postFeedback };