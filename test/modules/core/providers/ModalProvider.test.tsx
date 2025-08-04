import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalProvider } from '@/modules/core/providers/ModalProvider';
import { useModal as useModalContext } from '@/modules/core/hooks/useModalContext';

// Test component that uses the modal context
function TestModalComponent({ modalId }: { modalId: string }) {
  const { openModal, closeModal, isModalOpen } = useModalContext();

  const handleOpenModal = () => {
    openModal(
      modalId,
      <div data-testid="modal-content">Test Modal Content</div>
    );
  };

  const handleCloseModal = () => {
    closeModal(modalId);
  };

  return (
    <div>
      <button onClick={handleOpenModal} data-testid="open-modal">
        Open Modal
      </button>
      <button onClick={handleCloseModal} data-testid="close-modal">
        Close Modal
      </button>
      <div data-testid="modal-status">
        {isModalOpen(modalId) ? 'open' : 'closed'}
      </div>
    </div>
  );
}

describe('ModalProvider', () => {
  let originalScrollY: number;
  let originalBodyStyle: {
    overflow: string;
    position: string;
    top: string;
    width: string;
  };

  beforeEach(() => {
    // Store original values
    originalScrollY = window.scrollY;
    originalBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    // Mock window.scrollY and scrollTo
    Object.defineProperty(globalThis, 'scrollY', {
      writable: true,
      value: 100,
    });

    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(globalThis, 'scrollY', {
      writable: true,
      value: originalScrollY,
    });

    document.body.style.overflow = originalBodyStyle.overflow;
    document.body.style.position = originalBodyStyle.position;
    document.body.style.top = originalBodyStyle.top;
    document.body.style.width = originalBodyStyle.width;
  });

  test('should throw error when useModal is used outside ModalProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestModalComponent modalId="test-modal" />);
    }).toThrow('useModal must be used within a ModalProvider');

    consoleSpy.mockRestore();
  });

  test('should open and close modals correctly', () => {
    // Given a component wrapped in ModalProvider
    render(
      <ModalProvider>
        <TestModalComponent modalId="test-modal" />
      </ModalProvider>
    );

    // When I check initial modal status
    // Then modal should be closed
    expect(screen.getByTestId('modal-status')).toHaveTextContent('closed');
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();

    // When I open the modal
    fireEvent.click(screen.getByTestId('open-modal'));

    // Then modal should be open and content should be visible
    expect(screen.getByTestId('modal-status')).toHaveTextContent('open');
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();

    // When I close the modal
    fireEvent.click(screen.getByTestId('close-modal'));

    // Then modal should be closed and content should be removed
    expect(screen.getByTestId('modal-status')).toHaveTextContent('closed');
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });

  test('should prevent body scroll when modal is opened', () => {
    // Given a component wrapped in ModalProvider
    render(
      <ModalProvider>
        <TestModalComponent modalId="test-modal" />
      </ModalProvider>
    );

    // When I open a modal
    fireEvent.click(screen.getByTestId('open-modal'));

    // Then body scroll should be prevented
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-100px');
    expect(document.body.style.width).toBe('100%');
  });

  test('should restore body scroll when modal is closed', async () => {
    // Given a component wrapped in ModalProvider with a modal open
    render(
      <ModalProvider>
        <TestModalComponent modalId="test-modal" />
      </ModalProvider>
    );

    fireEvent.click(screen.getByTestId('open-modal'));

    // When I close the modal
    fireEvent.click(screen.getByTestId('close-modal'));

    // Then body scroll should be restored
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
      expect(document.body.style.top).toBe('');
      expect(document.body.style.width).toBe('');
    });

    // And scroll position should be restored
    expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
  });

  test('should handle multiple modals correctly', () => {
    // Given a component that can manage multiple modals
    function MultiModalTest() {
      const { openModal, closeModal, isModalOpen } = useModalContext();

      return (
        <div>
          <button
            onClick={() =>
              openModal(
                'modal-1',
                <div data-testid="modal-1-content">Modal 1</div>
              )
            }
            data-testid="open-modal-1"
          >
            Open Modal 1
          </button>
          <button
            onClick={() =>
              openModal(
                'modal-2',
                <div data-testid="modal-2-content">Modal 2</div>
              )
            }
            data-testid="open-modal-2"
          >
            Open Modal 2
          </button>
          <button
            onClick={() => closeModal('modal-1')}
            data-testid="close-modal-1"
          >
            Close Modal 1
          </button>
          <div data-testid="modal-1-status">
            {isModalOpen('modal-1') ? 'open' : 'closed'}
          </div>
          <div data-testid="modal-2-status">
            {isModalOpen('modal-2') ? 'open' : 'closed'}
          </div>
        </div>
      );
    }

    render(
      <ModalProvider>
        <MultiModalTest />
      </ModalProvider>
    );

    // When I open first modal
    fireEvent.click(screen.getByTestId('open-modal-1'));

    // Then first modal should be open, second should be closed
    expect(screen.getByTestId('modal-1-status')).toHaveTextContent('open');
    expect(screen.getByTestId('modal-2-status')).toHaveTextContent('closed');
    expect(screen.getByTestId('modal-1-content')).toBeInTheDocument();

    // When I open second modal
    fireEvent.click(screen.getByTestId('open-modal-2'));

    // Then both modals should be open
    expect(screen.getByTestId('modal-1-status')).toHaveTextContent('open');
    expect(screen.getByTestId('modal-2-status')).toHaveTextContent('open');
    expect(screen.getByTestId('modal-1-content')).toBeInTheDocument();
    expect(screen.getByTestId('modal-2-content')).toBeInTheDocument();

    // When I close first modal
    fireEvent.click(screen.getByTestId('close-modal-1'));

    // Then first modal should be closed, second should remain open
    expect(screen.getByTestId('modal-1-status')).toHaveTextContent('closed');
    expect(screen.getByTestId('modal-2-status')).toHaveTextContent('open');
    expect(screen.queryByTestId('modal-1-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('modal-2-content')).toBeInTheDocument();
  });

  test('should restore scroll only when all modals are closed', async () => {
    // Given a component wrapped in ModalProvider
    render(
      <ModalProvider>
        <TestModalComponent modalId="modal-test" />
      </ModalProvider>
    );

    // When I open a modal
    fireEvent.click(screen.getByTestId('open-modal'));

    // Then body scroll should be prevented
    expect(document.body.style.overflow).toBe('hidden');

    // When I close the modal
    fireEvent.click(screen.getByTestId('close-modal'));

    // Then body scroll should be restored
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
    });
  });

  test('should handle closeAllModals correctly', () => {
    // Given a component that can close all modals
    function TestCloseAllComponent() {
      const { openModal, closeAllModals, isModalOpen } = useModalContext();

      const handleOpenModals = () => {
        openModal('modal-1', <div data-testid="modal-1">Modal 1</div>);
        openModal('modal-2', <div data-testid="modal-2">Modal 2</div>);
      };

      return (
        <div>
          <button onClick={handleOpenModals} data-testid="open-all">
            Open All
          </button>
          <button onClick={closeAllModals} data-testid="close-all">
            Close All
          </button>
          <div data-testid="modal-1-status">
            {isModalOpen('modal-1') ? 'open' : 'closed'}
          </div>
          <div data-testid="modal-2-status">
            {isModalOpen('modal-2') ? 'open' : 'closed'}
          </div>
        </div>
      );
    }

    render(
      <ModalProvider>
        <TestCloseAllComponent />
      </ModalProvider>
    );

    // When I open all modals
    fireEvent.click(screen.getByTestId('open-all'));

    // Then both modals should be open
    expect(screen.getByTestId('modal-1-status')).toHaveTextContent('open');
    expect(screen.getByTestId('modal-2-status')).toHaveTextContent('open');
    expect(screen.getByTestId('modal-1')).toBeInTheDocument();
    expect(screen.getByTestId('modal-2')).toBeInTheDocument();

    // When I close all modals
    fireEvent.click(screen.getByTestId('close-all'));

    // Then all modals should be closed
    expect(screen.getByTestId('modal-1-status')).toHaveTextContent('closed');
    expect(screen.getByTestId('modal-2-status')).toHaveTextContent('closed');
    expect(screen.queryByTestId('modal-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('modal-2')).not.toBeInTheDocument();
  });

  test('should cleanup body styles on unmount', () => {
    // Given a ModalProvider with an open modal
    const { unmount } = render(
      <ModalProvider>
        <TestModalComponent modalId="test-modal" />
      </ModalProvider>
    );

    fireEvent.click(screen.getByTestId('open-modal'));
    expect(document.body.style.overflow).toBe('hidden');

    // When the component unmounts
    unmount();

    // Then body styles should be restored
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.width).toBe('');
  });
});
