/**
 * Enhanced Sidebar Context - Functional Dynamic Layout System
 * Simple, robust implementation with state persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface SidebarState {
  isOpen: boolean;
  isPersistent: boolean;
  isMobile: boolean;
  width: number;
}

interface SidebarContextType {
  state: SidebarState;
  toggle: () => void;
  open: () => void;
  close: () => void;
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
  // Initialize state based on screen size and localStorage
  const getInitialState = (): SidebarState => {
    if (typeof window === 'undefined') {
      return { isOpen: true, isPersistent: true, isMobile: false, width: 250 };
    }

    const isMobile = window.innerWidth < 768;
    const stored = localStorage.getItem('sidebar-persistent');
    const isPersistent = stored ? JSON.parse(stored) : true;
    
    return {
      isOpen: isMobile ? false : isPersistent,
      isPersistent,
      isMobile,
      width: 250,
    };
  };

  const [state, setState] = useState<SidebarState>(getInitialState);

  // Integrated content adaptation - automatically adjusts content when sidebar state changes
  const updateCSSProperties = useCallback((newState: SidebarState) => {
    const root = document.documentElement;
    
    if (newState.isOpen) {
      // Sidebar open: content adapts to remaining space
      root.style.setProperty('--sidebar-width', `${newState.width}px`);
      root.style.setProperty('--content-width', `calc(100vw - ${newState.width}px)`);
      root.setAttribute('data-sidebar', 'open');
      
      // Trigger content reflow for responsive components
      root.style.setProperty('--content-max-width', `calc(100vw - ${newState.width}px)`);
      root.style.setProperty('--grid-container-width', `calc(100vw - ${newState.width}px - 3rem)`);
    } else {
      // Sidebar closed: content expands to full width automatically
      root.style.setProperty('--sidebar-width', '0px');
      root.style.setProperty('--content-width', '100vw');
      root.setAttribute('data-sidebar', 'closed');
      
      // Expand content to full available space
      root.style.setProperty('--content-max-width', '100vw');
      root.style.setProperty('--grid-container-width', 'calc(100vw - 3rem)');
    }
    
    // Dispatch event for components that need to recalculate layouts
    window.dispatchEvent(new CustomEvent('sidebar-layout-change', {
      detail: { isOpen: newState.isOpen, width: newState.width }
    }));
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      
      setState(prev => {
        const newState = {
          ...prev,
          isMobile,
          isOpen: isMobile ? false : prev.isPersistent,
        };
        updateCSSProperties(newState);
        return newState;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCSSProperties]);

  // Update CSS properties when state changes
  useEffect(() => {
    updateCSSProperties(state);
  }, [state, updateCSSProperties]);

  // Control functions
  const toggle = useCallback(() => {
    setState(prev => {
      const newIsOpen = !prev.isOpen;
      const newState = {
        ...prev,
        isOpen: newIsOpen,
        isPersistent: prev.isMobile ? prev.isPersistent : newIsOpen,
      };

      // Save persistent state to localStorage (only for desktop)
      if (!prev.isMobile) {
        localStorage.setItem('sidebar-persistent', JSON.stringify(newIsOpen));
      }

      updateCSSProperties(newState);
      return newState;
    });
  }, [updateCSSProperties]);

  const open = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, isOpen: true };
      if (!prev.isMobile) {
        newState.isPersistent = true;
        localStorage.setItem('sidebar-persistent', JSON.stringify(true));
      }
      updateCSSProperties(newState);
      return newState;
    });
  }, [updateCSSProperties]);

  const close = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, isOpen: false };
      if (!prev.isMobile) {
        newState.isPersistent = false;
        localStorage.setItem('sidebar-persistent', JSON.stringify(false));
      }
      updateCSSProperties(newState);
      return newState;
    });
  }, [updateCSSProperties]);

  const contextValue: SidebarContextType = {
    state,
    toggle,
    open,
    close,
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;