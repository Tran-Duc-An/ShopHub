import pandas as pd
import ollama
import json
import random

# 1. Load the dataset
df = pd.read_csv('cleaned_prices_products.csv')

def get_seller_pool():
    prompt = """You are an e-commerce expert. Generate a list of 60 highly professional, realistic e-commerce Seller/Store names. 
Include a mix of store types (Tech, Fashion, Home Goods, General, Beauty, etc.).
Return ONLY a valid JSON object in this exact format, with no other text:
{
  "sellers": ["Premium Goods Store", "TechHaven Direct", "Style & Co", ...]
}
"""
    print("Asking Gemma3:1b to generate a pool of realistic sellers...")
    try:
        response = ollama.chat(model='gemma3:1b', messages=[
            {'role': 'user', 'content': prompt}
        ])
        
        output = response['message']['content']
        output = output.replace('```json', '').replace('```', '').strip()
        
        data = json.loads(output)
        return data.get('sellers', [])
    except Exception as e:
        print(f"Error generating sellers: {e}")
        # Fallback list just in case the LLM formatting fails
        return ["Global Goods", "Prime Retailers", "Tech & Lifestyle Co."]

# Get the list of sellers from the LLM
seller_pool = get_seller_pool()
print(f"Success! Generated {len(seller_pool)} unique seller names.")

# 2. Map every unique brand to a specific seller from the pool
# This ensures repeating sellers AND keeps the same brand tied to the same seller!
print("Mapping brands to sellers and fixing missing prices...")
unique_brands = df['brand'].fillna('Generic').unique()
brand_to_seller = {brand: random.choice(seller_pool) for brand in unique_brands}

def apply_fixes(row):
    # A. Assign the repeating seller based on the product's brand
    brand = row['brand'] if pd.notna(row['brand']) else 'Generic'
    row['seller_name'] = brand_to_seller[brand]
    
    # B. Fast math to fix missing initial prices (adds a realistic 10% to 40% markup)
    if pd.isna(row['initial_price']):
        # Example: If final price is $100, markup will be between $110 and $140
        markup_percentage = random.uniform(1.10, 1.40)
        row['initial_price'] = round(row['final_price'] * markup_percentage, 2)
        
    return row

# 3. Apply the logic to all 5,000 rows instantly
df = df.apply(apply_fixes, axis=1)

# Save the final dataset
df.to_csv('final_ecommerce_dataset.csv', index=False)
print("Finished! All 5,000 rows processed. Saved to final_ecommerce_dataset.csv")