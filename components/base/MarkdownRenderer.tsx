import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Markdown rendering component - supports GFM (GitHub Flavored Markdown)
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ 
  content, 
  className,
  style 
}) => {
  return (
    <div 
      className={className}
      style={{
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'rgba(0, 0, 0, 0.85)',
        ...style
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code block rendering
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            
            return !isInline ? (
              <SyntaxHighlighter
                style={oneLight as any}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: '16px 0',
                  borderRadius: '4px',
                  fontSize: '13px'
                } as any}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code 
                className={className} 
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  fontSize: '0.9em',
                  fontFamily: 'monospace'
                }}
              >
                {children}
              </code>
            )
          },
          // Heading rendering
          h1: ({ children }) => (
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 600, 
              marginTop: '24px', 
              marginBottom: '16px',
              borderBottom: '1px solid #e8e8e8',
              paddingBottom: '8px'
            }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              marginTop: '20px', 
              marginBottom: '12px',
              borderBottom: '1px solid #f0f0f0',
              paddingBottom: '6px'
            }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              marginTop: '16px', 
              marginBottom: '8px'
            }}>
              {children}
            </h3>
          ),
          // Paragraph rendering
          p: ({ children }) => (
            <p style={{ 
              marginTop: '0',
              marginBottom: '12px'
            }}>
              {children}
            </p>
          ),
          // List rendering
          ul: ({ children }) => (
            <ul style={{ 
              paddingLeft: '24px',
              marginTop: '8px',
              marginBottom: '12px'
            }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ 
              paddingLeft: '24px',
              marginTop: '8px',
              marginBottom: '12px'
            }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ 
              marginBottom: '4px'
            }}>
              {children}
            </li>
          ),
          // Blockquote rendering
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid #e8e8e8',
              paddingLeft: '16px',
              marginLeft: '0',
              marginRight: '0',
              marginTop: '12px',
              marginBottom: '12px',
              color: 'rgba(0, 0, 0, 0.65)'
            }}>
              {children}
            </blockquote>
          ),
          // Table rendering
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', marginTop: '12px', marginBottom: '12px' }}>
              <table style={{
                borderCollapse: 'collapse',
                width: '100%',
                border: '1px solid #e8e8e8'
              }}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: '#fafafa' }}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th style={{
              padding: '8px 16px',
              textAlign: 'left',
              borderBottom: '2px solid #e8e8e8',
              fontWeight: 600
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '8px 16px',
              borderBottom: '1px solid #e8e8e8'
            }}>
              {children}
            </td>
          ),
          // Link rendering
          a: ({ children, href }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1890ff',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              {children}
            </a>
          ),
          // Divider rendering
          hr: () => (
            <hr style={{
              border: 'none',
              borderTop: '1px solid #e8e8e8',
              marginTop: '20px',
              marginBottom: '20px'
            }} />
          ),
          // Emphasis rendering
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600 }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: 'italic' }}>
              {children}
            </em>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

MarkdownRenderer.displayName = 'MarkdownRenderer'

