from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# indexer.py: Stores data in ChromaDB and handles updates
# need to do two things:
# Convert each chunk to an Embedding (numbers representing meaning)
# Storage it in a Vector DB (Chroma) so we can search for the meaning later
def get_embeddings():
    # Working locally
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def build_or_load_vectorstore(chunks, persist_dir: str):
    embeddings = get_embeddings()

    # If you have a persist_dir file containing data, Chroma will read it
    # If he has free time, he'll build from chunks
    if chunks is None:
        # Load existing DB
        return Chroma(persist_directory=persist_dir, embedding_function=embeddings)

    # Extracting IDs from the metadata we previously created
    ids = [c.metadata["id"] for c in chunks]
    
    # Passing the ids to the function
    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir,
        ids=ids,
    )