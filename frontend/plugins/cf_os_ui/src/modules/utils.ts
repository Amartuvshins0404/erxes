export const getCommandUrl = (): string => {
  return window.env?.CF_OS_URL ?? process.env.CF_OS_URL ?? '';
};
