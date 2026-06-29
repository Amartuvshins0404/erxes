import { useEffect, useRef } from 'react';
import { Sidebar } from 'erxes-ui';

// Collapses the global app sidebar while an agent chat is open so the
// conversation (and voice mode) gets the full width, and restores the user's
// prior state when they leave the agent view. Mounted only when an agent is
// selected, so the useSidebar() context lookup never runs on provider-less
// routes (e.g. preview). Renders nothing.

export const ChatSidebarCollapse = () => {
  const { open, setOpen } = Sidebar.useSidebar();
  const wasOpen = useRef(open);

  useEffect(() => {
    wasOpen.current = open;
    setOpen(false);
    return () => setOpen(wasOpen.current);
    // Mount/unmount only: capture state on enter, restore on leave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
