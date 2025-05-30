/**
 * Sidebar Context - Global State Management for Dynamic Layout
 * Phase 1: Core Infrastructure Implementation
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface SidebarState {
  isOpen: boolean;
  width: number;
  isCollapsed: boolean;
  isTransitioning: boolean;
  isVisible: boolean;
}

interface SidebarContextType {
  state: SidebarState;
  toggle: () => void;
  open: () => void;
  close: () => void;
  collapse: () => void;
  expand: () => void;
  setTransitioning: (transitioning: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [state, setState] = useState<SidebarState>({
    isOpen: true,
    width: 250,
    isCollapsed: false,
    isTransitioning: false,
    isVisible: true,
  });

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced state update to prevent layout thrashing
  const debouncedStateUpdate = useCallback((newState: Partial<SidebarState>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setState(prevState => {
        const updatedState = { ...prevState, ...newState };
        
        // Update CSS custom properties on document root
        updateCSSProperties(updatedState);
        
        // Dispatch custom event for components that need to react
        window.dispatchEvent(new CustomEvent('sidebar-state-change', {
          detail: { sidebarState: updatedState }
        }));
        
        return updatedState;
      });
    }, 50);
  }, []);

  // Update CSS custom properties based on sidebar state
  const updateCSSProperties = useCallback((sidebarState: SidebarState) => {
    const root = document.documentElement;
    
    if (!sidebarState.isVisible) {
      root.style.setProperty('--sidebar-width', '0px');
      root.style.setProperty('--available-width', '100vw');
      root.setAttribute('data-sidebar', 'hidden');
    } else if (sidebarState.isCollapsed) {
      root.style.setProperty('--sidebar-width', '60px');
      root.style.setProperty('--available-width', 'calc(100vw - 60px)');
      root.setAttribute('data-sidebar', 'collapsed');
    } else if (sidebarState.isOpen) {
      root.style.setProperty('--sidebar-width', `${sidebarState.width}px`);
      root.style.setProperty('--available-width', `calc(100vw - ${sidebarState.width}px)`);
      root.setAttribute('data-sidebar', 'open');
    } else {
      root.style.setProperty('--sidebar-width', '0px');
      root.style.setProperty('--available-width', '100vw');
      root.setAttribute('data-sidebar', 'closed');
    }
  }, []);

  // Detect actual sidebar DOM element and its properties
  const detectSidebarState = useCallback(() => {
    const sidebarElement = document.querySelector('[data-sidebar-element]') ||
                          document.querySelector('.sidebar') ||
                          document.querySelector('nav[class*="sidebar"]') ||
                          document.querySelector('aside') ||
                          document.querySelector('[class*="nav-"]');

    if (!sidebarElement) {
      debouncedStateUpdate({
        isVisible: false,
        isOpen: false,
        width: 0
      });
      return;
    }

    const rect = sidebarElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(sidebarElement);
    
    const isVisible = computedStyle.display !== 'none' && 
                     computedStyle.visibility !== 'hidden' && 
                     rect.width > 0;
    
    const width = Math.round(rect.width);
    const isCollapsed = isVisible && width > 0 && width < 150;
    const isOpen = isVisible && !isCollapsed;

    debouncedStateUpdate({
      isVisible,
      isOpen,
      isCollapsed,
      width: isVisible ? width : 0
    });
  }, [debouncedStateUpdate]);

  // Setup ResizeObserver for width detection
  useEffect(() => {
    if (!window.ResizeObserver) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      detectSidebarState();
    });

    // Observe document body for any size changes
    resizeObserverRef.current.observe(document.body);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [detectSidebarState]);

  // Setup MutationObserver for class and style changes
  useEffect(() => {
    if (!window.MutationObserver) return;

    mutationObserverRef.current = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'style' ||
             mutation.attributeName === 'data-sidebar')) {
          shouldUpdate = true;
        } else if (mutation.type === 'childList') {
          // Check if sidebar elements were added/removed
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);
          
          if (addedNodes.some(node => (node as Element)?.matches?.('[class*="sidebar"], aside, nav')) ||
              removedNodes.some(node => (node as Element)?.matches?.('[class*="sidebar"], aside, nav'))) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate) {
        detectSidebarState();
      }
    });

    mutationObserverRef.current.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'data-sidebar']
    });

    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [detectSidebarState]);

  // Setup event listeners for common sidebar interactions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-toggle="sidebar"]') ||
          target.matches('.sidebar-toggle') ||
          target.matches('[class*="menu-toggle"]') ||
          target.closest('[data-toggle="sidebar"]') ||
          target.closest('.sidebar-toggle')) {
        setTimeout(detectSidebarState, 100);
      }
    };

    const handleResize = () => {
      detectSidebarState();
    };

    const handleRouteChange = () => {
      setTimeout(detectSidebarState, 100);
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('popstate', handleRouteChange);

    // Initial detection
    detectSidebarState();

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('popstate', handleRouteChange);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [detectSidebarState]);

  // Control functions
  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const open = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true, isCollapsed: false }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const collapse = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: true, isOpen: false }));
  }, []);

  const expand = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: false, isOpen: true }));
  }, []);

  const setTransitioning = useCallback((transitioning: boolean) => {
    setState(prev => ({ ...prev, isTransitioning: transitioning }));
  }, []);

  const contextValue: SidebarContextType = {
    state,
    toggle,
    open,
    close,
    collapse,
    expand,
    setTransitioning,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;