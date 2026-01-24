// Chat Window (Messages + input)
import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ conversation, onSend, onGenerateQuiz }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation.messages.length, conversation.id]);

  function submit(e) {
    e.preventDefault();
    onSend(text);
    setText("");
  }

  return (
    <main className="chatMain">
      <header className="chatHeader">
        <div className="chatHeaderTitle">{conversation.title || "New chat"}</div>
      </header>

      <div className="messageList" ref={listRef}>
        {conversation.messages.length === 0 ? (
          <div className="emptyState">
            <h2>Study Explainer</h2>
            <p>Ask anything from your PDFs.</p>
          </div>
        ) : (
          conversation.messages.map((m) => <MessageBubble key={m.id} msg={m} />)
        )}
      </div>

      <form className="composer" onSubmit={submit}>
        <input
          className="composerInput"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask anything…"
        />
        <button className="composerBtn" type="submit">Send</button>

         <button
            className="composerBtn"
            type="button"
            onClick={onGenerateQuiz}
            disabled={!conversation?.messages?.length}
            title={!conversation?.messages?.length ? "Send a message first" : "Generate a quiz"}
          >
            Quiz
          </button>
      </form>
    </main>
  );
}
