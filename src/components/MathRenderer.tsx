import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math expressions.
 * Supports both inline ($...$) and display ($$...$$) math.
 */
export function MathRenderer({ content, className }: MathRendererProps) {
  const html = useMemo(() => renderMath(content), [content]);
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMath(text: string): string {
  // Split on display math ($$...$$) first, then inline math ($...$)
  const parts = text.split(/((?:\$\$[\s\S]+?\$\$)|(?:\$[^$\n]+?\$))/g);
  return parts
    .map((part) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2);
        try {
          return katex.renderToString(latex, { displayMode: true, throwOnError: false });
        } catch {
          return escapeHtml(part);
        }
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const latex = part.slice(1, -1);
        try {
          return katex.renderToString(latex, { displayMode: false, throwOnError: false });
        } catch {
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
