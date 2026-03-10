const GiftProfile = require('../models/GiftProfile');
const Product = require('../models/Product');
const ChatHistory = require('../models/ChatHistory');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
    const detail = errData.error?.message || 'Unknown error';
    console.error('Groq API error:', res.status, detail);
    throw new Error(detail);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

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

async function getProductsForProfile(profile, occasion = '') {
  const MAX_TIER1 = 15;
  const MAX_TIER2 = 15;
  const MAX_TIER3 = 10;

  const priceFilter = profile?.price_range_max
    ? { final_price: { $gte: profile.price_range_min || 0, $lte: profile.price_range_max } }
    : {};

  const fields = 'product_name brand category final_price rating image_url';
  const collectedIds = new Set();
  const excludeIds = () => ({ $nin: Array.from(collectedIds) });

  const fetchTier = async (query, limit) => {
    const docs = await Product.find(query)
      .sort({ rating: -1 })
      .limit(limit)
      .select(fields)
      .lean();
    docs.forEach(p => collectedIds.add(p._id.toString()));
    return docs;
  };

  let tier1 = [];
  if (profile?.preferred_categories?.length > 0) {
    tier1 = await fetchTier({
      category: { $in: profile.preferred_categories },
      ...priceFilter
    }, MAX_TIER1);
  }

  const occasionKey = occasion.toLowerCase().trim();
  const occasionHints = OCCASION_CATEGORY_HINTS[occasionKey] ?? [];
  const preferredSet = new Set((profile?.preferred_categories || []).map(c => c.toLowerCase()));
  const freshHints = occasionHints.filter(c => !preferredSet.has(c.toLowerCase()));

  let tier2 = [];
  if (freshHints.length > 0) {
    tier2 = await fetchTier({
      _id: excludeIds(),
      category: { $in: freshHints },
      ...priceFilter
    }, MAX_TIER2);
  }

  let tier3 = [];
  if (profile?.interests?.length > 0) {
    const keywords = profile.interests
      .flatMap(i => i.split(/[\s,]+/))
      .filter(w => w.length > 2)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (keywords.length > 0) {
      const keywordRegex = new RegExp(keywords.join('|'), 'i');
      tier3 = await fetchTier({
        _id: excludeIds(),
        ...priceFilter,
        $or: [
          { product_name: keywordRegex },
          { category: keywordRegex },
          { brand: keywordRegex }
        ]
      }, MAX_TIER3);
    }
  }

  const combined = [...tier1, ...tier2, ...tier3];
  if (combined.length === 0) {
    return await Product.find(priceFilter)
      .sort({ rating: -1 })
      .limit(30)
      .select(fields)
      .lean();
  }

  return combined;
}

function detectOccasion(message) {
  const lower = message.toLowerCase();
  for (const key of Object.keys(OCCASION_CATEGORY_HINTS)) {
    if (lower.includes(key)) return key;
  }
  if (lower.includes('xmas')) return 'christmas';
  if (lower.includes('bday') || lower.includes('birth day')) return 'birthday';
  if (lower.includes('mom') || lower.includes('mother')) return "mother's day";
  if (lower.includes('dad') || lower.includes('father')) return "father's day";
  return '';
}

const chat = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'AI service is not configured. Set GROQ_API_KEY in environment.' });
    }

    const { message, profile_id, product_id, feedbackType, context } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let profile = null;
    let profileContext = '';
    if (profile_id) {
      profile = await GiftProfile.findById(profile_id)
        .populate('gift_history.product', 'product_name brand category final_price');

      if (profile && profile.user.toString() === req.user.id) {
        profileContext = buildProfileContext(profile);
      } else {
        profile = null;
      }
    }

    const detectedOccasion = detectOccasion(message);

    const [categories, products] = await Promise.all([
      Product.distinct('category'),
      getProductsForProfile(profile, detectedOccasion)
    ]);

    const systemPrompt = buildSystemPrompt(categories, products, profileContext);
    const rawReply = await callAI(systemPrompt, message);
    console.log('AI rawReply (chat):', rawReply);

    const referencedProducts = extractReferencedProducts(rawReply, products);
    const cleanReply = rawReply
      .replace(/\[PRODUCT:\s*[^\]]*\]/gi, '')
      .replace(/  +/g, ' ')
      .trim();

    // Save chat/feedback to ChatHistory
    try {
      await ChatHistory.create({
        user: req.user.id,
        product: product_id || (referencedProducts[0]?.product_id ?? null),
        message,
        feedbackType: feedbackType || null,
        context: context || null
      });
    } catch (err) {
      console.error('Failed to save chat history:', err.message);
    }

    res.json({ reply: cleanReply, recommended_products: referencedProducts });
  } catch (error) {
    res.status(502).json({ message: `AI service error: ${error.message}` });
  }
};

