// ---------------------------------------------------------------------------
// The canonical Chimege voice catalog. Single source of truth shared by the
// TTS route's allowlist, the save-mutation validator, and (via GraphQL) the
// settings UI's voice selector. Pure data — no I/O.
// ---------------------------------------------------------------------------

export interface ChimegeVoice {
  id: string;
  // Human-readable label for the settings selector, e.g. "Female 3 (v2)".
  label: string;
  gender: 'female' | 'male';
}

export const CHIMEGE_VOICES: ChimegeVoice[] = [
  { id: 'FEMALE1', label: 'Female 1', gender: 'female' },
  { id: 'FEMALE1v2', label: 'Female 1 (v2)', gender: 'female' },
  { id: 'FEMALE2v2', label: 'Female 2 (v2)', gender: 'female' },
  { id: 'FEMALE3v2', label: 'Female 3 (v2)', gender: 'female' },
  { id: 'FEMALE4v2', label: 'Female 4 (v2)', gender: 'female' },
  { id: 'FEMALE5v2', label: 'Female 5 (v2)', gender: 'female' },
  { id: 'MALE1', label: 'Male 1', gender: 'male' },
  { id: 'MALE1v2', label: 'Male 1 (v2)', gender: 'male' },
  { id: 'MALE2v2', label: 'Male 2 (v2)', gender: 'male' },
  { id: 'MALE3v2', label: 'Male 3 (v2)', gender: 'male' },
  { id: 'MALE4v2', label: 'Male 4 (v2)', gender: 'male' },
];

// Fast membership checks for validation/gating.
export const CHIMEGE_VOICE_IDS = new Set(CHIMEGE_VOICES.map((v) => v.id));

// Chimege's allowed TTS sample rates.
export const CHIMEGE_SAMPLE_RATES = new Set([8000, 16000, 22050]);
