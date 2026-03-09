import pandas as pd
import json
import ast

# 1. Load the original dataset
df = pd.read_csv('formatted_urls_dataset.csv')

def format_list_urls(url_str):
    url_str = str(url_str).strip()
    
    # Check if the string has a list format
    if '[' in url_str and ']' in url_str:
        # Fix the case where 'https://' is accidentally pasted before the list
        if url_str.startswith('https://['):
            url_str = url_str.replace('https://[', '[', 1)
        
        try:
            # Try to parse the string as a JSON list
            parsed_list = json.loads(url_str)
            if isinstance(parsed_list, list) and len(parsed_list) > 0:
                return parsed_list[0] # Return just the first URL
        except json.JSONDecodeError:
            try:
                # Fallback parser if JSON fails
                parsed_list = ast.literal_eval(url_str)
                if isinstance(parsed_list, list) and len(parsed_list) > 0:
                    return parsed_list[0]
            except (ValueError, SyntaxError):
                pass # If all parsing fails, just return the original string
                
    return url_str

# 2. Apply the parsing function to fix Lazada list links
df['image_url'] = df['image_url'].apply(format_list_urls)

# 3. Handle missing values and strip any remaining weird quotes (like the Walmart links)
df['image_url'] = df['image_url'].fillna('')
df['image_url'] = df['image_url'].astype(str).str.strip(' \'"')

# 4. Save to a new CSV file
df.to_csv('cleaned_ecommerce_dataset.csv', index=False)

print("Formatting complete! Clean URLs are now in 'cleaned_ecommerce_dataset.csv'.")