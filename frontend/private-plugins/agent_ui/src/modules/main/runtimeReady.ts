// Decides the chat surface's ready state from the runtime health probe.
// `undefined` means "no verdict yet — keep the current state".
export const getRuntimeReadyUpdate = ({
  isApproved,
  healthGated,
  runtimeHealthy,
  probeFailed,
}: {
  isApproved: boolean;
  healthGated: boolean;
  runtimeHealthy: boolean | null;
  probeFailed: boolean;
}): boolean | undefined => {
  if (!isApproved) {
    return false;
  }

  // Legacy agents are not health-probed; show their runtime as before.
  if (!healthGated) {
    return true;
  }

  if (runtimeHealthy === true) {
    return true;
  }

  if (runtimeHealthy === false) {
    return false;
  }

  // Probe unavailable (backend mismatch, network) — never hold the UI hostage.
  if (probeFailed) {
    return true;
  }

  return undefined;
};
