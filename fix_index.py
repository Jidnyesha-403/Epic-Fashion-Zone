import chromadb
import pandas as pd
import os

# 1. Use a 'Raw' string for the path to avoid the (unicode error)
# This path points exactly to where you are now
csv_path = r"products.csv" 

if not os.path.exists(csv_path):
    print(f"❌ Error: Could not find {csv_path} in the current folder!")
else:
    df = pd.read_csv(csv_path)
    
    # 2. Connect to ChromaDB
    # We use ../ because your .venv is one level up
    client = chromadb.PersistentClient(path="./chroma_db")
    
    # Reset the collection to ensure a clean start
    try:
        client.delete_collection(name="fashion_items")
    except:
        pass
    collection = client.create_collection(name="fashion_items")

    # 3. Dynamic Column Mapping (Fixes the KeyError)
    # We look for whatever column looks like 'Product' or 'Name'
    col_map = {col.lower(): col for col in df.columns}
    name_col = col_map.get('product') or col_map.get('name') or col_map.get('product name')
    cat_col = col_map.get('category')
    price_col = col_map.get('price')
    desc_col = col_map.get('description')

    # 4. Add the products
    for i, row in df.iterrows():
        p_name = row[name_col] if name_col else "Unknown Product"
        p_cat = row[cat_col] if cat_col else "General"
        p_price = row[price_col] if price_col else "N/A"
        p_desc = row[desc_col] if desc_col else ""

        product_info = f"Product: {p_name}, Category: {p_cat}, Price: {p_price}, Description: {p_desc}"
        
        collection.add(
            documents=[product_info],
            ids=[str(i)],
            metadatas=[{"category": str(p_cat)}]
        )

    print(f"✅ SUCCESS! Indexed {len(df)} products.")
    print(f"I found these columns: {list(df.columns)}")