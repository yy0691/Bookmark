// components/ui/Dialog.js
import * as Dialog from '@radix-ui/react-dialog';
import './Dialog.css';

export const Dialog = ({ 
  open, 
  onOpenChange, 
  children, 
  title,
  className = '' 
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-dialog-overlay" />
        <Dialog.Content className={`ui-dialog-content ${className}`}>
          {title && (
            <Dialog.Title className="ui-dialog-title">
              {title}
            </Dialog.Title>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};