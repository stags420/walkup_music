import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/modules/core/components/Modal';

// Mock the ModalProvider for isolated Modal component testing
const mockModalContext = {
  openModal: jest.fn(),
  closeModal: jest.fn(),
  isModalOpen: jest.fn(),
  closeAllModals: jest.fn(),
};

jest.mock('@/modules/core/providers/ModalProvider', () => ({
  ...jest.requireActual('@/modules/core/providers/ModalProvider'),
  useModal: () => mockModalContext,
}));

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div data-testid="modal-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not render when isOpen is false', () => {
    // Given a modal with isOpen set to false
    render(<Modal {...defaultProps} isOpen={false} />);

    // Then modal should not be in the document
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });

  test('should render modal content when isOpen is true', () => {
    // Given a modal with isOpen set to true
    render(<Modal {...defaultProps} />);

    // Then modal should be visible with correct attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  test('should render title when provided', () => {
    // Given a modal with a title
    render(<Modal {...defaultProps} title="Test Modal Title" />);

    // Then title should be displayed
    expect(screen.getByText('Test Modal Title')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby',
      'modal-title'
    );
  });

  test('should render close button when dismissible is true', () => {
    // Given a dismissible modal
    render(<Modal {...defaultProps} title="Test Modal" dismissible={true} />);

    // Then close button should be present
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('should not render close button when dismissible is false', () => {
    // Given a non-dismissible modal
    render(<Modal {...defaultProps} title="Test Modal" dismissible={false} />);

    // Then close button should not be present
    expect(
      screen.queryByRole('button', { name: /close modal/i })
    ).not.toBeInTheDocument();
  });

  test('should not render header when showHeader is false', () => {
    // Given a modal with showHeader set to false
    render(<Modal {...defaultProps} title="Test Modal" showHeader={false} />);

    // Then header should not be rendered
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /close modal/i })
    ).not.toBeInTheDocument();
  });

  test('should render actions when provided', () => {
    // Given a modal with actions
    const actions = (
      <div>
        <button data-testid="cancel-button">Cancel</button>
        <button data-testid="confirm-button">Confirm</button>
      </div>
    );

    render(<Modal {...defaultProps} actions={actions} />);

    // Then actions should be rendered
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
  });

  test('should apply size classes correctly', () => {
    // Given modals with different sizes
    const { rerender } = render(<Modal {...defaultProps} size="small" />);

    expect(
      document.querySelector('.modal-container--small')
    ).toBeInTheDocument();

    rerender(<Modal {...defaultProps} size="large" />);
    expect(
      document.querySelector('.modal-container--large')
    ).toBeInTheDocument();

    rerender(<Modal {...defaultProps} size="full" />);
    expect(
      document.querySelector('.modal-container--full')
    ).toBeInTheDocument();
  });

  test('should apply custom className', () => {
    // Given a modal with custom className
    render(<Modal {...defaultProps} className="custom-modal-class" />);

    // Then custom class should be applied
    expect(document.querySelector('.custom-modal-class')).toBeInTheDocument();
  });

  test('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    // Given a modal with close button
    render(
      <Modal {...defaultProps} onClose={onCloseMock} title="Test Modal" />
    );

    // When I click the close button
    await user.click(screen.getByRole('button', { name: /close modal/i }));

    // Then onClose should be called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('should call onClose when overlay is clicked and dismissible is true', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    // Given a dismissible modal
    render(
      <Modal {...defaultProps} onClose={onCloseMock} dismissible={true} />
    );

    // When I click the overlay
    await user.click(screen.getByRole('dialog'));

    // Then onClose should be called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('should not call onClose when overlay is clicked and dismissible is false', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    // Given a non-dismissible modal
    render(
      <Modal {...defaultProps} onClose={onCloseMock} dismissible={false} />
    );

    // When I click the overlay
    await user.click(screen.getByRole('dialog'));

    // Then onClose should not be called
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  test('should not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    // Given a modal
    render(<Modal {...defaultProps} onClose={onCloseMock} />);

    // When I click the modal content
    await user.click(screen.getByTestId('modal-content'));

    // Then onClose should not be called
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  test('should handle Escape key when dismissible is true', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    // Given a dismissible modal
    render(
      <Modal {...defaultProps} onClose={onCloseMock} dismissible={true} />
    );

    // When I press Escape key
    await user.keyboard('{Escape}');

    // Then onClose should be called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('should not handle Escape key when dismissible is false', async () => {
    const user = userEvent.setup();
    const onCloseMock = jest.fn();

    // Given a non-dismissible modal
    render(
      <Modal {...defaultProps} onClose={onCloseMock} dismissible={false} />
    );

    // When I press Escape key
    await user.keyboard('{Escape}');

    // Then onClose should not be called
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  test('should trap focus within modal', async () => {
    const user = userEvent.setup();

    // Given a modal with multiple focusable elements
    const modalContent = (
      <div>
        <button data-testid="first-button">First</button>
        <input data-testid="input-field" />
        <button data-testid="last-button">Last</button>
      </div>
    );

    render(
      <Modal {...defaultProps} title="Test Modal">
        {modalContent}
      </Modal>
    );

    const lastButton = screen.getByTestId('last-button');
    const closeButton = screen.getByRole('button', { name: /close modal/i });

    // Focus should start on the modal container
    expect(document.querySelector('.modal-container')).toHaveFocus();

    // When I tab forward from the last focusable element
    lastButton.focus();
    await user.keyboard('{Tab}');

    // Then focus should wrap to the first focusable element
    expect(closeButton).toHaveFocus();

    // When I shift+tab from the first focusable element
    closeButton.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    // Then focus should wrap to the last focusable element
    expect(lastButton).toHaveFocus();
  });

  test('should restore focus when modal closes', async () => {
    // Given a button that opens the modal
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <div>
          <button data-testid="trigger-button" onClick={() => setIsOpen(true)}>
            Open Modal
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Test Modal"
          >
            <button data-testid="modal-button">Modal Button</button>
          </Modal>
        </div>
      );
    };

    render(<TestComponent />);

    const triggerButton = screen.getByTestId('trigger-button');

    // Focus the trigger button first
    triggerButton.focus();
    expect(triggerButton).toHaveFocus();

    // When I click the trigger button to open modal
    fireEvent.click(triggerButton);

    // Then modal should be open and focused
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // When I close the modal
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));

    // Then focus should be restored to the trigger button
    await waitFor(() => {
      expect(triggerButton).toHaveFocus();
    });
  });

  test('should have proper ARIA attributes', () => {
    // Given a modal with title
    render(<Modal {...defaultProps} title="Test Modal Title" />);

    const dialog = screen.getByRole('dialog');

    // Then modal should have proper ARIA attributes
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog.querySelector('[role="document"]')).toBeInTheDocument();
  });
});
