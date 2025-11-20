import React from 'react'
import { Card, Typography, Space, Descriptions, Tag, Button, message } from 'antd'
import { FileOutlined, DownloadOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { LazySyntaxHighlighter } from '../../base/LazySyntaxHighlighter'
import type { StreamCallbackMessage } from '../../../types'

const { Text } = Typography

interface FileRendererProps {
  content: StreamCallbackMessage & {
    type: 'file'
    mimeType: string
    data: string
  }
}

/**
 * file message renderer - renders file data messages
 */
export const FileRenderer: React.FC<FileRendererProps> = React.memo(({
  content
}) => {
  const { mimeType, data, nodeId } = content
  const [copied, setCopied] = React.useState(false)

  // Determine file type
  const fileCategory = React.useMemo(() => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('text/')) return 'text'
    if (mimeType.includes('json')) return 'json'
    if (mimeType.includes('javascript') || mimeType.includes('typescript')) return 'code'
    return 'binary'
  }, [mimeType])

  // File size estimation (base64)
  const fileSize = React.useMemo(() => {
    const bytes = data.length * 0.75 // base64 解码后大小
    if (bytes < 1024) return `${bytes.toFixed(0)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }, [data])

  // Handle download
  const handleDownload = () => {
    try {
      const blob = new Blob([atob(data)], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `file-${Date.now()}.${mimeType.split('/')[1] || 'bin'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('File downloaded')
    } catch (error) {
      message.error('Failed to download file')
    }
  }

  // Copy data
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data)
      setCopied(true)
      message.success('Data copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      message.error('Failed to copy data')
    }
  }

  // Render preview
  const renderPreview = () => {
    if (fileCategory === 'image') {
      return (
        <div style={{ marginTop: '12px' }}>
          <Text strong style={{ marginBottom: '8px', display: 'block' }}>Preview:</Text>
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            border: '1px solid #e8e8e8',
            textAlign: 'center'
          }}>
            <img 
              src={`data:${mimeType};base64,${data}`} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '400px',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )
    }

    if (fileCategory === 'text' || fileCategory === 'json' || fileCategory === 'code') {
      try {
        const text = atob(data)
        const language = fileCategory === 'json' ? 'json' : 
                        fileCategory === 'code' ? 'javascript' : 'text'
        
        return (
          <div style={{ marginTop: '12px' }}>
            <Text strong style={{ marginBottom: '8px', display: 'block' }}>Content:</Text>
            <div style={{
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #e8e8e8'
            }}>
              <LazySyntaxHighlighter
                language={language}
                shouldRender={true}
              >
                {text.length > 5000 ? text.substring(0, 5000) + '\n... (truncated)' : text}
              </LazySyntaxHighlighter>
            </div>
          </div>
        )
      } catch (error) {
        return (
          <Text type="secondary" italic style={{ marginTop: '12px', display: 'block' }}>
            Unable to decode text content
          </Text>
        )
      }
    }

    return (
      <Text type="secondary" italic style={{ marginTop: '12px', display: 'block' }}>
        Binary file - preview not available
      </Text>
    )
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <FileOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
          <Text strong>File Data</Text>
          <Tag color="purple">{fileCategory}</Tag>
        </Space>
      }
      style={{
        backgroundColor: '#f9f0ff',
        borderColor: '#d3adf7'
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* File info */}
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={<Text strong>MIME Type</Text>}>
            <Tag color="purple">{mimeType}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label={<Text strong>File Size</Text>}>
            <Text>{fileSize}</Text>
          </Descriptions.Item>

          {nodeId && (
            <Descriptions.Item label={<Text strong>Node ID</Text>}>
              <Text code style={{ fontSize: '12px' }}>
                {nodeId}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Action buttons */}
        <Space>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
            size="small"
          >
            Download
          </Button>
          <Button 
            icon={copied ? <CheckOutlined /> : <CopyOutlined />} 
            onClick={handleCopy}
            size="small"
          >
            {copied ? 'Copied' : 'Copy Data'}
          </Button>
        </Space>

        {/* Preview */}
        {renderPreview()}
      </Space>
    </Card>
  )
})

FileRenderer.displayName = 'FileRenderer'

