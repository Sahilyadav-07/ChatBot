import React, { useState } from 'react';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import '../App.css'; // We'll import all styles here for simplicity

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'bot1',
      text: 'Hello! How can I help you today?',
      sender: 'bot',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // toggles to control behavior for testing
  const [useBackend, setUseBackend] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  // conversation id persisted per browser (so multiple sends use same conversation)
  const [conversationId, setConversationId] = useState(() => {
    try {
      const existing = localStorage.getItem('conversation_id');
      if (existing) return existing;
    } catch (err) { void err; }
    const id = Date.now().toString();
    try { localStorage.setItem('conversation_id', id); } catch (err) { void err; }
    return id;
  });

  const resetConversationId = () => {
    const id = Date.now().toString();
    setConversationId(id);
    try { localStorage.setItem('conversation_id', id); } catch (err) { void err; }
    // clear server-side conversation state is backend-specific; this only starts a new local conversation id
  };

  async function callBackend(userMessage) {
    if (simulateError) throw new Error('Simulated backend error');
    const res = await fetch('/chat/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, conversation_id: conversationId }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    // support responses like { response: '...' } or plain string
    if (!data) return null;
    return data.response || data;
  }

  const handleSendMessage = async (userMessage) => {
    // Add user message to the chat
    const newMessage = {
      id: `user-${Date.now()}`,
      text: userMessage,
      sender: 'user',
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Show typing indicator
    setIsTyping(true);

    if (useBackend) {
      try {
        const backendReply = await callBackend(userMessage);
        // If backend returned a reply, show it; otherwise fall back to rule-based
        if (backendReply) {
          const botResponse = { id: `bot-${Date.now()}`, text: String(backendReply), sender: 'bot' };
          setMessages((prev) => [...prev, botResponse]);
        } else {
          // fallback to local rule-based
          await new Promise((resolve) => setTimeout(resolve, 900));
          const botResponse = { id: `bot-${Date.now()}`, text: getBotResponse(userMessage), sender: 'bot' };
          setMessages((prev) => [...prev, botResponse]);
        }
      } catch (err) {
        void err;
        // show a clear error message and then a fallback reply
        const errMsg = { id: `err-${Date.now()}`, text: 'Error contacting backend. Showing fallback reply.', sender: 'bot' };
        setMessages((prev) => [...prev, errMsg]);
        // short pause so the error message appears before fallback
        await new Promise((resolve) => setTimeout(resolve, 600));
        const botResponse = { id: `bot-${Date.now()}`, text: getBotResponse(userMessage), sender: 'bot' };
        setMessages((prev) => [...prev, botResponse]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // local/resident simulated response
      await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate network delay
      const botResponse = { id: `bot-${Date.now()}`, text: getBotResponse(userMessage), sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
      setIsTyping(false);
    }
  };

  // A simple rule-based response generator
  const getBotResponse = (userInput) => {
    const input = String(userInput).toLowerCase();
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hi there! How can I assist you?';
    } else if (input.includes('help')) {
      return 'Sure, I am here to help. What do you need?';
    } else if (input.includes('bye')) {
      return 'Goodbye! Have a great day!';
    } else {
      return "That's interesting. Tell me more.";
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">React Chatbot</div>

      <div className="chat-controls" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 12px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={useBackend} onChange={(e) => setUseBackend(e.target.checked)} /> Use backend
        </label>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={simulateError} onChange={(e) => setSimulateError(e.target.checked)} /> Simulate error
        </label>
        <button onClick={resetConversationId} style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8 }}>New conversation</button>
        <div style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>ID: {conversationId}</div>
        <div style={{ width: '100%', fontSize: 12, color: '#666' }}>Tip: enable "Use backend" and toggle "Simulate error" to test error flows.</div>
      </div>

      <MessageList messages={messages} isTyping={isTyping} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chatbot;