import { VOICE_BREVITY_SYSTEM, buildTurnSystem } from '../voicePrompt';

describe('buildTurnSystem', () => {
  it('returns undefined for a typed chat turn (no voice, no skill)', () => {
    expect(buildTurnSystem({ voiceMode: false })).toBeUndefined();
    expect(
      buildTurnSystem({ voiceMode: false, activeSkillInstructions: '' }),
    ).toBeUndefined();
  });

  it('injects the brevity directive only for voice-originated turns', () => {
    const voice = buildTurnSystem({ voiceMode: true });
    expect(voice).toBe(VOICE_BREVITY_SYSTEM);
    expect(buildTurnSystem({ voiceMode: false })).toBeUndefined();
  });

  it('never leaks the brevity directive into a typed turn that has a skill', () => {
    const skill = 'SKILL: do the thing';
    const system = buildTurnSystem({
      voiceMode: false,
      activeSkillInstructions: skill,
    });
    expect(system).toBe(skill);
    expect(system).not.toContain('read aloud');
  });

  it('combines the brevity directive with slash-activated skill instructions', () => {
    const skill = 'SKILL: do the thing';
    const system = buildTurnSystem({
      voiceMode: true,
      activeSkillInstructions: skill,
    });
    expect(system).toContain(VOICE_BREVITY_SYSTEM);
    expect(system).toContain(skill);
    // Brevity leads so the spoken-style constraint frames the skill block.
    expect(system?.indexOf(VOICE_BREVITY_SYSTEM)).toBeLessThan(
      system?.indexOf(skill) ?? -1,
    );
  });

  it('asks for spoken-style brevity and bans markdown', () => {
    expect(VOICE_BREVITY_SYSTEM).toMatch(/read aloud/i);
    expect(VOICE_BREVITY_SYSTEM).toMatch(/markdown/i);
    expect(VOICE_BREVITY_SYSTEM).toMatch(/one or two sentences/i);
  });

  it('asks to lead with a short first sentence so first-audio fires fast', () => {
    expect(VOICE_BREVITY_SYSTEM).toMatch(/first sentence/i);
    expect(VOICE_BREVITY_SYSTEM).toMatch(/immediately/i);
  });

  it('tells the model to produce speakable Cyrillic (transliterate, spell out)', () => {
    expect(VOICE_BREVITY_SYSTEM).toMatch(/cyrillic/i);
    expect(VOICE_BREVITY_SYSTEM).toMatch(/transliterat/i);
    expect(VOICE_BREVITY_SYSTEM).toMatch(/spell out/i);
  });

  it('keeps the Cyrillic instruction out of the typed-chat path', () => {
    const typed = buildTurnSystem({
      voiceMode: false,
      activeSkillInstructions: 'SKILL: do the thing',
    });
    expect(typed).not.toMatch(/cyrillic/i);
  });
});
