import { useContext } from 'react';
import { ModalContext, ModalContextType } from '../contexts/ModalContext';

/**
 * Hook to access modal context
 * Must be used within a ModalProvider
 */
export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
