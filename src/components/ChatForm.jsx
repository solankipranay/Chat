import React, { useRef } from 'react';

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {

  const inputRef = useRef();

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;

    inputRef.current.value = '';

    // Instantly append user message and thinking indicator (0ms delay)
    const updatedHistory = [...chatHistory, { role: "user", text: userMessage }];
    setChatHistory([
      ...updatedHistory,
      { role: "model", text: "Thinking...", isThinking: true }
    ]);

    // Send query to the bot immediately
    generateBotResponse(updatedHistory);
  };

  return (
    <form className="chat-form" onSubmit={handleFormSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder="message..."
        className="message-input"
        required
      />
      <button className="material-symbols-rounded">
        arrow_upward
      </button>
    </form>
  );
};

export default ChatForm;