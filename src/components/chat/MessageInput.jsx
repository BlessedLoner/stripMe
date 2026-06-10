import { useState } from "react";
import EmojiPicker from "emoji-picker-react";

export default function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  function handleEmojiClick(emojiData) {
    setText((prev) => prev + emojiData.emoji);
  }

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend({ type: "text", content: text });
    setText("");
  }

  return (
    <div className="border-t bg-white p-3 relative">
      {showEmoji && (
        <div className="absolute bottom-14 left-3 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="text-xl"
        >
          😊
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-4 py-2 rounded-full border focus:outline-none"
        />

        <button type="submit" className="text-blue-600 font-semibold">
          Send
        </button>
      </form>
    </div>
  );
}
