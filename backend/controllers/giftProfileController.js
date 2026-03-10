const GiftProfile = require('../models/GiftProfile');

// @desc    Get all gift profiles for logged-in user
// @route   GET /api/gift-profiles
const getProfiles = async (req, res) => {
  try {
    const profiles = await GiftProfile.find({ user: req.user.id })
      .sort({ created_at: -1 });

    res.json({
      data: profiles.map(p => ({
        profile_id: p._id,
        name: p.name,
        relationship: p.relationship,
        birthday: p.birthday,
        interests: p.interests,
        preferred_categories: p.preferred_categories,
        price_range_min: p.price_range_min,
        price_range_max: p.price_range_max,
        notes: p.notes,
        gift_history: p.gift_history,
        created_at: p.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single gift profile
// @route   GET /api/gift-profiles/:id
const getProfileById = async (req, res) => {
  try {
    const profile = await GiftProfile.findById(req.params.id)
      .populate('gift_history.product', 'product_name image_url final_price brand');

    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a gift profile
// @route   POST /api/gift-profiles
const createProfile = async (req, res) => {
  try {
    const { name, relationship, birthday, interests, preferred_categories, price_range_min, price_range_max, notes } = req.body;

    if (!name || !relationship) {
      return res.status(400).json({ message: 'Name and relationship are required' });
    }

    const profile = await GiftProfile.create({
      user: req.user.id,
      name,
      relationship,
      birthday,
      interests: interests || [],
      preferred_categories: preferred_categories || [],
      price_range_min: price_range_min || 0,
      price_range_max: price_range_max || 500,
      notes
    });

    res.status(201).json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a gift profile
// @route   PUT /api/gift-profiles/:id
const updateProfile = async (req, res) => {
  try {
    const profile = await GiftProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowed = ['name', 'relationship', 'birthday', 'interests', 'preferred_categories', 'price_range_min', 'price_range_max', 'notes'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) profile[field] = req.body[field];
    });

    await profile.save();
    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a gift profile
// @route   DELETE /api/gift-profiles/:id
const deleteProfile = async (req, res) => {
  try {
    const profile = await GiftProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await profile.deleteOne();
    res.json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add gift history entry to a profile
// @route   POST /api/gift-profiles/:id/gift-history
const addGiftHistory = async (req, res) => {
  try {
    const profile = await GiftProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { product_id, occasion, rating } = req.body;
    if (!product_id || !occasion) {
      return res.status(400).json({ message: 'product_id and occasion are required' });
    }

    profile.gift_history.push({
      product: product_id,
      occasion,
      date: new Date(),
      rating: rating || null
    });

    await profile.save();
    res.json({ data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfiles, getProfileById, createProfile, updateProfile, deleteProfile, addGiftHistory };
