import React, { useEffect, useRef, useState } from "react";
import Chatboticon from "./components/Chatboticon";
import ChatForm from "./components/ChatForm";
import ChatMessage from "./components/ChatMessage";

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("chatbot-theme") || "light"
  );
  
  const chatBodyRef = useRef();

  const suggestions = [
    { text: "Draft a professional email", icon: "drafts" },
    { text: "Explain quantum computing", icon: "science" },
    { text: "Write a JavaScript function", icon: "code" },
    { text: "Suggest a weekend itinerary", icon: "explore" }
  ];

  const generateBotResponse = async (history) => {
    // Limit request to last 15 messages for fast response times
    const limitedHistory = history.slice(-15);
    const formattedHistory = limitedHistory.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: formattedHistory }),
    };

    try {
      // Use streaming generateContent endpoint
      const streamUrl = import.meta.env.VITE_API_URL.replace(
        "generateContent",
        "streamGenerateContent"
      );

      const response = await fetch(streamUrl, requestOptions);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Something went wrong!");
      }

      // Initialize streams
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";

      // Remove the "Thinking..." indicator and add an empty response message
      setChatHistory(prev => [
        ...prev.filter((msg) => msg.text !== "Thinking..." && !msg.isThinking), 
        { role: "model", text: "", isThinking: false }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse matching braces for JSON objects in stream chunks
        let braceCount = 0;
        let startIndex = -1;

        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === "{") {
            if (braceCount === 0) startIndex = i;
            braceCount++;
          } else if (buffer[i] === "}") {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
              const jsonStr = buffer.slice(startIndex, i + 1);
              try {
                const parsed = JSON.parse(jsonStr);
                const newText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                accumulatedText += newText;

                // Stream response directly to last message in state
                setChatHistory(prev => {
                  const updated = [...prev];
                  const lastMsgIndex = updated.length - 1;
                  if (lastMsgIndex >= 0 && updated[lastMsgIndex].role === "model") {
                    updated[lastMsgIndex] = { ...updated[lastMsgIndex], text: accumulatedText };
                  }
                  return updated;
                });
              } catch (err) {
                console.error("JSON parse error inside stream", err);
              }
              buffer = buffer.slice(i + 1);
              i = -1;
              startIndex = -1;
            }
          }
        }
      }
    } catch (error) {
      setChatHistory(prev => [
        ...prev.filter((msg) => msg.text !== "Thinking..." && !msg.isThinking),
        { role: "model", text: error.message, isError: true }
      ]);
    }
  };

  const handleSuggestionClick = (text) => {
    // Add user message and the thinking state instantly without delays
    const updatedHistory = [...chatHistory, { role: "user", text }];
    setChatHistory([
      ...updatedHistory,
      { role: "model", text: "Thinking...", isThinking: true }
    ]);
    generateBotResponse(updatedHistory);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("chatbot-theme", newTheme);
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  useEffect(() => {
    // Auto-scroll whenever chat history updates
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? "show-chatbot" : ""} ${theme === "dark" ? "dark-mode" : ""}`}>
      {/* Toggler button */}
      <button onClick={() => setShowChatbot(prev => !prev)} id="chatbot-toggler">
        <span className="material-symbols-rounded">mode_comment</span>
        <span className="material-symbols-rounded">close</span>
      </button>

      <div className="chatbot-popup">
        {/* Chatbot header */}
        <div className="chatbot-header">
          <div className="header-info">
            <Chatboticon />
            <h2 className="logo-text">Chatbot</h2>
          </div>
          <div className="header-controls">
            <button 
              onClick={toggleTheme} 
              className="material-symbols-rounded"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? "dark_mode" : "light_mode"}
            </button>
            <button 
              onClick={clearChat} 
              className="material-symbols-rounded"
              title="Clear Conversation"
            >
              delete
            </button>
            <button 
              onClick={() => setShowChatbot(false)} 
              className="material-symbols-rounded"
              title="Minimize Chat"
            >
              keyboard_arrow_down
            </button>
          </div>
        </div>

        {/* Chatbot Body */}
        <div ref={chatBodyRef} className="chat-body">
          {chatHistory.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-icon">
                <Chatboticon />
              </div>
              <h3>How can I help you today?</h3>
              <p className="welcome-subtitle">Ask a question or select a suggestion below to get started.</p>
              <div className="suggestions-grid">
                {suggestions.map((suggestion, index) => (
                  <button 
                    key={index} 
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="suggestion-card"
                  >
                    <span className="material-symbols-rounded suggestion-icon">
                      {suggestion.icon}
                    </span>
                    <span className="suggestion-text">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="message bot-message">
                <Chatboticon />
                <p className="message-text">
                  Hey there 👋 <br /> How can I help you today?
                </p>
              </div>

              {/* Render the chat history Dynamically */}
              {chatHistory.map((chat, index) => (
                <ChatMessage key={index} chat={chat} />
              ))}
            </>
          )}
        </div>

        {/* Chatbot Footer */}
        <div className="chat-footer">
          <ChatForm
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            generateBotResponse={generateBotResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
