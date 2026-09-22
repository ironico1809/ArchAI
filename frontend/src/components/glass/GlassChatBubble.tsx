import React from 'react';

interface GlassChatBubbleProps {
  isUser: boolean;
  userIcon?: React.ReactNode;
  aiIcon?: React.ReactNode;
  timestamp?: string;
  children: React.ReactNode;
}

export const GlassChatBubble: React.FC<GlassChatBubbleProps> = ({
  isUser,
  userIcon,
  aiIcon,
  timestamp,
  children
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '10px',
        width: '100%'
      }}
    >
      <div
        className={isUser ? 'glass-chat-bubble-user' : 'glass-chat-bubble-ai'}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}
      >
        <div style={{ marginTop: '2px', flexShrink: 0 }}>
          {isUser ? userIcon : aiIcon}
        </div>
        <div style={{ flex: 1, fontSize: '0.86rem', lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
      {timestamp && (
        <span
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-subtle)',
            marginTop: '3px',
            paddingLeft: isUser ? '0' : '10px',
            paddingRight: isUser ? '10px' : '0',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {timestamp}
        </span>
      )}
    </div>
  );
};
