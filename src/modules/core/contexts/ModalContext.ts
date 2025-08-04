import { createContext, ReactNode } from 'react';

export interface ModalContextType {
  openModal: (id: string, component: ReactNode) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  closeAllModals: () => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);
