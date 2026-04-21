import React, { useState } from 'react';

interface AppleEmojiProps {
  emoji?: string | null;
  className?: string;
}

export const AppleEmoji: React.FC<AppleEmojiProps> = ({ emoji, className = '' }) => {
  const [error, setError] = useState(false);

  if (!emoji) return null;

  // Convert emoji to hex code points like '1f355'
  const getEmojiUrl = () => {
    try {
      const chars = Array.from(emoji);
      const hexes = chars
        .map(c => c.codePointAt(0)?.toString(16))
        .filter(h => h && h !== 'fe0f'); // remove variation selectors
      const code = hexes.join('-');
      // Uses a high CDN (15.0.0 handles latest emojis)
      return `https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/15.0.0/img/apple/64/${code}.png`;
    } catch {
      return '';
    }
  };

  const url = getEmojiUrl();

  // If error occurs or no URL is parsed, fallback to native emoji text
  if (error || !url) {
    return <span className={className}>{emoji}</span>;
  }

  return (
    <img 
      src={url}
      alt={emoji}
      className={`inline-block object-contain w-[1.25em] h-[1.25em] leading-none align-text-bottom ${className}`}
      onError={() => setError(true)}
      draggable={false}
      style={{ verticalAlign: '-0.15em' }}
    />
  );
};
