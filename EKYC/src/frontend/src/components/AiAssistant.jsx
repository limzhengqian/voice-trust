import { useState, useRef, useEffect } from 'react';
import { getInquiryResponse } from '../utils/inquiryResponses';

const STEP_SUGGESTIONS = {
  0: ["How do I enter my name?", "Can I use voice input?"],
  1: ["I didn't receive my OTP", "Wrong phone number?", "OTP expired?"],
  2: ["IC photo is blurry", "IC number not detected", "Can I upload from gallery?"],
  3: ["Why was my file rejected?", "What documents are accepted?", "I don't have a bank statement", "Can I upload a PDF?"],
  4: ["What happens after I submit?", "How long does approval take?", "Is my data safe?"],
};

const DEFAULT_SUGGESTIONS = ["How long does this take?", "Is my data safe?", "Contact support"];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-MY';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function AiAssistant({ currentStep, context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your account opening assistant. Ask me anything or tap a suggestion below." }
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const injectedContextRef = useRef(null);
  const spokenUpToRef = useRef(0); // index of last spoken message + 1

  const suggestions = STEP_SUGGESTIONS[currentStep] ?? DEFAULT_SUGGESTIONS;
  const hasError = !!(context?.wrongFileType || context?.wrongDocContent);

  // Inject contextual message when context changes
  useEffect(() => {
    const contextKey = context?.wrongFileType
      ? `wrongFileType:${context.wrongFileType}`
      : context?.wrongDocContent
        ? 'wrongDocContent'
        : null;

    if (!contextKey) { injectedContextRef.current = null; return; }
    if (injectedContextRef.current === contextKey) return;
    injectedContextRef.current = contextKey;

    let msg;
    if (context?.wrongFileType) {
      msg = `I noticed your ${context.wrongFileType} file was not accepted. We only support JPG, PNG, and PDF files for proof of address. You can download a PDF e-statement from your bank app, or take a photo of your bill as a JPG.`;
    } else {
      msg = "I noticed the document you uploaded doesn't appear to contain any readable text. It looks like it might be a regular photo instead of a document. Please upload a bank statement, utility bill, or similar document that clearly shows your name and address.";
    }

    setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
    if (open) speak(msg);
  }, [context?.wrongFileType, context?.wrongDocContent, open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    // Read any unread assistant messages aloud when panel opens
    const unread = messages
      .slice(spokenUpToRef.current)
      .filter(m => m.role === 'assistant');
    if (unread.length > 0) {
      speak(unread.map(m => m.text).join(' '));
    }
    spokenUpToRef.current = messages.length;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = (text) => {
    const q = text.trim();
    if (!q) return;
    const answer = getInquiryResponse(q);
    setMessages(prev => {
      const next = [...prev, { role: 'user', text: q }, { role: 'assistant', text: answer }];
      spokenUpToRef.current = next.length; // mark as spoken immediately
      return next;
    });
    setInput('');
    speak(answer);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-MY';
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    r.onerror = () => setListening(false);
    recognitionRef.current = r;
    r.start();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-20 right-4 z-50 w-14 h-14 bg-brand text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform ${hasError ? 'animate-bounce' : ''}`}
          aria-label="Open AI assistant"
        >
          💬
          {hasError && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand text-white shadow">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div className="flex-1">
              <p className="font-bold text-sm">AI Assistant</p>
              <p className="text-xs text-white/80">Ask anything about account opening</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/20 text-xl font-bold"
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-1">🤖</div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                    ${m.role === 'user'
                      ? 'bg-brand text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'}`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-100 bg-white">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs bg-brand/10 text-brand font-medium px-3 py-1.5 rounded-full hover:bg-brand/20 transition-colors whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex gap-2 border-t border-gray-100 bg-white">
            <button
              onClick={startListening}
              disabled={listening}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-colors flex-shrink-0
                ${listening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
              aria-label="Speak your question"
            >
              🎤
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening...' : 'Type your question...'}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-11 h-11 bg-brand text-white rounded-xl flex items-center justify-center font-bold text-lg disabled:opacity-40 flex-shrink-0"
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
