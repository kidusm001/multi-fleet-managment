// SidebarContext has been removed. These are compatibility stubs.

// Sidebar context removed per navigation overhaul. No-op exports remain for safety.
export function SidebarProvider({ children }) {
  return children;
}

export function useSidebar() {
  return { isOpen: false, toggleSidebar: () => {} };
}

export default null;