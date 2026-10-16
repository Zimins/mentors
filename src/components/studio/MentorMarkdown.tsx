'use client';

import React from 'react';

interface MentorMarkdownProps {
  content: string;
  accentColor?: string;
  className?: string;
}

/**
 * Parses inline markdown tokens:
 * - `code`
 * - ***bold italic***
 * - **bold**
 * - *italic*
 * - [label](url)
 */
function renderInlineMarkdown(
  text: string,
  accentColor = '#38bdf8',
  keyPrefix = 'inl'
): React.ReactNode[] {
  if (!text) return [];

  const tokenRegex =
    /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]]+\]\([^)]+\))/g;

  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const code = part.slice(1, -1);
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-950/90 border border-white/15 font-mono text-[0.88em] text-sky-300"
        >
          {code}
        </code>
      );
    }

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      return (
        <strong key={key} className="font-extrabold italic text-white">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={key}
          className="font-extrabold text-white"
          style={{
            textShadow: `0 0 18px ${accentColor}25`,
          }}
        >
          {renderInlineMarkdown(inner, accentColor, `${key}-b`)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={key} className="italic text-slate-100">
          {renderInlineMarkdown(inner, accentColor, `${key}-i`)}
        </em>
      );
    }

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 font-semibold text-sky-300 hover:text-sky-200 transition"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export default function MentorMarkdown({
  content,
  accentColor = '#38bdf8',
  className = '',
}: MentorMarkdownProps) {
  if (!content) return null;

  // Split by fenced code blocks first: ```lang ... ```
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2.5 leading-relaxed ${className}`}>
      {segments.map((segment, segIdx) => {
        if (!segment.trim()) return null;

        // Render fenced code block
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const lines = segment.slice(3, -3).split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : '';
          const codeBody = (hasLang ? lines.slice(1) : lines).join('\n').trim();

          return (
            <div
              key={`code-${segIdx}`}
              className="my-2 rounded-xl overflow-hidden bg-slate-950/95 border border-white/10 shadow-inner"
            >
              {lang && (
                <div className="px-3 py-1 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {lang}
                  </span>
                </div>
              )}
              <pre className="p-3 text-xs font-mono text-sky-200 overflow-x-auto leading-relaxed">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Process non-code markdown blocks
        const rawLines = segment.replace(/\r\n/g, '\n').split('\n');
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < rawLines.length) {
          const line = rawLines[i];
          const trimmed = line.trim();

          if (!trimmed) {
            i++;
            continue;
          }

          // Horizontal rule
          if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            elements.push(
              <hr
                key={`hr-${segIdx}-${i}`}
                className="border-white/10 my-2"
              />
            );
            i++;
            continue;
          }

          // Headings (#, ##, ###, ####)
          const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const sizeClass =
              level === 1
                ? 'text-base sm:text-lg font-black text-white mt-1'
                : level === 2
                  ? 'text-sm sm:text-base font-extrabold text-white mt-1'
                  : 'text-xs sm:text-sm font-bold text-slate-100 mt-0.5';
            elements.push(
              <div key={`h-${segIdx}-${i}`} className={sizeClass}>
                {renderInlineMarkdown(
                  headingText,
                  accentColor,
                  `h-${segIdx}-${i}`
                )}
              </div>
            );
            i++;
            continue;
          }

          // Blockquote (> ...)
          if (trimmed.startsWith('>')) {
            const quoteLines: string[] = [];
            while (
              i < rawLines.length &&
              rawLines[i].trim().startsWith('>')
            ) {
              quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
              i++;
            }
            elements.push(
              <blockquote
                key={`q-${segIdx}-${i}`}
                className="pl-3 py-1 border-l-2 text-slate-300 italic bg-white/[0.02] rounded-r-lg"
                style={{ borderColor: accentColor }}
              >
                {quoteLines.map((qLine, qIdx) => (
                  <p key={qIdx}>
                    {renderInlineMarkdown(
                      qLine,
                      accentColor,
                      `q-${segIdx}-${i}-${qIdx}`
                    )}
                  </p>
                ))}
              </blockquote>
            );
            continue;
          }

          // Unordered list (- , * , • )
          if (/^([-*•])\s+/.test(trimmed)) {
            const items: string[] = [];
            while (
              i < rawLines.length &&
              /^([-*•])\s+/.test(rawLines[i].trim())
            ) {
              items.push(rawLines[i].trim().replace(/^([-*•])\s+/, ''));
              i++;
            }
            elements.push(
              <ul
                key={`ul-${segIdx}-${i}`}
                className="space-y-1.5 pl-4 list-disc marker:text-sky-400"
              >
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-200 leading-relaxed">
                    {renderInlineMarkdown(
                      item,
                      accentColor,
                      `ul-${segIdx}-${i}-${itemIdx}`
                    )}
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          // Ordered list (1. , 2. )
          if (/^\d+\.\s+/.test(trimmed)) {
            const items: string[] = [];
            while (
              i < rawLines.length &&
              /^\d+\.\s+/.test(rawLines[i].trim())
            ) {
              items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
              i++;
            }
            elements.push(
              <ol
                key={`ol-${segIdx}-${i}`}
                className="space-y-1.5 pl-4 list-decimal marker:text-sky-400 marker:font-bold"
              >
                {items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-slate-200 leading-relaxed">
                    {renderInlineMarkdown(
                      item,
                      accentColor,
                      `ol-${segIdx}-${i}-${itemIdx}`
                    )}
                  </li>
                ))}
              </ol>
            );
            continue;
          }

          // Regular paragraph (group consecutive non-empty normal lines)
          const paraLines: string[] = [];
          while (
            i < rawLines.length &&
            rawLines[i].trim() !== '' &&
            !/^(#{1,4}\s+|[-*•]\s+|\d+\.\s+|>\s*|(-{3,}|\*{3,}|_{3,})$)/.test(
              rawLines[i].trim()
            )
          ) {
            paraLines.push(rawLines[i]);
            i++;
          }

          elements.push(
            <p key={`p-${segIdx}-${i}`} className="text-slate-200 leading-relaxed">
              {paraLines.map((pLine, pIdx) => (
                <React.Fragment key={pIdx}>
                  {pIdx > 0 && <br />}
                  {renderInlineMarkdown(
                    pLine,
                    accentColor,
                    `p-${segIdx}-${i}-${pIdx}`
                  )}
                </React.Fragment>
              ))}
            </p>
          );
        }

        return <React.Fragment key={`seg-${segIdx}`}>{elements}</React.Fragment>;
      })}
    </div>
  );
}
