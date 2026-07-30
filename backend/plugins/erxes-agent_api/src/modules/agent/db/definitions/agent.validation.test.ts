import mongoose from 'mongoose';
import { agentSchema } from './agent';

// Agent account identity and visibility live on the canonical core User. This
// suite covers only model/instruction/runtime settings persisted in this
// plugin's profile document.
const AgentModel =
  mongoose.models.AgentValidationTest ||
  mongoose.model('AgentValidationTest', agentSchema);

const expectPath = (doc: Record<string, unknown>, path: string) =>
  AgentModel.validate(doc, [path]);

describe('agentSchema update validation', () => {
  it('rejects an unknown destructive-operations policy', async () => {
    await expect(
      expectPath({ destructiveOps: 'always' }, 'destructiveOps'),
    ).rejects.toThrow();
  });

  it('rejects an out-of-range maxSteps', async () => {
    await expect(expectPath({ maxSteps: 999999999 }, 'maxSteps')).rejects.toThrow();
    await expect(expectPath({ maxSteps: 0 }, 'maxSteps')).rejects.toThrow();
  });

  it('rejects an out-of-range temperature', async () => {
    await expect(expectPath({ temperature: 5 }, 'temperature')).rejects.toThrow();
  });

  it('rejects nulling the required model', async () => {
    await expect(expectPath({ model: null }, 'model')).rejects.toThrow();
  });

  it('rejects over-long instructions', async () => {
    await expect(
      expectPath({ instructions: 'a'.repeat(20001) }, 'instructions'),
    ).rejects.toThrow();
  });

  // Regression: a legitimate update must still pass validation.
  it('accepts a valid profile update', async () => {
    await expect(
      AgentModel.validate(
        {
          instructions: 'Help the support team.',
          provider: 'openai',
          model: 'gpt-4o',
          destructiveOps: 'ask',
          maxSteps: 25,
          temperature: 1,
        },
        [
          'instructions',
          'provider',
          'model',
          'destructiveOps',
          'maxSteps',
          'temperature',
        ],
      ),
    ).resolves.toBeDefined();
  });
});
