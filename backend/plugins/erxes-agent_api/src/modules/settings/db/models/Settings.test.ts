import { model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import {
  IMastraSettings,
  IMastraSettingsDocument,
} from '@/settings/@types/settings';
import { settingsSchema } from '@/settings/db/definitions/settings';
import { loadSettingsClass } from '@/settings/db/models/Settings';

interface SettingsStatics {
  getSettings(): Promise<IMastraSettingsDocument>;
  saveSettings(settings: IMastraSettings): Promise<IMastraSettingsDocument>;
}

interface SettingsModelMocks {
  create: jest.Mock;
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  hydrate: jest.Mock;
  models: IModels;
}

let tenantNumber = 0;

const makeDocument = (
  settings: IMastraSettings,
  id = 'settings-id',
): IMastraSettingsDocument => {
  return { _id: id, ...settings } as IMastraSettingsDocument;
};

const createSettingsModelMocks = (
  getDocument: IMastraSettingsDocument | null,
  savedDocument = getDocument,
): SettingsModelMocks => {
  const create = jest.fn(async (settings: IMastraSettings) =>
    makeDocument(
      {
        erxesApiUrl: 'http://localhost:4000',
        memoryEnabled: true,
        attachmentsEnabled: true,
        backgroundRemovalEnabled: true,
        ...settings,
      },
      'created-settings',
    ),
  );
  const lean = jest.fn(async () => getDocument);
  const findOne = jest.fn(() => ({ lean }));
  const findOneAndUpdate = jest.fn(
    (_filter: Record<string, unknown>, update: { $set?: IMastraSettings }) => {
      const result = Promise.resolve(update.$set ? savedDocument : getDocument);
      return {
        select: jest.fn(() => result),
        then: result.then.bind(result),
      };
    },
  );
  const hydrate = jest.fn((settings: IMastraSettingsDocument) => settings);
  const models = {
    MastraSettings: {
      db: { name: `settings-model-test-${tenantNumber++}` },
      create,
      findOne,
      findOneAndUpdate,
      hydrate,
    },
  } as unknown as IModels;

  return {
    create,
    findOne,
    findOneAndUpdate,
    hydrate,
    models,
  };
};

const getSettingsStatics = (models: IModels): SettingsStatics => {
  return loadSettingsClass(models).statics as unknown as SettingsStatics;
};

describe('MastraSettings model', () => {
  it('uses schema defaults when creating the singleton settings document', async () => {
    const SettingsDefaults = model<IMastraSettingsDocument>(
      'MastraSettingsModelDefaultsTest',
      settingsSchema,
    );
    const defaults = new SettingsDefaults();
    const mocks = createSettingsModelMocks(null);

    const settings = await getSettingsStatics(mocks.models).getSettings();

    expect(defaults.erxesApiUrl).toBe('http://localhost:4000');
    expect(defaults.memoryEnabled).toBe(true);
    expect(defaults.attachmentsEnabled).toBe(true);
    expect(defaults.backgroundRemovalEnabled).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith({});
    expect(settings).toMatchObject({
      erxesApiUrl: 'http://localhost:4000',
      memoryEnabled: true,
      attachmentsEnabled: true,
      backgroundRemovalEnabled: true,
    });
  });

  it('keeps the database URL when legacy environment values are set', async () => {
    const previousUrl = process.env.ERXES_AGENT_ERXES_API_URL;
    const previousToken = process.env.ERXES_AGENT_ERXES_API_TOKEN;
    const previousAgentId = process.env.ERXES_AGENT_DEFAULT_AGENT_ID;
    const stored = makeDocument({
      erxesApiUrl: 'https://tenant.example.com',
      attachmentsEnabled: false,
    });
    const mocks = createSettingsModelMocks(stored);

    process.env.ERXES_AGENT_ERXES_API_URL = 'https://environment.example.com';
    process.env.ERXES_AGENT_ERXES_API_TOKEN = 'legacy-token';
    process.env.ERXES_AGENT_DEFAULT_AGENT_ID = 'legacy-agent';

    try {
      const settings = await getSettingsStatics(mocks.models).getSettings();

      expect(settings.erxesApiUrl).toBe('https://tenant.example.com');
      expect(settings.attachmentsEnabled).toBe(false);
    } finally {
      if (previousUrl === undefined) {
        delete process.env.ERXES_AGENT_ERXES_API_URL;
      } else {
        process.env.ERXES_AGENT_ERXES_API_URL = previousUrl;
      }
      if (previousToken === undefined) {
        delete process.env.ERXES_AGENT_ERXES_API_TOKEN;
      } else {
        process.env.ERXES_AGENT_ERXES_API_TOKEN = previousToken;
      }
      if (previousAgentId === undefined) {
        delete process.env.ERXES_AGENT_DEFAULT_AGENT_ID;
      } else {
        process.env.ERXES_AGENT_DEFAULT_AGENT_ID = previousAgentId;
      }
    }
  });

  it('does not write during a clean uncached settings read', async () => {
    const stored = makeDocument({
      erxesApiUrl: 'https://tenant.example.com',
      attachmentsEnabled: true,
    });
    const mocks = createSettingsModelMocks(stored);

    await getSettingsStatics(mocks.models).getSettings();

    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mocks.hydrate).toHaveBeenCalledWith(stored);
  });

  it('unsets legacy settings when found and on every explicit save', async () => {
    const stored = {
      ...makeDocument({
        erxesApiUrl: 'https://tenant.example.com',
        attachmentsEnabled: true,
      }),
      erxesApiToken: 'legacy-token',
      defaultAgentId: 'legacy-agent',
    } as unknown as IMastraSettingsDocument;
    const mocks = createSettingsModelMocks(stored);
    const settings = getSettingsStatics(mocks.models);

    await settings.getSettings();
    await settings.saveSettings({ attachmentsEnabled: false });

    expect(mocks.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      { _id: 'settings-id' },
      {
        $unset: {
          erxesApiToken: 1,
          defaultAgentId: 1,
        },
      },
      { new: true, strict: false },
    );
    expect(mocks.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      {},
      {
        $set: { attachmentsEnabled: false },
        $unset: {
          erxesApiToken: 1,
          defaultAgentId: 1,
        },
      },
      {
        new: true,
        upsert: true,
        strict: false,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  });

  it('refreshes the tenant cache from the single settings upsert', async () => {
    const initial = makeDocument({
      erxesApiUrl: 'https://tenant.example.com',
      attachmentsEnabled: true,
    });
    const saved = makeDocument({
      erxesApiUrl: 'https://tenant.example.com',
      attachmentsEnabled: false,
    });
    const mocks = createSettingsModelMocks(initial, saved);
    const settings = getSettingsStatics(mocks.models);

    await settings.getSettings();
    await settings.getSettings();
    await settings.saveSettings({ attachmentsEnabled: false });
    const cached = await settings.getSettings();

    expect(cached).toBe(saved);
    expect(mocks.findOne).toHaveBeenCalledTimes(1);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});
