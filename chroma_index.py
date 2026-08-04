"""
chroma_index.py
---------------
Reads products.csv, generates SentenceTransformer embeddings for each product,
and upserts them into a local persistent ChromaDB collection.

Usage:
    python chroma_index.py              # index / re-index products
    python chroma_index.py --query "silk wedding saree"   # semantic search demo
"""

import argparse
import pandas as pd 
import csv
import json
import os
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_DIR        = Path(__file__).parent
CSV_PATH        = BASE_DIR / "products.csv"
CHROMA_DIR      = BASE_DIR / "chroma_db"          # local persistent store
COLLECTION_NAME = "products"
MODEL_NAME      = "all-MiniLM-L6-v2"              # fast, lightweight ST model

# ── Helpers ─────────────────────────────────────────────────────────────────────

def build_document(row: dict) -> str:
    """Combine key product fields into a single searchable text document."""
    parts = [
        row.get("name", ""),
        row.get("description", ""),
        row.get("category", ""),
        row.get("occasion", ""),
        row.get("fabric", ""),
        row.get("tags", ""),
    ]
    return " | ".join(p for p in parts if p and p.lower() not in ("", "none"))


def load_products(csv_path: Path) -> list[dict]:
    """Load all rows from the CSV and return as a list of dicts."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


# ── Main indexing routine ────────────────────────────────────────────────────────

import pandas as pd
import os
import chromadb
from sentence_transformers import SentenceTransformer

def index_products():
    # Load CSV
    df = pd.read_csv("products.csv")
    
    # CLEAN HEADERS: Remove spaces and convert to lowercase for easier matching
    df.columns = df.columns.str.strip().str.lower()
    
    # PRINT FOR DEBUGGING: This will show you exactly what to put in row['...']
    print(f"I found these columns in your CSV: {df.columns.tolist()}")
    
    # Initialize Model & DB
    model = SentenceTransformer('all-MiniLM-L6-v2')
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection(name="fashion_items")

    print(f"Indexing {len(df)} products...")

    for i, row in df.iterrows():
        try:
            # We use lowercase names now because we normalized them above
            # Check your CSV: If the column is 'Product Name', it is now 'product name'
            # Adjust the strings below to match what was printed in the list above!
            
            p_name = row.get('product_name') or row.get('product name') or row.get('name')
            p_cat = row.get('category') or row.get('type')
            p_desc = row.get('description') or row.get('desc')
            p_price = row.get('price')
            p_img = row.get('image_url') or row.get('image')

            text = f"{p_name} {p_cat} {p_desc}"
            embedding = model.encode(text).tolist()
            
            collection.upsert(
                ids=[str(i)],
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "price": str(p_price),
                    "image_url": str(p_img)
                }]
            )
        except Exception as e:
            # Changed st.error to print because this isn't a Streamlit app!
            print(f"❌ Error at row {i}: {e}")
            continue 

    print("✅ Indexing process complete. Check your AuraStyle app now!")

if __name__ == "__main__":
    index_products()


# ── Semantic search demo ─────────────────────────────────────────────────────────

def query_products(query_text: str, n_results: int = 3):
    print(f"\n🔍  Query: \"{query_text}\"\n")

    model  = SentenceTransformer(MODEL_NAME)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))

    try:
        collection = client.get_collection(name=COLLECTION_NAME)
    except Exception:
        print("❌  Collection not found. Run without --query first to index products.")
        return

    query_embedding = model.encode([query_text]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    for rank, (doc, meta, dist) in enumerate(
        zip(results["documents"][0], results["metadatas"][0], results["distances"][0]), 1
    ):
        score = 1 - dist  # cosine similarity (higher = more similar)
        print(f"  #{rank}  {meta['name']}")
        print(f"       Category : {meta['category']}  |  Price: ₹{meta['price']:.0f}")
        print(f"       Occasion : {meta['occasion']}  |  Fabric: {meta['fabric']}")
        print(f"       Similarity: {score:.4f}")
        print(f"       Document : {doc[:120]}…")
        print()


# ── Entry point ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ChromaDB product indexer + search demo")
    parser.add_argument(
        "--query", "-q",
        type=str,
        default=None,
        help="Run a semantic search query instead of indexing.",
    )
    parser.add_argument(
        "--top", "-n",
        type=int,
        default=3,
        help="Number of results to return for a query (default: 3).",
    )
    args = parser.parse_args()

    if args.query:
        query_products(args.query, n_results=args.top)
    else:
        index_products()