const suggest = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'AI service is not configured. Set GROQ_API_KEY in environment.' });
    }

    const { profile_id, occasion } = req.body;
    if (!profile_id || !occasion) {
      return res.status(400).json({ message: 'profile_id and occasion are required' });
    }

    const profile = await GiftProfile.findById(profile_id)
      .populate('gift_history.product', 'product_name brand category final_price');

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const profileContext = buildProfileContext(profile);
    const matchingProducts = await getProductsForProfile(profile, occasion);

    const productList = matchingProducts.map(p =>
      `- [ID:${p._id}] ${p.product_name} by ${p.brand} ($${p.final_price}, ${p.category}, rating: ${p.rating})`
    ).join('\n');

    const userMessage = `I need gift suggestions for ${occasion} for someone with these details:\n${profileContext}\n\nHere are available products in our store that match their preferences:\n${productList}\n\nPlease recommend the top 5 best gifts from this list. For each product, include its ID using exactly the format [PRODUCT:id] so I can link to it. Explain why each would be great for this person and occasion.`;

    const systemPrompt = `You are a thoughtful gift recommendation assistant for an e-commerce store called ShopHub. Suggest gifts ONLY from the available products provided. For every product you mention, you MUST include the product link using the format [PRODUCT:id] where id is the EXACT ID from the product list above (e.g., [PRODUCT:65f123abc456def789012345]). Never invent or make up IDs. For example: 1. Pink Quartz Watch [PRODUCT:65f123abc456def789012345] - This is a great gift because... Be warm and helpful. Format your response with numbered suggestions.`;

    const rawReply = await callAI(systemPrompt, userMessage);
    console.log('AI rawReply (suggest):', rawReply);

    const referencedProducts = extractReferencedProducts(rawReply, matchingProducts);
    const cleanReply = rawReply
      .replace(/\[PRODUCT:\s*[^\]]*\]/gi, '')
      .replace(/  +/g, ' ')
      .trim();

    res.json({
      reply: cleanReply,
      occasion,
      profile_name: profile.name,
      recommended_products: referencedProducts
    });
  } catch (error) {
    res.status(502).json({ message: `AI service error: ${error.message}` });
  }
};

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
  lines.push(`Budget: $${profile.price_range_min} - $${profile.price_range_max}`);
  if (profile.notes) {
    lines.push(`Notes: ${profile.notes}`);
  }
  if (profile.gift_history?.length > 0) {
    lines.push('Previous gifts given:');
    profile.gift_history.forEach(g => {
      const productName = g.product?.product_name || 'Unknown';
      lines.push(`  - ${productName} for ${g.occasion}${g.rating ? ` (rated ${g.rating}/5)` : ''}`);
    });
  }
  return lines.join('\n');
}

function buildSystemPrompt(categories, products, profileContext) {
  let prompt = `You are a helpful and friendly AI shopping assistant for ShopHub, an e-commerce store. You help users find the perfect gifts for their loved ones.

Available product categories in our store: ${categories.join(', ')}

Available products (ONLY suggest from this list — do not invent products or IDs):
${products.map(p => `- [ID:${p._id}] ${p.product_name} by ${p.brand} ($${p.final_price}, ${p.category}, rating: ${p.rating})`).join('\n')}
`;

  if (profileContext) {
    prompt += `\nThe user is looking for gifts for someone with these details:\n${profileContext}\n`;
  }

  prompt += `\nIMPORTANT RULES:
1. ONLY suggest products from the list above — never invent products
2. For EVERY product you mention, include [PRODUCT:id] using the EXACT ID from the list (e.g., [PRODUCT:65f123abc456def789012345])
3. Never invent or make up IDs — only use IDs shown above
4. Consider the person's interests, relationship, and budget
5. Explain why each suggestion would be a good fit
6. Be warm, personable, and enthusiastic
7. Tailor suggestions to the occasion if one is mentioned
8. Avoid suggesting items already given before (check gift history)
9. Always include the price when mentioning a product`;

  return prompt;
}

function toProductDTO(p) {
  return {
    product_id: p._id,
    product_name: p.product_name,
    brand: p.brand,
    category: p.category,
    final_price: p.final_price,
    rating: p.rating,
    image_url: p.image_url
  };
}

function extractReferencedProducts(aiReply, productPool) {
  const result = [];
  const addedIds = new Set();

  const tryAdd = (product) => {
    const key = product._id.toString();
    if (!addedIds.has(key)) {
      addedIds.add(key);
      result.push(toProductDTO(product));
    }
  };

  const idPattern = /\[PRODUCT:\s*([a-f0-9]{24})\s*\]/gi;
  let match;
  while ((match = idPattern.exec(aiReply)) !== null) {
    const id = match[1].trim();
    const product = productPool.find(p => p._id.toString() === id);
    if (product) {
      tryAdd(product);
    } else {
      console.warn(`AI hallucinated product ID: ${id} — trying name match`);
    }
  }

  const byNameLength = [...productPool].sort(
    (a, b) => b.product_name.length - a.product_name.length
  );
  for (const product of byNameLength) {
    if (addedIds.has(product._id.toString())) continue;
    const escaped = product.product_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i');
    if (nameRegex.test(aiReply)) {
      tryAdd(product);
    }
  }

  result.sort((a, b) => {
    const posA = aiReply.toLowerCase().indexOf(a.product_name.toLowerCase());
    const posB = aiReply.toLowerCase().indexOf(b.product_name.toLowerCase());
    return posA - posB;
  });

  return result;
}

// Feedback endpoints (must be exported for router)
const getFeedback = async (req, res) => {
  try {
    const { product_id } = req.query;
    const filter = { user: req.user.id };
    if (product_id) filter.product = product_id;
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
      user: req.user.id,
      product: product_id,
      message,
      rating,
      context: context || null
    });
    res.status(201).json({ data: feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { chat, suggest, getFeedback, postFeedback };