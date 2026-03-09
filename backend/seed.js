/**
 * Seed script: reads ecommerce_dataset.csv and populates MongoDB
 * Usage: node seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('./models/User');
const Product = require('./models/Product');

const CSV_PATH = path.resolve(__dirname, '..', 'DATA', 'ecommerce_dataset.csv');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany({}), Product.deleteMany({})]);
  console.log('Cleared existing users and products');

  // Read CSV
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  console.log(`CSV headers: ${headers.join(', ')}`);
  console.log(`Total rows: ${lines.length - 1}`);

  // Collect unique sellers
  const sellerNames = new Set();
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => row[h] = fields[idx]);
    rows.push(row);

    if (row.seller_name) sellerNames.add(row.seller_name);
  }

  // Create seller users
  const sellerDocs = await User.insertMany(
    [...sellerNames].map((name, i) => ({
      name,
      role: 'seller',
      email: `seller_${i}@example.com`
    }))
  );
  const sellerMap = {};
  sellerDocs.forEach(s => { sellerMap[s.name] = s._id; });
  console.log(`Created ${sellerDocs.length} sellers`);

  // Create products in batches
  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
      .filter(row => row.product_name && parseFloat(row.final_price))
      .map(row => ({
      seller: sellerMap[row.seller_name] || null,
      product_name: row.product_name,
      description: row.description || null,
      brand: row.brand || null,
      initial_price: parseFloat(row.initial_price) || null,
      final_price: parseFloat(row.final_price) || null,
      currency: row.currency || 'USD',
      rating: parseFloat(row.rating) || null,
      reviews_count: parseInt(row.reviews_count) || 0,
      image_url: row.image_url || null,
      category: row.category || null,
      stock_quantity: 100
    }));

    await Product.insertMany(batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length} products`);
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
