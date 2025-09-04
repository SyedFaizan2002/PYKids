/**
 * Animation utilities for performance optimization
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get appropriate animation variants based on user preference
export const getAnimationVariants = (normalVariants: any, reducedVariants: any) => {
  return prefersReducedMotion() ? reducedVariants : normalVariants;
};

// Throttle animation updates for better performance
export const throttleAnimation = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  
  return function (this: any, ...args: any[]) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Optimize animation performance by using transform3d
export const optimizeForGPU = (element: HTMLElement) => {
  if (element) {
    element.style.transform = 'translate3d(0, 0, 0)';
    element.style.willChange = 'transform, opacity';
  }
};

// Clean up GPU optimization
export const cleanupGPUOptimization = (element: HTMLElement) => {
  if (element) {
    element.style.willChange = 'auto';
  }
};

// Debounce resize events for animation recalculation
export const debounceResize = (func: Function, delay: number = 250) => {
  let timeoutId: NodeJS.Timeout;
  
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Check if animations should be enabled based on device performance
export const shouldEnableAnimations = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  // Disable animations on low-end devices
  const connection = (navigator as any).connection;
  if (connection && connection.saveData) {
    return false;
  }
  
  // Check for reduced motion preference
  if (prefersReducedMotion()) {
    return false;
  }
  
  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return false;
  }
  
  return true;
};

// Animation performance monitor
export class AnimationPerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private isMonitoring = false;
  
  start() {
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.monitor();
  }
  
  stop() {
    this.isMonitoring = false;
  }
  
  private monitor = () => {
    if (!this.isMonitoring) return;
    
    const currentTime = performance.now();
    this.frameCount++;
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Log performance warning if FPS drops below 30
      if (this.fps < 30) {
        console.warn(`Animation performance warning: FPS dropped to ${this.fps}`);
      }
    }
    
    requestAnimationFrame(this.monitor);
  };
  
  getFPS(): number {
    return this.fps;
  }
}

// Create a global performance monitor instance
export const animationMonitor = new AnimationPerformanceMonitor();

// Intersection Observer for animation triggers
export const createAnimationObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return null;
  }
  
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Preload animation resources
export const preloadAnimationResources = () => {
  // Preload common animation easing functions
  const style = document.createElement('style');
  style.textContent = `
    .animation-preload {
      animation: preload-keyframes 0.001s;
    }
    
    @keyframes preload-keyframes {
      0% { opacity: 0.99; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  // Remove after preload
  setTimeout(() => {
    document.head.removeChild(style);
  }, 100);
};

// Animation frame scheduler for better performance
export class AnimationScheduler {
  private tasks: Array<() => void> = [];
  private isRunning = false;
  
  schedule(task: () => void) {
    this.tasks.push(task);
    if (!this.isRunning) {
      this.run();
    }
  }
  
  private run = () => {
    this.isRunning = true;
    
    const processTasks = () => {
      const startTime = performance.now();
      
      // Process tasks for up to 16ms (60fps budget)
      while (this.tasks.length > 0 && performance.now() - startTime < 16) {
        const task = this.tasks.shift();
        if (task) task();
      }
      
      if (this.tasks.length > 0) {
        requestAnimationFrame(processTasks);
      } else {
        this.isRunning = false;
      }
    };
    
    requestAnimationFrame(processTasks);
  };
}

export const animationScheduler = new AnimationScheduler();