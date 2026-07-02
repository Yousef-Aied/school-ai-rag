from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import logging
from typing import List, Optional
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


# indexer.py: Stores data in ChromaDB and handles updates
# need to do two things:
# Convert each chunk to an Embedding (numbers representing meaning)
# Storage it in a Vector DB (Chroma) so we can search for the meaning later
def get_embeddings():
    # Working locally
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


def build_or_load_vectorstore(
    chunks: Optional[List[Document]],
    persist_dir: str,
):

    embeddings = get_embeddings()

    if not persist_dir:
        logger.error("Persist directory is empty")
        raise ValueError("persist_dir cannot be empty")

    # If you have a persist_dir file containing data, Chroma will read it
    # If he has free time, he'll build from chunks
    if chunks is None:
        logger.info("Loading existing vectorstore")

        return Chroma(persist_directory=persist_dir, embedding_function=embeddings)

    if not chunks:
        logger.error("No chunks provided to build vectorstore")
        raise ValueError("chunks cannot be empty")

    logger.info(
        "Building new vectorstore with %d chunks",
        len(chunks),
    )

    # Extracting IDs from the metadata we previously created
    ids = [c.metadata["id"] for c in chunks]

    # Passing the ids to the function
    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir,
        ids=ids,
    )
