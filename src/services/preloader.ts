class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private preloadQueue: string[] = [];

  // Preload critical images
  preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => this.preloadImage(url))
    );
  }

  private preloadImage(url: string): Promise<void> {
    if (this.preloadedResources.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(url);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Preload critical routes
  async preloadRoute(routePath: string): Promise<void> {
    try {
      // Dynamic import to trigger route preloading
      await import(`../pages/${routePath}.tsx`);
    } catch (error) {
      console.warn(`Failed to preload route: ${routePath}`, error);
    }
  }

  // Preload critical routes in background.
  // Deliberately deferred until first user interaction (or a few seconds after
  // full page load) so these chunk downloads never appear in the critical
  // request chain / compete with LCP. Users only navigate after interacting,
  // so the chunks are still warm by the time they're needed.
  preloadCriticalRoutes(): void {
    const criticalRoutes = [
      'Home',
      'Category',
      'Product',
      'Cart'
    ];

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      const run = () => {
        criticalRoutes.forEach(route => {
          this.preloadRoute(route);
        });
      };
      if ('requestIdleCallback' in window) {
        requestIdleCallback(run, { timeout: 4000 });
      } else {
        setTimeout(run, 200);
      }
    };

    const arm = () => {
      // First interaction = strongest signal navigation is coming
      ['pointerdown', 'keydown', 'touchstart', 'mouseover', 'scroll'].forEach(evt => {
        window.addEventListener(evt, start, { once: true, passive: true });
      });
      // Fallback: idle users still get warmed chunks well after load
      setTimeout(start, 6000);
    };

    if (document.readyState === 'complete') {
      arm();
    } else {
      window.addEventListener('load', arm, { once: true });
    }
  }

  // Preload fonts
  preloadFonts(fontUrls: string[]): void {
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Preload critical API data
  async preloadApiData(apiCalls: (() => Promise<any>)[]): Promise<void> {
    try {
      await Promise.allSettled(apiCalls.map(call => call()));
    } catch (error) {
      console.warn('Failed to preload API data:', error);
    }
  }

  // Get preload status
  isPreloaded(url: string): boolean {
    return this.preloadedResources.has(url);
  }

  // Clear preload cache
  clearCache(): void {
    this.preloadedResources.clear();
    this.preloadQueue = [];
  }
}

export const resourcePreloader = new ResourcePreloader();

// Critical images to preload (keep tiny — these download on every page load)
export const CRITICAL_IMAGES = [
  '/logo3.webp',
  // Add other critical images here
];

// Critical routes to preload
export const CRITICAL_ROUTES = [
  'Home',
  'Category',
  'Product',
  'Cart'
];

export default resourcePreloader;
