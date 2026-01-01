import React from 'react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * Shared Markdown renderer for the application.
 * Handles consistent styling for bold, italic, lists, and paragraphs
 * to match the Daggerheart UI aesthetic.
 */
export function MarkdownText({ children, className }: MarkdownTextProps) {
  return (
    <div className={clsx('markdown-content', className)}>
      <ReactMarkdown
        components={{
          // Paragraphs: allow them to inherit color/size, add spacing
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          
          // Bold: Inherit text color from parent, just add font-weight
          // This allows it to work on both dark (combat cards) and light (domain cards) backgrounds
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          
          // Italic: Standard italic
          em: ({ children }) => <em className="italic">{children}</em>,
          
          // Lists: Add bullets and padding
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          
          // Blockquotes: Style as inset text or flavor text
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-dagger-gold/50 pl-3 py-1 my-2 italic text-gray-400 bg-white/5 rounded-r">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
