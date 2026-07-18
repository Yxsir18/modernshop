import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../components/Footer';

// Mock the Shop Context
vi.mock('../context/ShopContext', () => ({
  useShop: () => ({
    categories: [
      { id: '1', name: 'Apparel', slug: 'apparel', image: '' },
      { id: '2', name: 'Tech', slug: 'tech', image: '' }
    ],
    triggerNotification: vi.fn()
  })
}));

describe('Footer Component UI Test Suite', () => {
  it('should render brand logo text and corporate details correctly', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Assert branding is rendered
    expect(screen.getByText('ModernShop')).toBeDefined();

    // Assert shipping bar elements are rendered
    expect(screen.getByText('Free Expedited Delivery')).toBeDefined();
    expect(screen.getByText('30-Day Free Return')).toBeDefined();
  });
});
