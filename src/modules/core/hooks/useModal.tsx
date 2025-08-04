import { useCallback } from 'react';
import { useModal as useModalContext } from './useModalContext';
import { Modal } from '../components/Modal';
import { ReactNode } from 'react';

interface UseModalOptions {
  size?: 'small' | 'medium' | 'large' | 'full';
  dismissible?: boolean;
  showHeader?: boolean;
  className?: string;
}

interface UseModalReturn {
  openModal: (
    content: ReactNode,
    options?: UseModalOptions & { title?: string }
  ) => void;
  closeModal: () => void;
  isOpen: boolean;
}

export function useModal(id: string): UseModalReturn {
  const {
    openModal: openModalContext,
    closeModal: closeModalContext,
    isModalOpen,
  } = useModalContext();

  const openModal = useCallback(
    (
      content: ReactNode,
      options: UseModalOptions & { title?: string } = {}
    ) => {
      const {
        title,
        size = 'medium',
        dismissible = true,
        showHeader = true,
        className = '',
      } = options;

      const modalComponent = (
        <Modal
          isOpen={true}
          onClose={() => closeModalContext(id)}
          title={title}
          size={size}
          dismissible={dismissible}
          showHeader={showHeader}
          className={className}
        >
          {content}
        </Modal>
      );

      openModalContext(id, modalComponent);
    },
    [id, openModalContext, closeModalContext]
  );

  const closeModal = useCallback(() => {
    closeModalContext(id);
  }, [id, closeModalContext]);

  const isOpen = isModalOpen(id);

  return {
    openModal,
    closeModal,
    isOpen,
  };
}
