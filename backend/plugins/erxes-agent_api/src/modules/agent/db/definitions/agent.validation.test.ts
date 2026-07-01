import mongoose from 'mongoose';
import { agentSchema } from './agent';

// The `mastraAgentUpdate` mutation persists via findOneAndUpdate({ runValidators:
// true }); update validators run the same schema-path validators exercised here,
// so this guards exactly what that flag enforces without booting a database.
const AgentModel =
  mongoose.models.AgentValidationTest ||
  mongoose.model('AgentValidationTest', agentSchema);

const expectPath = (doc: Record<string, unknown>, path: string) =>
  AgentModel.validate(doc, [path]);

describe('agentSchema update validation', () => {
  it('rejects an unknown visibility enum', async () => {
    await expect(expectPath({ visibility: 'superadmin' }, 'visibility')).rejects.toThrow();
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

  it('rejects an over-long name', async () => {
    await expect(expectPath({ name: 'a'.repeat(201) }, 'name')).rejects.toThrow();
  });

  // Regression: a legitimate update must still pass validation.
  it('accepts a valid update', async () => {
    await expect(
      AgentModel.validate(
        { visibility: 'org', maxSteps: 25, temperature: 1, name: 'Support agent', model: 'gpt-4o' },
        ['visibility', 'maxSteps', 'temperature', 'name', 'model'],
      ),
    ).resolves.toBeDefined();
  });
});
