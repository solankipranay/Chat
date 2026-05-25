import React from 'react';
import Chatboticon from './Chatboticon';

const parseMarkdown = (text) => {
  if (!text) return "";
  
  // Safe escape HTML characters
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Code blocks: ```language code ```
  escaped = escaped.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g, (match, p1) => {
    return `<pre><code>${p1}</code></pre>`;
  });

  // 2. Inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 3. Bold text: **text** or __text__
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // 4. Bullet lists: lines starting with * or - followed by space
  const lines = escaped.split("\n");
  let inList = false;
  const processedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!inList) {
        processedLines.push("<ul>");
        inList = true;
      }
      processedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push("</ul>");
        inList = false;
      }
      processedLines.push(line);
    }
  }
  if (inList) {
    processedLines.push("</ul>");
  }

  return processedLines.join("\n").replace(/\n/g, "<br />");
};

const ChatMessage = ({ chat }) => {
  return (
    <div className={`message ${chat.role === "model" ? 'bot' : 'user'}-message ${chat.isError ? "error" : ""}`}>
      {chat.role === "model" && <Chatboticon />}
      
      {chat.isThinking ? (
        <div className="message-text">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      ) : (
        <p 
          className="message-text" 
          dangerouslySetInnerHTML={{ __html: parseMarkdown(chat.text) }}
        />
      )}
    </div>
  );
};

export default ChatMessage;