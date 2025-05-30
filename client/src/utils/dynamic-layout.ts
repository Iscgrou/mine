/**
 * Dynamic Layout Management System
 * Handles sidebar state detection and layout adjustments
 */

export class DynamicLayoutManager {
  private static instance: DynamicLayoutManager;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): DynamicLayoutManager {
    if (!DynamicLayoutManager.instance) {
      DynamicLayoutManager.instance = new DynamicLayoutManager();
    }
    return DynamicLayoutManager.instance;
  }

  private init() {
    this.detectSidebarState();
    this.setupResizeObserver();
    this.setupMutationObserver();
    this.setupEventListeners();
  }

  private detectSidebarState() {
    const sidebar = document.querySelector('[data-sidebar]') || 
                   document.querySelector('.sidebar') ||
                   document.querySelector('nav[class*="sidebar"]') ||
                   document.querySelector('[class*="nav"]');

    if (sidebar) {
      const isVisible = this.isSidebarVisible(sidebar as HTMLElement);
      const isCollapsed = this.isSidebarCollapsed(sidebar as HTMLElement);
      
      let state = 'hidden';
      if (isVisible && !isCollapsed) {
        state = 'open';
      } else if (isVisible && isCollapsed) {
        state = 'closed';
      }

      this.updateLayoutState(state);
    } else {
      this.updateLayoutState('hidden');
    }
  }

  private isSidebarVisible(sidebar: HTMLElement): boolean {
    const styles = window.getComputedStyle(sidebar);
    return styles.display !== 'none' && 
           styles.visibility !== 'hidden' && 
           parseInt(styles.width) > 0;
  }

  private isSidebarCollapsed(sidebar: HTMLElement): boolean {
    const styles = window.getComputedStyle(sidebar);
    const width = parseInt(styles.width);
    return width > 0 && width < 150;
  }

  private updateLayoutState(state: 'open' | 'closed' | 'hidden') {
    document.documentElement.setAttribute('data-sidebar', state as string);
    
    window.dispatchEvent(new CustomEvent('layout-state-change', {
      detail: { sidebarState: state }
    }));
  }

  private setupResizeObserver() {
    if (!window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      clearTimeout((this as any).resizeTimeout);
      (this as any).resizeTimeout = setTimeout(() => {
        this.detectSidebarState();
      }, 100);
    });

    this.resizeObserver.observe(document.body);
  }

  private setupMutationObserver() {
    if (!window.MutationObserver) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'style' ||
             mutation.attributeName === 'data-sidebar')) {
          shouldUpdate = true;
        } else if (mutation.type === 'childList') {
          shouldUpdate = true;
        }
      });

      if (shouldUpdate) {
        setTimeout(() => this.detectSidebarState(), 50);
      }
    });

    this.mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'data-sidebar']
    });
  }

  private setupEventListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-toggle="sidebar"]') ||
          target.matches('.sidebar-toggle') ||
          target.matches('[class*="menu"]') ||
          target.closest('[data-toggle="sidebar"]')) {
        setTimeout(() => this.detectSidebarState(), 100);
      }
    });

    window.addEventListener('popstate', () => {
      setTimeout(() => this.detectSidebarState(), 100);
    });

    window.addEventListener('resize', () => {
      clearTimeout((this as any).resizeTimeout);
      (this as any).resizeTimeout = setTimeout(() => {
        this.detectSidebarState();
      }, 100);
    });
  }

  public refresh() {
    this.detectSidebarState();
  }

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      DynamicLayoutManager.getInstance();
    });
  } else {
    DynamicLayoutManager.getInstance();
  }
}

export default DynamicLayoutManager;