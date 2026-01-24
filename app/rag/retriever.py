from typing import List, Dict, Any, Optional

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

# def retrieve_context(
#     vectorstore,
#     query: str,
#     k: int = 4,
#     grade: int | None = None,
#     subject: str | None = None,
# ) -> str:
#     clauses = []

#     # Filter the material (if not auto)
#     if subject and subject != "auto":
#         clauses.append({"subject": subject})

#     # Filter the row (if available)
#     if grade is not None:
#         clauses.append({"grade": int(grade)})

#     # Chroma: If there are two conditions, then $and
#     if len(clauses) == 0:
#         docs = vectorstore.similarity_search(query, k=k)
#     elif len(clauses) == 1:
#         docs = vectorstore.similarity_search(query, k=k, filter=clauses[0])
#     else:
#         docs = vectorstore.similarity_search(query, k=k, filter={"$and": clauses})

#     return "\n\n---\n\n".join([d.page_content for d in docs])

# def retrieve_context(vectorstore, query: str, k: int = 4, grade: int | None = None, subject: str | None = None) -> str:
#     flt = {}

#     # Filter the subject (if available)
#     if subject and subject != "auto":
#         flt["subject"] = subject

#     # Filter the row (if available)
#     if grade is not None:
#         flt["grade"] = grade

#     if flt:
#         docs = vectorstore.similarity_search(query, k=k, filter=flt)
#     else:
#         docs = vectorstore.similarity_search(query, k=k)

#     return "\n\n---\n\n".join([d.page_content for d in docs])


# def retrieve_context(vectorstore, query: str, k: int = 4) -> str:
#     docs = vectorstore.similarity_search(query, k=k)
#     # We gather the best clips as context
#     return "\n\n---\n\n".join([d.page_content for d in docs])
