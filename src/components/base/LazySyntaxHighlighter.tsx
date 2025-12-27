import React from 'react';
import { Button, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LazySyntaxHighlighterProps {
  language: string
  children: string
  shouldRender: boolean
}

/**
 * Lazy loaded syntax highlighting component - renders only when expanded
 */
export const LazySyntaxHighlighter: React.FC<LazySyntaxHighlighterProps> = React.memo(
  ({ language, children, shouldRender }) => {
    const [copied, setCopied] = React.useState(false);

    if (!shouldRender) {
      return null;
    }

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        message.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
      catch (err) {
        message.error('Failed to copy');
      }
    };

    return (
      <div style={{ position: 'relative' }}>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px',
            zIndex: 1,
            opacity: 0.6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
          }}
        />
        <SyntaxHighlighter
          language={language}
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: '8px',
            paddingRight: '40px',
            fontSize: '12px',
            borderRadius: '4px',
          }}
          showLineNumbers={false}
          wrapLines={true}
          wrapLongLines={true}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    );
  },
);

LazySyntaxHighlighter.displayName = 'LazySyntaxHighlighter';
