import { render, screen, fireEvent } from '@testing-library/react';
import { useModal } from '@/modules/core/hooks/useModal';
import { ModalProvider } from '@/modules/core/providers/ModalProvider';

// Test component that uses the useModal hook
function TestUseModalComponent({ modalId }: { modalId: string }) {
  const { openModal, closeModal, isOpen } = useModal(modalId);

  const handleOpenModal = () => {
    openModal(<div data-testid="hook-modal-content">Hook Modal Content</div>, {
      title: 'Hook Modal Title',
      size: 'large',
      dismissible: true,
    });
  };

  const handleOpenModalWithoutOptions = () => {
    openModal(<div data-testid="simple-modal-content">Simple Content</div>);
  };

  return (
    <div>
      <button onClick={handleOpenModal} data-testid="open-modal-with-options">
        Open Modal with Options
      </button>
      <button
        onClick={handleOpenModalWithoutOptions}
        data-testid="open-simple-modal"
      >
        Open Simple Modal
      </button>
      <button onClick={closeModal} data-testid="close-modal">
        Close Modal
      </button>
      <div data-testid="modal-status">{isOpen ? 'open' : 'closed'}</div>
    </div>
  );
}

describe('useModal Hook', () => {
  test('should open modal with options correctly', () => {
    // Given a component using useModal hook
    render(
      <ModalProvider>
        <TestUseModalComponent modalId="test-modal" />
      </ModalProvider>
    );

    // When I open modal with options
    fireEvent.click(screen.getByTestId('open-modal-with-options'));

    // Then modal should be open with correct content and title
    expect(screen.getByTestId('modal-status')).toHaveTextContent('open');
    expect(screen.getByTestId('hook-modal-content')).toBeInTheDocument();
    expect(screen.getByText('Hook Modal Title')).toBeInTheDocument();

    // And modal should have the large size class
    expect(
      document.querySelector('.modal-container--large')
    ).toBeInTheDocument();
  });

  test('should open modal with default options', () => {
    // Given a component using useModal hook
    render(
      <ModalProvider>
        <TestUseModalComponent modalId="simple-modal" />
      </ModalProvider>
    );

    // When I open modal without options
    fireEvent.click(screen.getByTestId('open-simple-modal'));

    // Then modal should be open with default settings
    expect(screen.getByTestId('modal-status')).toHaveTextContent('open');
    expect(screen.getByTestId('simple-modal-content')).toBeInTheDocument();

    // And modal should have the default medium size class
    expect(
      document.querySelector('.modal-container--medium')
    ).toBeInTheDocument();
  });

  test('should close modal correctly', () => {
    // Given a component with an open modal
    render(
      <ModalProvider>
        <TestUseModalComponent modalId="test-modal" />
      </ModalProvider>
    );

    fireEvent.click(screen.getByTestId('open-simple-modal'));
    expect(screen.getByTestId('modal-status')).toHaveTextContent('open');

    // When I close the modal
    fireEvent.click(screen.getByTestId('close-modal'));

    // Then modal should be closed
    expect(screen.getByTestId('modal-status')).toHaveTextContent('closed');
    expect(
      screen.queryByTestId('simple-modal-content')
    ).not.toBeInTheDocument();
  });

  test('should track modal open state correctly', () => {
    // Given a component using useModal hook
    render(
      <ModalProvider>
        <TestUseModalComponent modalId="status-test-modal" />
      </ModalProvider>
    );

    // When modal is initially closed
    // Then isOpen should be false
    expect(screen.getByTestId('modal-status')).toHaveTextContent('closed');

    // When I open the modal
    fireEvent.click(screen.getByTestId('open-simple-modal'));

    // Then isOpen should be true
    expect(screen.getByTestId('modal-status')).toHaveTextContent('open');

    // When I close the modal
    fireEvent.click(screen.getByTestId('close-modal'));

    // Then isOpen should be false again
    expect(screen.getByTestId('modal-status')).toHaveTextContent('closed');
  });

  test('should handle multiple modals with different IDs', () => {
    // Given multiple components with different modal IDs
    function MultiModalTest() {
      return (
        <ModalProvider>
          <TestUseModalComponent modalId="modal-1" />
          <TestUseModalComponent modalId="modal-2" />
        </ModalProvider>
      );
    }

    render(<MultiModalTest />);

    const [openButton1, openButton2] =
      screen.getAllByTestId('open-simple-modal');
    const [closeButton1] = screen.getAllByTestId('close-modal');
    const [status1, status2] = screen.getAllByTestId('modal-status');

    // When I open first modal
    fireEvent.click(openButton1);

    // Then first modal should be open, second should be closed
    expect(status1).toHaveTextContent('open');
    expect(status2).toHaveTextContent('closed');

    // When I open second modal
    fireEvent.click(openButton2);

    // Then both modals should be open
    expect(status1).toHaveTextContent('open');
    expect(status2).toHaveTextContent('open');
    expect(screen.getAllByTestId('simple-modal-content')).toHaveLength(2);

    // When I close first modal
    fireEvent.click(closeButton1);

    // Then first modal should be closed, second should remain open
    expect(status1).toHaveTextContent('closed');
    expect(status2).toHaveTextContent('open');
    expect(screen.getAllByTestId('simple-modal-content')).toHaveLength(1);
  });

  test('should handle modal close from within modal content', () => {
    // Given a modal with a close button in its content
    function ModalWithCloseButton({ modalId }: { modalId: string }) {
      const { openModal, closeModal, isOpen } = useModal(modalId);

      const handleOpenModal = () => {
        openModal(
          <div>
            <div data-testid="modal-with-close-content">Modal Content</div>
            <button onClick={closeModal} data-testid="internal-close-button">
              Close from Inside
            </button>
          </div>,
          { title: 'Modal with Internal Close' }
        );
      };

      return (
        <div>
          <button onClick={handleOpenModal} data-testid="open-modal">
            Open Modal
          </button>
          <div data-testid="modal-status">{isOpen ? 'open' : 'closed'}</div>
        </div>
      );
    }

    render(
      <ModalProvider>
        <ModalWithCloseButton modalId="internal-close-modal" />
      </ModalProvider>
    );

    // When I open the modal
    fireEvent.click(screen.getByTestId('open-modal'));
    expect(screen.getByTestId('modal-status')).toHaveTextContent('open');

    // When I click the internal close button
    fireEvent.click(screen.getByTestId('internal-close-button'));

    // Then modal should be closed
    expect(screen.getByTestId('modal-status')).toHaveTextContent('closed');
    expect(
      screen.queryByTestId('modal-with-close-content')
    ).not.toBeInTheDocument();
  });

  test('should handle different modal configurations', () => {
    // Given a component that opens modals with different configurations
    function ConfigurableModalTest() {
      const { openModal, closeModal, isOpen } = useModal('config-test');

      const openSmallModal = () => {
        openModal(<div data-testid="small-modal">Small Modal</div>, {
          size: 'small',
          title: 'Small Modal',
        });
      };

      const openFullModal = () => {
        openModal(<div data-testid="full-modal">Full Modal</div>, {
          size: 'full',
          showHeader: false,
        });
      };

      const openNonDismissibleModal = () => {
        openModal(
          <div data-testid="non-dismissible-modal">Non-dismissible Modal</div>,
          { dismissible: false, title: 'Cannot Dismiss' }
        );
      };

      return (
        <div>
          <button onClick={openSmallModal} data-testid="open-small">
            Small
          </button>
          <button onClick={openFullModal} data-testid="open-full">
            Full
          </button>
          <button
            onClick={openNonDismissibleModal}
            data-testid="open-non-dismissible"
          >
            Non-dismissible
          </button>
          <button onClick={closeModal} data-testid="close">
            Close
          </button>
          <div data-testid="status">{isOpen ? 'open' : 'closed'}</div>
        </div>
      );
    }

    render(
      <ModalProvider>
        <ConfigurableModalTest />
      </ModalProvider>
    );

    // When I open small modal
    fireEvent.click(screen.getByTestId('open-small'));
    expect(
      document.querySelector('.modal-container--small')
    ).toBeInTheDocument();
    expect(screen.getByTestId('small-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close'));

    // When I open full modal
    fireEvent.click(screen.getByTestId('open-full'));
    expect(
      document.querySelector('.modal-container--full')
    ).toBeInTheDocument();
    expect(screen.queryByText('Full Modal')).toBeInTheDocument();
    // Header should not be shown
    expect(
      screen.queryByRole('button', { name: /close modal/i })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close'));

    // When I open non-dismissible modal
    fireEvent.click(screen.getByTestId('open-non-dismissible'));
    expect(screen.getByText('Cannot Dismiss')).toBeInTheDocument();
    // Close button should not be present
    expect(
      screen.queryByRole('button', { name: /close modal/i })
    ).not.toBeInTheDocument();
  });
});
