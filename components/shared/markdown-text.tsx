import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
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
        remarkPlugins={[remarkBreaks]}
        components={{
          // Headers: Style with proper hierarchy
          h2: ({ children }) => <h2 className="text-lg font-bold text-dagger-gold mt-4 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-white mt-3 mb-1.5 first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-bold text-gray-300 mt-2 mb-1 first:mt-0">{children}</h4>,

          // Paragraphs: allow them to inherit color/size, add spacing
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-snug">{children}</p>,

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
