import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModal } from '../../src/components/AuthModal.tsx';

describe('Frontend: AuthModal Component', () => {
  it('renders login form by default with email and password inputs', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    render(<AuthModal isOpen={true} onClose={mockOnClose} onAuthSuccess={mockOnSuccess} />);

    expect(screen.getByTestId('auth-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toHaveTextContent(/sign in/i);
    // Name input should NOT be present on login mode
    expect(screen.queryByTestId('auth-name-input')).not.toBeInTheDocument();
  });

  it('switches between Login and Register modes when toggle button is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    render(<AuthModal isOpen={true} onClose={mockOnClose} onAuthSuccess={mockOnSuccess} />);

    const toggleBtn = screen.getByTestId('auth-toggle-mode');
    fireEvent.click(toggleBtn);

    // Should now show name input and Create Account button
    expect(screen.getByTestId('auth-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit-btn')).toHaveTextContent(/create account/i);
  });

  it('autofills demo credentials when Use Demo User is clicked', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    render(<AuthModal isOpen={true} onClose={mockOnClose} onAuthSuccess={mockOnSuccess} />);

    const demoBtn = screen.getByText(/use demo user/i);
    fireEvent.click(demoBtn);

    const emailInput = screen.getByTestId('auth-email-input') as HTMLInputElement;
    expect(emailInput.value).toBe('demo@postcomposer.io');
  });
});
