/**
 * Animation performance tests
 */

import { 
  shouldEnableAnimations, 
  prefersReducedMotion, 
  getAnimationVariants,
  AnimationPerformanceMonitor,
  animationScheduler
} from '../animationUtils';
import { pageVariants, reducedMotionVariants, buttonVariants } from '../animationVariants';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator properties
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    saveData: false,
  },
});

Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: 8,
});

describe('Animation Performance Utils', () => {
  beforeEach(() => {
    // Reset mocks
    (window.matchMedia as jest.Mock).mockClear();
  });

  describe('prefersReducedMotion', () => {
    it('should return false when user does not prefer reduced motion', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
      });

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
      });

      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('shouldEnableAnimations', () => {
    it('should enable animations by default', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
      });

      expect(shouldEnableAnimations()).toBe(true);
    });

    it('should disable animations when user prefers reduced motion', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
      });

      expect(shouldEnableAnimations()).toBe(false);
    });

    it('should disable animations when saveData is enabled', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
      });

      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          saveData: true,
        },
      });

      expect(shouldEnableAnimations()).toBe(false);
    });

    it('should disable animations on low memory devices', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
      });

      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          saveData: false,
        },
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        value: 2,
      });

      expect(shouldEnableAnimations()).toBe(false);
    });
  });

  describe('getAnimationVariants', () => {
    it('should return normal variants when animations are enabled', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
      });

      const result = getAnimationVariants(pageVariants, reducedMotionVariants);
      expect(result).toBe(pageVariants);
    });

    it('should return reduced variants when reduced motion is preferred', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
      });

      const result = getAnimationVariants(pageVariants, reducedMotionVariants);
      expect(result).toBe(reducedMotionVariants);
    });
  });

  describe('AnimationPerformanceMonitor', () => {
    let monitor: AnimationPerformanceMonitor;

    beforeEach(() => {
      monitor = new AnimationPerformanceMonitor();
      // Mock performance.now
      jest.spyOn(performance, 'now').mockReturnValue(0);
      // Mock requestAnimationFrame
      global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    });

    afterEach(() => {
      monitor.stop();
      jest.restoreAllMocks();
    });

    it('should start monitoring', () => {
      monitor.start();
      expect(monitor.getFPS()).toBe(60); // Initial FPS
    });

    it('should stop monitoring', () => {
      monitor.start();
      monitor.stop();
      // Should not throw or cause issues
    });
  });

  describe('AnimationScheduler', () => {
    beforeEach(() => {
      // Mock requestAnimationFrame
      global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
      // Mock performance.now
      jest.spyOn(performance, 'now').mockReturnValue(0);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should schedule and execute tasks', (done) => {
      const task = jest.fn();
      
      animationScheduler.schedule(task);
      
      setTimeout(() => {
        expect(task).toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should handle multiple tasks', (done) => {
      const task1 = jest.fn();
      const task2 = jest.fn();
      
      animationScheduler.schedule(task1);
      animationScheduler.schedule(task2);
      
      setTimeout(() => {
        expect(task1).toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
        done();
      }, 50);
    });
  });
});

describe('Animation Variants', () => {
  describe('pageVariants', () => {
    it('should have proper initial state', () => {
      expect(pageVariants.initial).toEqual({
        opacity: 0,
        y: 20,
        scale: 0.98,
      });
    });

    it('should have proper animate state', () => {
      expect(pageVariants.animate.opacity).toBe(1);
      expect(pageVariants.animate.y).toBe(0);
      expect(pageVariants.animate.scale).toBe(1);
    });

    it('should have proper exit state', () => {
      expect(pageVariants.exit.opacity).toBe(0);
      expect(pageVariants.exit.y).toBe(-20);
      expect(pageVariants.exit.scale).toBe(0.98);
    });
  });

  describe('buttonVariants', () => {
    it('should have hover state', () => {
      expect(buttonVariants.hover.scale).toBe(1.05);
    });

    it('should have tap state', () => {
      expect(buttonVariants.tap.scale).toBe(0.95);
    });

    it('should have disabled state', () => {
      expect(buttonVariants.disabled.opacity).toBe(0.5);
    });
  });

  describe('reducedMotionVariants', () => {
    it('should have minimal animation', () => {
      expect(reducedMotionVariants.initial.opacity).toBe(0);
      expect(reducedMotionVariants.animate.opacity).toBe(1);
      expect(reducedMotionVariants.exit.opacity).toBe(0);
    });

    it('should have short duration', () => {
      expect(reducedMotionVariants.animate.transition.duration).toBe(0.2);
      expect(reducedMotionVariants.exit.transition.duration).toBe(0.2);
    });
  });
});

describe('Animation Performance Optimization', () => {
  it('should use GPU-accelerated properties', () => {
    // Test that our variants use transform and opacity for better performance
    expect(pageVariants.initial).toHaveProperty('y');
    expect(pageVariants.initial).toHaveProperty('scale');
    expect(pageVariants.initial).toHaveProperty('opacity');
    
    // These properties are GPU-accelerated
    expect(pageVariants.animate).toHaveProperty('y');
    expect(pageVariants.animate).toHaveProperty('scale');
    expect(pageVariants.animate).toHaveProperty('opacity');
  });

  it('should have reasonable animation durations', () => {
    // Animations should not be too long to avoid performance issues
    expect(pageVariants.animate.transition.duration).toBeLessThanOrEqual(0.6);
    expect(pageVariants.exit.transition.duration).toBeLessThanOrEqual(0.4);
  });

  it('should use appropriate easing functions', () => {
    // Should use performance-optimized easing
    expect(pageVariants.animate.transition.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
  });
});