import { isWorkspaceMemoryEnabled } from '../config';

describe('workspace memory config', () => {
  it('defaults to enabled for existing settings documents', () => {
    expect(isWorkspaceMemoryEnabled(undefined)).toBe(true);
    expect(isWorkspaceMemoryEnabled({})).toBe(true);
    expect(isWorkspaceMemoryEnabled({ memoryEnabled: null })).toBe(true);
  });

  it('uses the persisted General Settings switch', () => {
    expect(isWorkspaceMemoryEnabled({ memoryEnabled: true })).toBe(true);
    expect(isWorkspaceMemoryEnabled({ memoryEnabled: false })).toBe(false);
  });
});
