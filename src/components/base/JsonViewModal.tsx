import React from 'react';
import { Modal } from 'antd';
import { ChatMessage } from '../../store/chatStore';
import { LazySyntaxHighlighter } from './LazySyntaxHighlighter';

interface JsonViewModalProps {
  open: boolean
  message: ChatMessage | null
  onClose: () => void
}

export const JsonViewModal: React.FC<JsonViewModalProps> = ({ open, message, onClose }) => {
  return (
    <Modal
      title="message JSON"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {message && (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <LazySyntaxHighlighter
            language="json"
            shouldRender={open}
          >
            {JSON.stringify(message.content, null, 2)}
          </LazySyntaxHighlighter>
        </div>
      )}
    </Modal>
  );
};
