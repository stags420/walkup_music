import { useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { ModalContext, ModalContextType } from '../contexts/ModalContext';

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modals, setModals] = useState<Map<string, ReactNode>>(new Map());
  const scrollPositionRef = useRef(0);
  const originalBodyStyleRef = useRef<{
    overflow: string;
    position: string;
    top: string;
    width: string;
  } | null>(null);

  const openModal = useCallback((id: string, component: ReactNode) => {
    setModals((prev) => {
      const newModals = new Map(prev);

      // If this is the first modal, store scroll position and prevent body scroll
      if (newModals.size === 0) {
        scrollPositionRef.current = window.scrollY;

        // Store original body styles
        originalBodyStyleRef.current = {
          overflow: document.body.style.overflow,
          position: document.body.style.position,
          top: document.body.style.top,
          width: document.body.style.width,
        };

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPositionRef.current}px`;
        document.body.style.width = '100%';
      }

      newModals.set(id, component);
      return newModals;
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const newModals = new Map(prev);
      newModals.delete(id);

      // If no modals are open, restore scroll behavior
      if (newModals.size === 0) {
        const originalStyles = originalBodyStyleRef.current;
        if (originalStyles) {
          document.body.style.overflow = originalStyles.overflow;
          document.body.style.position = originalStyles.position;
          document.body.style.top = originalStyles.top;
          document.body.style.width = originalStyles.width;
        }

        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);
        originalBodyStyleRef.current = null;
      }

      return newModals;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals((prev) => {
      if (prev.size > 0) {
        // Restore scroll behavior
        const originalStyles = originalBodyStyleRef.current;
        if (originalStyles) {
          document.body.style.overflow = originalStyles.overflow;
          document.body.style.position = originalStyles.position;
          document.body.style.top = originalStyles.top;
          document.body.style.width = originalStyles.width;
        }

        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);
        originalBodyStyleRef.current = null;
      }

      return new Map();
    });
  }, []);

  const isModalOpen = useCallback(
    (id: string) => {
      return modals.has(id);
    },
    [modals]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Restore body styles if component unmounts with modals open
      if (modals.size > 0) {
        const originalStyles = originalBodyStyleRef.current;
        if (originalStyles) {
          document.body.style.overflow = originalStyles.overflow;
          document.body.style.position = originalStyles.position;
          document.body.style.top = originalStyles.top;
          document.body.style.width = originalStyles.width;
        }
      }
    };
  }, [modals.size]);

  const contextValue: ModalContextType = {
    openModal,
    closeModal,
    isModalOpen,
    closeAllModals,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {[...modals.entries()].map(([id, component]) => (
        <div key={id} className="modal-portal">
          {component}
        </div>
      ))}
    </ModalContext.Provider>
  );
}
