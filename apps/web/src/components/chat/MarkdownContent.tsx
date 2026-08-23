import { useMemo, useState } from 'react';

interface MarkdownContentProps { content: string; }

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] ?? character));
}

function highlightCode(code: string): string {
  return escapeHtml(code)
    .replace(/(\/\/.*|#.*)$/gm, '<span class="code-comment">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|from|export|async|await|new|true|false|null|undefined)\b/g, '<span class="code-keyword">$1</span>')
    .replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, '<span class="code-string">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="code-number">$1</span>');
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = useMemo(() => {
    const parts: Array<{ type: 'text' | 'code'; value: string; language?: string }> = [];
    const pattern = /```([\w+-]*)\n?([\s\S]*?)```/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match.index > last) parts.push({ type: 'text', value: content.slice(last, match.index) });
      parts.push({ type: 'code', language: match[1] || 'text', value: match[2].replace(/\n$/, '') });
      last = match.index + match[0].length;
    }
    if (last < content.length) parts.push({ type: 'text', value: content.slice(last) });
    return parts;
  }, [content]);

  return <div className="markdown-content">
    {blocks.map((block, index) => block.type === 'code'
      ? <CodeBlock key={`${index}-${block.language}`} code={block.value} language={block.language!} />
      : <TextBlock key={index} text={block.value} />)}
  </div>;
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  return <>
    {lines.map((line, index) => {
      const trimmed = line.trim();
      const key = `${index}-${line}`;
      if (!trimmed) return <div key={key} className="markdown-spacer" />;
      const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
      if (heading) {
        const Tag = `h${heading[1].length}` as 'h1' | 'h2' | 'h3';
        return <Tag key={key} dangerouslySetInnerHTML={{ __html: inlineMarkdown(heading[2]) }} />;
      }
      const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
      if (bullet) return <div key={key} className="markdown-list-item"><span>•</span><span dangerouslySetInnerHTML={{ __html: inlineMarkdown(bullet[1]) }} /></div>;
      const ordered = /^(\d+)\.\s+(.+)$/.exec(trimmed);
      if (ordered) return <div key={key} className="markdown-list-item"><span>{ordered[1]}.</span><span dangerouslySetInnerHTML={{ __html: inlineMarkdown(ordered[2]) }} /></div>;
      return <p key={key} dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />;
    })}
  </>;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return <div className="markdown-code-block">
    <div className="code-header"><span>{language}</span><button type="button" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button></div>
    <pre><code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} /></pre>
  </div>;
}
