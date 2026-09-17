"use client";

import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      // marked parses synchronous markdown string to HTML
      return marked.parse(content, {
        breaks: true,
        gfm: true,
      }) as string;
    } catch (e) {
      console.warn('Markdown parse error:', e);
      return content.replace(/\n/g, '<br/>');
    }
  }, [content]);

  return (
    <div
      className={`markdown-body-custom ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
