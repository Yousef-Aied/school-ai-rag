from typing import Dict, List

memory_store: Dict[str, List[dict]] = {}

def get_conversation(conversation_id: str) -> List[dict]:
    return memory_store.get(conversation_id, [])

def save_message(conversation_id: str, message: dict):
    if conversation_id not in memory_store:
        memory_store[conversation_id] = []
    memory_store[conversation_id].append(message)