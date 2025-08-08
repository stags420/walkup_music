import type { ReactNode, MouseEvent, CSSProperties } from 'react';
import { Button as BootstrapButton } from 'react-bootstrap';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: MouseEvent<HTMLButtonElement>) => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark'
    | 'outline-primary'
    | 'outline-secondary'
    | 'outline-success'
    | 'outline-danger'
    | 'outline-warning'
    | 'outline-info'
    | 'outline-light'
    | 'outline-dark';
  size?: 'sm' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size,
  disabled = false,
  type = 'button',
  className = '',
  style,
  'data-testid': dataTestId,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <BootstrapButton
      variant={variant}
      size={size}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      data-testid={dataTestId}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
    >
      {children}
    </BootstrapButton>
  );
}

// Add default export
export default Button;
