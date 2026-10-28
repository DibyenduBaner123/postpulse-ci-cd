import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostComposer } from '../../src/components/PostComposer.tsx';

describe('Frontend: PostComposer Component', () => {
  it('renders composer textarea and default selected platforms (Twitter, LinkedIn)', () => {
    render(<PostComposer />);

    const textarea = screen.getByTestId('composer-textarea');
    expect(textarea).toBeInTheDocument();

    const twitterCounter = screen.getByTestId('counter-twitter');
    expect(twitterCounter).toBeInTheDocument();

    const linkedinCounter = screen.getByTestId('counter-linkedin');
    expect(linkedinCounter).toBeInTheDocument();
  });

  it('updates remaining character counter as user types', () => {
    render(<PostComposer />);

    const textarea = screen.getByTestId('composer-textarea');
    fireEvent.change(textarea, { target: { value: 'Hello Twitter and LinkedIn!' } });

    // "Hello Twitter and LinkedIn!" is 27 characters
    // Twitter limit 280 -> 280 - 27 = 253 remaining
    const twitterCounter = screen.getByTestId('counter-twitter');
    expect(twitterCounter).toHaveTextContent('253');
  });

  it('toggles platform selection when platform buttons are clicked', () => {
    render(<PostComposer />);

    // Instagram toggle button
    const instagramBtn = screen.getByTestId('platform-toggle-instagram');
    fireEvent.click(instagramBtn);

    // Instagram counter should now be in document
    const instagramCounter = screen.getByTestId('counter-instagram');
    expect(instagramCounter).toBeInTheDocument();
  });

  it('displays validation error banner if submitting empty post', async () => {
    render(<PostComposer />);

    const submitBtn = screen.getByTestId('composer-submit-btn');
    fireEvent.click(submitBtn);

    const errorBanner = await screen.findByTestId('validation-error-banner');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveTextContent(/cannot be empty/i);
  });

  it('displays warning when Twitter limit of 280 is breached', () => {
    render(<PostComposer />);

    const textarea = screen.getByTestId('composer-textarea');
    const longText = 'x'.repeat(285);
    fireEvent.change(textarea, { target: { value: longText } });

    const twitterCounter = screen.getByTestId('counter-twitter');
    // Remaining should be -5
    expect(twitterCounter).toHaveTextContent('-5');
  });
});
