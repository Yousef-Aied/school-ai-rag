from typing import Dict, Any, Optional

# retriever.py: Searches accurately using filters (Grade and Subject)

def retrieve_context(
    vectorstore,
    query: str,
    k: int = 4,
    grade: int | None = None,
    subject: str | None = None,
) -> str:
    clauses = []

    if subject and subject != "auto":
        clauses.append({"subject": subject.lower()})

    if grade is not None:
        clauses.append({"grade": int(grade)})

    filter_dict: Optional[Dict[str, Any]] = None

    if len(clauses) == 1:
        filter_dict = clauses[0]
    elif len(clauses) > 1:
        filter_dict = {"$and": clauses}


    search_kwargs: Dict[str, Any] = {"k": k}
    
    if filter_dict:
        search_kwargs["filter"] = filter_dict

    docs = vectorstore.similarity_search(query, **search_kwargs)

    if not docs:
        return ""

    formatted_docs = []
    for d in docs:
        source = d.metadata.get("source_file", "Unknown")
        page = d.metadata.get("page", 0)
        
        formatted_text = f"Source: {source} (Page {page})\nContent: {d.page_content}"
        formatted_docs.append(formatted_text)

    return "\n\n---\n\n".join(formatted_docs)
