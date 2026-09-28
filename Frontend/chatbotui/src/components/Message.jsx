import React from 'react';

const Message = ({ message }) => {
  return (
    <div className={`message ${message.sender}`}>
      <div className="message-content">{message.text}</div>
    </div>
  );
};

export default Message;