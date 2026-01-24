from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path

# splitter.py: Splits texts and protects them from duplication with Unique IDs
# It cuts long texts (from PDFs) into small, organized sections

def split_docs(docs, chunk_size=1000, chunk_overlap=150):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""],
    )
    
    chunks = splitter.split_documents(docs)
    
    last_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        # Retrieve the full path from the metadata
        full_path_str = chunk.metadata.get("source_path")
        
        if full_path_str:
            path_obj = Path(full_path_str)
            # take the folder name (Grade_08) and the file name (Math.pdf)
            parent_folder = path_obj.parent.name
            file_name = path_obj.name
            
            # combine them to obtain a unique and clean identifier
            # Result: Grade_8_Math.pdf
            source_id = f"{parent_folder}_{file_name}"
        else:
            source_id = chunk.metadata.get("source_file", "unknown")

        page = chunk.metadata.get("page", 0)
        
        # Create a page ID using the new name
        current_page_id = f"{source_id}_p{page}"

        # Numbering logic for chunk within the same page
        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0
            last_page_id = current_page_id

        chunk.metadata["chunk_index"] = current_chunk_index
        
        # Creating the final ID that will be stored in the database
        # Result: Grade_8_Math.pdf_p12_c2
        chunk.metadata["id"] = f"{current_page_id}_c{current_chunk_index}"

    return chunks

# It cuts long texts (from PDFs) into small, organized sections.cut it into chunks
# def split_docs(docs, chunk_size=1000, chunk_overlap=150):
#     splitter = RecursiveCharacterTextSplitter(
#         chunk_size=chunk_size,
#         chunk_overlap=chunk_overlap,
#         separators=["\n\n", "\n", ".", "!", "?", " ", ""],
#     )
#     return splitter.split_documents(docs)


# Combine the file name, page number, and item number to create a unique ID for each item.
# This will be very helpful in the future if you want to update the data or prevent duplication