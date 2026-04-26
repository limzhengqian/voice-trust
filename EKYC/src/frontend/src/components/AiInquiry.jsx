import { useState, useRef, useEffect } from 'react';
import { getInquiryResponse } from '../utils/inquiryResponses';

const SUGGESTIONS = [
  "I don't have a bank statement",
  "Can I use a utility bill?",
  "Can I upload a PDF?",
  "How old can the document be?",
];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-MY';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function AiInquiry() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I can help answer questions about your proof of address document. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    const q = text.trim();
    if (!q) return;
    const answer = getInquiryResponse(q);
    setMessages(prev => [
      ...prev,
      { role: 'user', text: q },
      { role: 'assistant', text: answer },
    ]);
    setInput('');
    speak(answer);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage(input);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-3 max-h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2 text-sm leading-relaxed
                ${m.role === 'user'
                  ? 'bg-brand text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'}`}
            >
              {m.role === 'assistant' && (
                <span className="text-xs font-bold text-brand/70 block mb-1">AI Assistant</span>
              )}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="text-xs bg-brand/10 text-brand font-medium px-3 py-1.5 rounded-full hover:bg-brand/20 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="bg-brand text-white rounded-xl px-4 py-2 font-bold text-sm disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
