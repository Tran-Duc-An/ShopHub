import sqlite3
import pandas as pd

# 1. Connect to the SQLite database
conn = sqlite3.connect('ecommerce_advanced.db')
cursor = conn.cursor()

# Enable foreign key constraints in SQLite
cursor.execute('PRAGMA foreign_keys = ON;')

# 2. Build the Scalable Schema
schema_queries = [
    """
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        password TEXT,
        role TEXT NOT NULL CHECK(role IN ('customer', 'seller', 'admin')),
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER,
        product_name TEXT NOT NULL,
        description TEXT,
        brand TEXT,
        initial_price REAL,
        final_price REAL,
        currency TEXT,
        rating REAL,
        reviews_count INTEGER,
        image_url TEXT,
        category TEXT,
        stock_quantity INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users (user_id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS carts (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE, -- Assuming 1 active cart per user
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS cart_items (
        cart_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts (cart_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
        UNIQUE(cart_id, product_id) -- Prevents duplicate rows for the same product in a cart
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price_at_purchase REAL NOT NULL, -- Crucial for historical accuracy
        FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE RESTRICT
    )
    """
]

for query in schema_queries:
    cursor.execute(query)

# 3. Load the dataset and migrate the data
df = pd.read_csv('ecommerce_dataset.csv')

# Extract unique sellers and generate mock emails
unique_sellers = df['seller_name'].dropna().unique()
seller_records = [
    (seller, 'seller', f"seller_{i}@example.com") 
    for i, seller in enumerate(unique_sellers)
]

# Insert sellers into the users table
cursor.executemany('''
INSERT OR IGNORE INTO users (name, role, email) VALUES (?, ?, ?)
''', seller_records)

# Fetch user_ids to map to products
cursor.execute("SELECT user_id, name FROM users WHERE role='seller'")
seller_mapping = {row[1]: row[0] for row in cursor.fetchall()}

# Prepare the products dataframe
df['seller_id'] = df['seller_name'].map(seller_mapping)
df = df.drop(columns=['seller_name'])

# Insert the products data
df.to_sql('products', conn, if_exists='append', index=False)

conn.commit()
conn.close()

print("Future-proof scalable database 'ecommerce_advanced.db' created successfully!")