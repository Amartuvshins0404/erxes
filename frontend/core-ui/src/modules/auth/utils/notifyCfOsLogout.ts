const cfOsTargetOrigin = (): string | null => {
  const raw =
    (window as { env?: Record<string, string> }).env?.CF_OS_URL ??
    process.env.CF_OS_URL ??
    '';
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
};

/** Tell an embedded Command iframe to drop its CF OS session before erxes navigates away. */
export const notifyCfOsLogout = () => {
  const targetOrigin = cfOsTargetOrigin();
  if (!targetOrigin) return;

  for (const frame of document.querySelectorAll('iframe')) {
    frame.contentWindow?.postMessage({ type: 'erxes-logout' }, targetOrigin);
  }
};
