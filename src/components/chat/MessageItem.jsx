export default function MessageItem({ message }) {
  const isUser = message.sender_type === "real_user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow
          ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-200 text-gray-900 rounded-bl-sm"
          }
        `}
      >
        {/* Image message */}
        {message.content_type === "image" ? (
          <img
            src={message.content}
            alt="sent"
            className="rounded-xl max-w-full"
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        <div className="text-[10px] opacity-60 mt-1 text-right">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
