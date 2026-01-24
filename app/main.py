from pathlib import Path

from app.rag.loader import load_pdfs
from app.rag.splitter import split_docs
from app.rag.indexer import build_or_load_vectorstore
from app.rag.retriever import retrieve_context
from app.llm.groq_client import ask_groq

BASE_DIR = Path(__file__).resolve().parent.parent  # project root
PDF_DIR = BASE_DIR / "data" / "pdfs"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

def build_index_if_needed():
    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    # If there are files inside vectorstore, consider it ready
    if any(VECTORSTORE_DIR.iterdir()):
        return build_or_load_vectorstore(chunks=None, persist_dir=str(VECTORSTORE_DIR))

    docs = load_pdfs(str(PDF_DIR))
    chunks = split_docs(docs)
    return build_or_load_vectorstore(chunks=chunks, persist_dir=str(VECTORSTORE_DIR))

def main():
    vs = build_index_if_needed()

    while True:
        q = input("\nAsk a question (or type 'exit'): ").strip()
        if q.lower() == "exit":
            break

        context = retrieve_context(vs, q, k=4)
        answer = ask_groq(q, context)
        print("\nAnswer:\n", answer)

if __name__ == "__main__":
    main()
