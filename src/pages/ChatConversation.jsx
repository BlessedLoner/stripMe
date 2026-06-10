// import { useParams } from "react-router-dom";
// import { useMessages } from "../hooks/useMessage";
// import { supabase } from "../lib/supabaseClient";

// import { useState } from "react";

// export default function ChatConversation() {
//   const { conversationId } = useParams();
//   const { messages, loading } = useMessages(conversationId);
//   const [message, setMessage] = useState("");

//   async function send() {
//     if (!message.trim()) return;

//     const { error } = await supabase.rpc("send_user_message", {
//       p_conversation_id: conversationId,
//       p_content: message,
//     });

//     if (!error) {
//       console.error("RPC error:", error);
//     }

//     setMessage("");
//   }

//   if (loading) return <p>Loading...</p>;

//   if (!conversationId) {
//     console.error("conversationId missing");
//     return;
//   }

//   return (
//     <div style={{ padding: 100 }}>
//       <div>
//         {messages.map((m) => (
//           <div key={m.id}>
//             <strong>{m.sender_type}:</strong> {m.content}
//           </div>
//         ))}
//       </div>

//       <input
//         value={message}
//         onChange={(e) => setMessage(e.target.value)}
//         placeholder="Type..."
//       />
//       <button onClick={send}>Send</button>
//     </div>
//   );
// }
