'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  mounted: boolean;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  isMobileOpen: false,
  mounted: false,
  toggleCollapsed: () => {},
  openMobile: () => {},
  closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    } else {
      setIsCollapsed(window.innerWidth < 1024);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, mounted, toggleCollapsed, openMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}
