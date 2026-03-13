/**
 * lib/constants.js
 * ─────────────────────────────────────────────────────────
 * Single source of truth for all shared constant values.
 * Import from here instead of copy-pasting across files.
 *
 * Usage:
 *   import { OCCASIONS, RELATIONSHIPS, ALL_CATEGORIES } from '@/lib/constants'
 * ─────────────────────────────────────────────────────────
 */

// ─── Products ─────────────────────────────────────────────

export const PRODUCTS_PER_PAGE = 20;

export const SORT_OPTIONS = [
  { value: '',           label: 'Default Sort' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'newest',     label: 'Newest' },
];

export const ALL_CATEGORIES = [
  "Jewelry & Watches",
  "Men's Clothing",
  "Women's Clothing",
  "Cameras & Photography",
  "Shoes & Footwear",
  "Home & Kitchen",
  "Baby & Kids",
  "Fitness & Gym",
  "Bags & Luggage",
  "Beauty & Personal Care",
  "Automotive",
  "Pet Supplies",
  "Musical Instruments",
  "Food & Beverages",
];

// ─── Gift Profiles ────────────────────────────────────────

export const RELATIONSHIPS = [
  'girlfriend', 'boyfriend', 'wife', 'husband',
  'mom', 'dad', 'sister', 'brother',
  'friend', 'child', 'colleague', 'other',
];

export const RELATIONSHIP_EMOJIS = {
  girlfriend: '💕',
  boyfriend:  '💙',
  wife:       '💍',
  husband:    '💍',
  mom:        '🌸',
  dad:        '👔',
  sister:     '👯',
  brother:    '🤝',
  friend:     '🤗',
  child:      '🧒',
  colleague:  '💼',
  other:      '🎁',
};

export const SUGGESTED_INTERESTS = [
  'fashion', 'tech', 'cooking', 'gaming', 'music', 'reading',
  'fitness', 'travel', 'art', 'photography', 'outdoors', 'sports',
  'beauty', 'gardening', 'movies', 'yoga', 'coffee', 'pets',
];

export const REACTIONS = [
  { value: 'loved',    emoji: '😍', label: 'Loved it' },
  { value: 'liked',    emoji: '👍', label: 'Liked it' },
  { value: 'neutral',  emoji: '😐', label: 'Neutral'  },
  { value: 'disliked', emoji: '👎', label: 'Disliked'  },
];

// ─── AI Assistant ─────────────────────────────────────────

export const OCCASIONS = [
  'Birthday',
  "Valentine's Day",
  'Christmas',
  'Anniversary',
  "Mother's Day",
  "Father's Day",
  'Graduation',
  'Wedding',
  'Housewarming',
  'Thank You',
  'Just Because',
];

// ─── Orders ───────────────────────────────────────────────

export const ORDER_STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-600 border-amber-200',
  paid:      'bg-blue-50 text-blue-600 border-blue-200',
  shipped:   'bg-violet-50 text-violet-600 border-violet-200',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
};

// ─── Cart ─────────────────────────────────────────────────

export const RECIPIENT_RELATIONSHIPS = [
  { value: 'girlfriend', label: '💕 Girlfriend' },
  { value: 'boyfriend',  label: '💙 Boyfriend'  },
  { value: 'wife',       label: '💍 Wife'        },
  { value: 'husband',    label: '💍 Husband'     },
  { value: 'mom',        label: '🌸 Mom'         },
  { value: 'dad',        label: '👔 Dad'         },
  { value: 'sister',     label: '👯 Sister'      },
  { value: 'brother',    label: '🤝 Brother'     },
  { value: 'friend',     label: '🤗 Friend'      },
  { value: 'child',      label: '🧒 Child'       },
  { value: 'colleague',  label: '💼 Colleague'   },
  { value: 'other',      label: '🎁 Other'       },
];