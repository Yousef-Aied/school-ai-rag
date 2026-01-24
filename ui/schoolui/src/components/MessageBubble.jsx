// Message Bubble  || markdown
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({ msg }) {
  const cls = msg.role === "user" ? "bubble user" : "bubble assistant";

  return (
    <div className={cls}>
      <div className="bubbleInner">
        {msg.role === "assistant" ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        ) : (
          <div>{msg.content}</div>
        )}

        {msg.pending ? <span className="typing"> typing…</span> : null}
      </div>
    </div>
  );
}
// export default function MessageBubble({ msg }) {
//   const cls = msg.role === "user" ? "bubble user" : "bubble assistant";
//   return (
//     <div className={cls}>
//       <div className="bubbleInner">
//         {msg.content}
//         {msg.pending ? <span className="typing"> typing…</span> : null}
//       </div>
//     </div>
//   );
// }
