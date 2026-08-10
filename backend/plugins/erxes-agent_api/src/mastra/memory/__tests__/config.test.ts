import { isAdvancedMemoryEnabled } from '../config';

describe('advanced-memory config', () => {
  // ── Feature flag (AM-FLAG-1..4) ──────────────────────────────────────────
  describe('isAdvancedMemoryEnabled', () => {
    it('AM-FLAG-1: defaults to enabled when unset', () => {
      expect(isAdvancedMemoryEnabled({})).toBe(true);
    });

    it('AM-FLAG-2: false only for exact "disable"', () => {
      expect(isAdvancedMemoryEnabled({ ERXES_AGENT_MEMORY: 'disable' })).toBe(
        false,
      );
    });

    it('AM-FLAG-3: other values leave it enabled', () => {
      for (const v of ['enable', 'true', '1', 'on', 'DISABLE', 'disabled', 'no']) {
        expect(isAdvancedMemoryEnabled({ ERXES_AGENT_MEMORY: v })).toBe(true);
      }
    });

    it('AM-FLAG-4: trims surrounding whitespace', () => {
      expect(
        isAdvancedMemoryEnabled({ ERXES_AGENT_MEMORY: '  disable  ' }),
      ).toBe(false);
    });
  });
});
