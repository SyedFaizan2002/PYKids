/**
 * Tests for OptimizedAnimatePresence component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OptimizedAnimatePresence, { PageTransition, StaggerContainer, StaggerItem } from '../OptimizedAnimatePresence';
import * as animationUtils from '../../utils/animationUtils';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock animation utils
jest.mock('../../utils/animationUtils', () => ({
  shouldEnableAnimations: jest.fn(() => true),
  getAnimationVariants: jest.fn((normal, reduced) => normal),
}));

describe('OptimizedAnimatePresence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when animations are enabled', () => {
    (animationUtils.shouldEnableAnimations as jest.Mock).mockReturnValue(true);

    render(
      <OptimizedAnimatePresence>
        <div>Test content</div>
      </OptimizedAnimatePresence>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders children without AnimatePresence when animations are disabled', () => {
    (animationUtils.shouldEnableAnimations as jest.Mock).mockReturnValue(false);

    render(
      <OptimizedAnimatePresence>
        <div>Test content</div>
      </OptimizedAnimatePresence>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('passes through AnimatePresence props when animations are enabled', () => {
    (animationUtils.shouldEnableAnimations as jest.Mock).mockReturnValue(true);

    const onExitComplete = jest.fn();

    render(
      <OptimizedAnimatePresence mode="wait" onExitComplete={onExitComplete}>
        <div>Test content</div>
      </OptimizedAnimatePresence>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});

describe('PageTransition', () => {
  it('renders with proper GPU acceleration styles', () => {
    render(
      <BrowserRouter>
        <PageTransition className="test-class">
          <div>Page content</div>
        </PageTransition>
      </BrowserRouter>
    );

    const pageElement = screen.getByText('Page content').parentElement;
    expect(pageElement).toHaveClass('test-class');
    expect(pageElement).toHaveStyle({
      transform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden',
      perspective: '1000px',
    });
  });

  it('uses appropriate animation variants', () => {
    const mockGetAnimationVariants = animationUtils.getAnimationVariants as jest.Mock;
    
    render(
      <BrowserRouter>
        <PageTransition>
          <div>Page content</div>
        </PageTransition>
      </BrowserRouter>
    );

    expect(mockGetAnimationVariants).toHaveBeenCalled();
  });
});

describe('StaggerContainer', () => {
  it('renders children with stagger animation', () => {
    render(
      <StaggerContainer className="stagger-test">
        <div>Child 1</div>
        <div>Child 2</div>
      </StaggerContainer>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    
    const container = screen.getByText('Child 1').parentElement;
    expect(container).toHaveClass('stagger-test');
  });

  it('uses reduced motion variants when appropriate', () => {
    const mockGetAnimationVariants = animationUtils.getAnimationVariants as jest.Mock;
    
    render(
      <StaggerContainer>
        <div>Content</div>
      </StaggerContainer>
    );

    expect(mockGetAnimationVariants).toHaveBeenCalled();
  });
});

describe('StaggerItem', () => {
  it('renders with proper animation variants', () => {
    render(
      <StaggerItem className="item-test" index={1}>
        <div>Item content</div>
      </StaggerItem>
    );

    expect(screen.getByText('Item content')).toBeInTheDocument();
    
    const item = screen.getByText('Item content').parentElement;
    expect(item).toHaveClass('item-test');
  });

  it('handles custom index prop', () => {
    render(
      <StaggerItem index={5}>
        <div>Indexed item</div>
      </StaggerItem>
    );

    expect(screen.getByText('Indexed item')).toBeInTheDocument();
  });
});

describe('Animation Performance Considerations', () => {
  it('should disable animations when shouldEnableAnimations returns false', () => {
    (animationUtils.shouldEnableAnimations as jest.Mock).mockReturnValue(false);

    render(
      <OptimizedAnimatePresence>
        <PageTransition>
          <div>Performance optimized content</div>
        </PageTransition>
      </OptimizedAnimatePresence>
    );

    expect(screen.getByText('Performance optimized content')).toBeInTheDocument();
    expect(animationUtils.shouldEnableAnimations).toHaveBeenCalled();
  });

  it('should use GPU-accelerated properties in PageTransition', () => {
    render(
      <BrowserRouter>
        <PageTransition>
          <div>GPU optimized</div>
        </PageTransition>
      </BrowserRouter>
    );

    const element = screen.getByText('GPU optimized').parentElement;
    
    // Check for GPU acceleration styles
    expect(element).toHaveStyle('transform: translate3d(0, 0, 0)');
    expect(element).toHaveStyle('backface-visibility: hidden');
    expect(element).toHaveStyle('perspective: 1000px');
  });
});