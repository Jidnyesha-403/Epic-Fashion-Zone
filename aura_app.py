import os
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "1"
import warnings

# 1. SILENCE THE NOISE
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"
os.environ["PYTHONWARNINGS"] = "ignore"
warnings.filterwarnings("ignore")

import streamlit as st
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

# MUST BE FIRST
st.set_page_config(page_title="AuraStyle AI", page_icon="✨")
load_dotenv()

# 4. Initialize Models & Client
@st.cache_resource
def load_models():
    # Fresh initialization
    client = Groq(api_key=os.getenv("GROQ_API_KEY")) 
    embed_model = SentenceTransformer('all-MiniLM-L6-v2')
    return client, embed_model

client, embed_model = load_models()

# 5. Connect to Database with Path Safety
@st.cache_resource
def get_db():
    import os
    # This finds the folder where aura_app.py is currently saved
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # We force the path to look for 'chroma_db' in that specific folder
    db_path = os.path.join(base_dir, "chroma_db")
    
    # If it still shows 0, it means your indexing script saved it one folder up.
    # If the count is 0, we try the parent folder automatically:
    chroma_client = chromadb.PersistentClient(path=db_path)
    collection = chroma_client.get_or_create_collection(name="fashion_items")
    
    if collection.count() == 0:
        parent_db_path = os.path.join(os.path.dirname(base_dir), "chroma_db")
        chroma_client = chromadb.PersistentClient(path=parent_db_path)
        collection = chroma_client.get_or_create_collection(name="fashion_items")
        
    return collection

try:
    collection = get_db()
except Exception as e:
    st.error(f"Database Connection Failed: {e}")
    st.stop()

# 6. UI Layout
st.title("🛍️ AuraStyle: AI Personal Shopper")
st.caption("Epic Fashion Zone Project")

# Initialize Session State
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hello! I'm Aura. I'm ready to find your fashion items. What are you looking for?"}
    ]

# Display Chat History
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# 7. Chat Logic
if prompt := st.chat_input("Search for sarees, jewelry, or home decor..."):
    # Show User Message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Search Logic
    try:
        # Generate embedding for the search query
        query_vec = embed_model.encode(prompt).tolist()
        results = collection.query(query_embeddings=[query_vec], n_results=1)
        
        # Check if we found a match (Checking the distance/threshold)
        if results['documents'] and len(results['documents'][0]) > 0:
            best_match = results['documents'][0][0]
            
            # AI Response Generation
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": f"You are a professional fashion stylist. Use this product info to give a helpful recommendation: {best_match}"},
                    {"role": "user", "content": prompt}
                ]
            )
            final_text = response.choices[0].message.content
        else:
            final_text = "I'm sorry, I couldn't find a matching item in our current collection. Try searching for something else!"

        # Display Assistant Message
        with st.chat_message("assistant"):
            st.markdown(final_text)
        
        st.session_state.messages.append({"role": "assistant", "content": final_text})

    except Exception as e:
        st.error(f"Search failed: {e}")

# --- SIDEBAR ---
with st.sidebar:
    st.header("✨ System Status")
    
    # Verify the database count
    try:
        count = collection.count()
        st.success(f"Items Indexed: {count}")
    except:
        st.warning("Could not count database items.")

    if st.button("Clear Chat History"):
        st.session_state.messages = []
        st.rerun()