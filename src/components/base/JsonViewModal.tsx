import React from 'react';
import { ChatMessage } from '../../store/chatStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CodeBlock } from '@/components/ai-elements/code-block';

interface JsonViewModalProps {
  open: boolean
  message: ChatMessage | null
  onClose: () => void
}

export const JsonViewModal: React.FC<JsonViewModalProps> = ({ open, message, onClose }) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>message JSON</DialogTitle>
        </DialogHeader>
        {message && (
          <div className="max-h-[60vh] overflow-auto">
            <CodeBlock
              code={JSON.stringify(message.content, null, 2)}
              language="json"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
