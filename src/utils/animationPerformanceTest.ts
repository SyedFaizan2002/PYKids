/**
 * Animation performance testing utility
 * This script can be used to test animation performance in development
 */

import { animationMonitor, shouldEnableAnimations } from './animationUtils';

export class AnimationPerformanceTester {
  private testResults: Array<{
    testName: string;
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    duration: number;
  }> = [];

  async testPageTransition(): Promise<void> {
    console.log('🧪 Testing page transition performance...');
    
    if (!shouldEnableAnimations()) {
      console.log('⚠️ Animations disabled, skipping performance test');
      return;
    }

    const testDuration = 3000; // 3 seconds
    const fpsReadings: number[] = [];
    
    animationMonitor.start();
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const fps = animationMonitor.getFPS();
      fpsReadings.push(fps);
    }, 100);

    // Simulate page transition
    await new Promise(resolve => setTimeout(resolve, testDuration));
    
    clearInterval(interval);
    animationMonitor.stop();
    
    const averageFPS = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length;
    const minFPS = Math.min(...fpsReadings);
    const maxFPS = Math.max(...fpsReadings);
    
    this.testResults.push({
      testName: 'Page Transition',
      averageFPS,
      minFPS,
      maxFPS,
      duration: testDuration,
    });

    console.log(`✅ Page transition test completed:`);
    console.log(`   Average FPS: ${averageFPS.toFixed(1)}`);
    console.log(`   Min FPS: ${minFPS}`);
    console.log(`   Max FPS: ${maxFPS}`);
    
    if (averageFPS < 30) {
      console.warn('⚠️ Performance warning: Average FPS below 30');
    } else if (averageFPS >= 50) {
      console.log('🚀 Excellent performance!');
    }
  }

  async testCardAnimations(): Promise<void> {
    console.log('🧪 Testing card animation performance...');
    
    // This would test multiple card animations simultaneously
    const testDuration = 2000;
    const fpsReadings: number[] = [];
    
    animationMonitor.start();
    
    const interval = setInterval(() => {
      const fps = animationMonitor.getFPS();
      fpsReadings.push(fps);
    }, 100);

    await new Promise(resolve => setTimeout(resolve, testDuration));
    
    clearInterval(interval);
    animationMonitor.stop();
    
    const averageFPS = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length;
    const minFPS = Math.min(...fpsReadings);
    const maxFPS = Math.max(...fpsReadings);
    
    this.testResults.push({
      testName: 'Card Animations',
      averageFPS,
      minFPS,
      maxFPS,
      duration: testDuration,
    });

    console.log(`✅ Card animation test completed:`);
    console.log(`   Average FPS: ${averageFPS.toFixed(1)}`);
    console.log(`   Min FPS: ${minFPS}`);
    console.log(`   Max FPS: ${maxFPS}`);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting animation performance tests...');
    console.log('📊 Device info:');
    console.log(`   User Agent: ${navigator.userAgent}`);
    console.log(`   Device Memory: ${(navigator as any).deviceMemory || 'Unknown'} GB`);
    console.log(`   Hardware Concurrency: ${navigator.hardwareConcurrency || 'Unknown'}`);
    console.log(`   Animations Enabled: ${shouldEnableAnimations()}`);
    console.log('');

    await this.testPageTransition();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    await this.testCardAnimations();
    
    this.printSummary();
  }

  private printSummary(): void {
    console.log('');
    console.log('📋 Performance Test Summary:');
    console.log('================================');
    
    this.testResults.forEach(result => {
      console.log(`${result.testName}:`);
      console.log(`  Average FPS: ${result.averageFPS.toFixed(1)}`);
      console.log(`  Min FPS: ${result.minFPS}`);
      console.log(`  Max FPS: ${result.maxFPS}`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log('');
    });

    const overallAverage = this.testResults.reduce((sum, result) => sum + result.averageFPS, 0) / this.testResults.length;
    const overallMin = Math.min(...this.testResults.map(r => r.minFPS));
    
    console.log(`Overall Performance:`);
    console.log(`  Average FPS: ${overallAverage.toFixed(1)}`);
    console.log(`  Minimum FPS: ${overallMin}`);
    
    if (overallMin < 30) {
      console.warn('⚠️ Performance issues detected. Consider optimizing animations.');
      console.log('💡 Suggestions:');
      console.log('   - Reduce number of simultaneous animations');
      console.log('   - Use transform and opacity properties only');
      console.log('   - Consider disabling animations on low-end devices');
    } else {
      console.log('✅ Animation performance is good!');
    }
  }

  getResults() {
    return this.testResults;
  }
}

// Export a singleton instance for easy use
export const performanceTester = new AnimationPerformanceTester();

// Auto-run tests in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only run if explicitly requested to avoid interfering with normal development
  if (window.location.search.includes('test-animations')) {
    setTimeout(() => {
      performanceTester.runAllTests();
    }, 2000); // Wait for page to load
  }
}