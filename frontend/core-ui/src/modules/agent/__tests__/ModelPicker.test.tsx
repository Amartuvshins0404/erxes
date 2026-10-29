/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { MutableRefObject, Ref } from 'react';
import { ModelPicker, type IModelPickerProps } from '../components/ModelPicker';
import type { IAgentsProviderCatalog } from '../hooks/useAgentsModels';
import { agentRecentModelsState } from '../states/agentRecentModelsState';

// Use the real erxes-ui/CMDK/Radix controls to cover search and keyboard behavior.
// The installed merge-refs package is ESM-only; Jest runs these controls in CJS.
jest.mock('react-merge-refs', () => ({
  mergeRefs:
    <T,>(refs: Ref<T>[]) =>
    (node: T | null) => {
      for (const ref of refs) {
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as MutableRefObject<T | null>).current = node;
      }
    },
}));
jest.mock('erxes-ui', () => ({
  ...jest.requireActual('../../../../../libs/erxes-ui/src/components/button'),
  ...jest.requireActual('../../../../../libs/erxes-ui/src/components/combobox'),
  ...jest.requireActual('../../../../../libs/erxes-ui/src/components/command'),
  ...jest.requireActual('../../../../../libs/erxes-ui/src/components/popover'),
  ...jest.requireActual('../../../../../libs/erxes-ui/src/components/spinner'),
}));
jest.mock('erxes-ui/lib', () =>
  jest.requireActual('../../../../../libs/erxes-ui/src/lib/utils'),
);
jest.mock('erxes-ui/lib/utils', () =>
  jest.requireActual('../../../../../libs/erxes-ui/src/lib/utils'),
);

const originalObserver = global.ResizeObserver;
const originalScroll = HTMLElement.prototype.scrollIntoView;
beforeAll(() => {
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
  HTMLElement.prototype.scrollIntoView = jest.fn();
});
afterAll(() => {
  global.ResizeObserver = originalObserver;
  HTMLElement.prototype.scrollIntoView = originalScroll;
});

const option = (id: string, recommended = false) => ({
  id,
  family: id.startsWith('gpt-6') ? 'gpt-6' : '',
  recommended,
});
const connection = (
  connectionId: string,
  connectionName: string,
  provider: string,
  models: ReturnType<typeof option>[],
  extra: Partial<IAgentsProviderCatalog> = {},
): IAgentsProviderCatalog => ({
  connectionId,
  connectionName,
  provider,
  scope: 'workspace',
  isDefault: false,
  models,
  ...extra,
});
const openaiModels = [
  option('gpt-6', true),
  option('gpt-6-luna', true),
  option('gpt-6-mini', true),
  ...Array.from({ length: 132 }, (_, i) => option(`catalog-model-${i}`)),
];
const openaiConnection = (extra: Partial<IAgentsProviderCatalog> = {}) =>
  connection('conn-openai', 'Team OpenAI', 'openai', openaiModels, {
    isDefault: true,
    ...extra,
  });
const kimiConnection = (extra: Partial<IAgentsProviderCatalog> = {}) =>
  connection('conn-kimi', 'My Kimi', 'kimi', [option('kimi-k3', true)], {
    scope: 'personal',
    ...extra,
  });
const modelsOf = (
  providerModels: IAgentsProviderCatalog[],
): IModelPickerProps['models'] => ({
  loading: false,
  error: undefined,
  providerModels,
});
const baseProps: IModelPickerProps = {
  value: 'conn-openai|gpt-6-luna',
  onChange: jest.fn(),
  models: modelsOf([openaiConnection(), kimiConnection()]),
};
const setup = (
  overrides: Partial<IModelPickerProps> = {},
  recent: string[] = [],
) => {
  const store = createStore();
  store.set(agentRecentModelsState, recent);
  const onChange = jest.fn();
  render(
    <Provider store={store}>
      <ModelPicker {...baseProps} {...overrides} onChange={onChange} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Model' }));
  return { store, onChange };
};

const chooseConnection = (name = 'Team OpenAI') =>
  fireEvent.click(screen.getByRole('option', { name: new RegExp(`^${name}`) }));
const optionNames = () =>
  screen.getAllByRole('option').map((item) => item.textContent);

it('opens with connections, then shows the connection’s recommended models immediately', async () => {
  const { onChange } = setup({ value: '' });
  expect(screen.getByText('Connection')).toBeTruthy();
  expect(screen.getAllByRole('option')).toHaveLength(3);
  expect(screen.queryByText('Recommended')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Browse all models' }),
  ).toBeNull();
  chooseConnection();
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByText('Recommended')).toBeTruthy();
  expect(optionNames()).toEqual(['gpt-6', 'gpt-6-luna', 'gpt-6-mini']);
  expect(screen.queryByRole('option', { name: /kimi-k3/ })).toBeNull();
  await waitFor(() =>
    expect(
      screen
        .getByRole('option', { name: /^gpt-6$/ })
        .getAttribute('aria-selected'),
    ).toBe('true'),
  );
});

it('names the connection an empty selection runs and marks personal ones', () => {
  setup({ value: '' });
  const trigger = screen.getByRole('combobox', { name: 'Model' });
  expect(trigger.textContent).toBe('Team OpenAI');
  expect(trigger.getAttribute('title')).toBe('Team OpenAI (saved default)');
  expect(
    screen.getByRole('option', { name: /^Team OpenAI/ }).textContent,
  ).toContain('In use');
  expect(
    screen.getByRole('option', { name: /^My Kimi/ }).textContent,
  ).toContain('Personal');
  expect(
    screen.getByRole('option', { name: /Use saved default/ }).textContent,
  ).toContain('Team OpenAI');
});

it('follows the explicit default rather than the first connection', () => {
  setup({
    value: '',
    models: modelsOf([
      openaiConnection({ isDefault: false }),
      kimiConnection({ isDefault: true }),
    ]),
  });
  const trigger = screen.getByRole('combobox', { name: 'Model' });
  expect(trigger.textContent).toBe('My Kimi');
  expect(
    screen.getByRole('option', { name: /^My Kimi/ }).textContent,
  ).toContain('In use');
  expect(
    screen.getByRole('option', { name: /^Team OpenAI/ }).textContent,
  ).not.toContain('In use');
});

it('selects a connection then an exact model with the keyboard', async () => {
  const { onChange, store } = setup();
  const menu = document.activeElement;
  if (!menu) throw new Error('Connection menu was not focused');
  expect(menu.hasAttribute('cmdk-root')).toBe(true);
  fireEvent.keyDown(menu, { key: 'Enter' });
  expect(onChange).not.toHaveBeenCalled();
  const search = screen.getByRole('combobox', { name: 'Search models' });
  fireEvent.change(search, { target: { value: 'catalog-model-131' } });
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
  expect(screen.getByText('Others')).toBeTruthy();
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  fireEvent.keyDown(search, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledWith('conn-openai|catalog-model-131');
  expect(store.get(agentRecentModelsState)[0]).toBe(
    'conn-openai|catalog-model-131',
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('browses the selected connection’s complete usable catalog in groups', () => {
  setup();
  chooseConnection();
  fireEvent.click(screen.getByRole('button', { name: 'Browse all models' }));
  expect(screen.getAllByRole('option')).toHaveLength(135);
  expect(screen.getByText('Recommended')).toBeTruthy();
  expect(screen.getByText('Others')).toBeTruthy();
  expect(screen.queryByRole('option', { name: /kimi-k3/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
  expect(screen.getAllByRole('option')).toHaveLength(3);
});

it('can go back and switch connections without changing the selection', () => {
  const { onChange } = setup();
  chooseConnection();
  fireEvent.click(screen.getByRole('button', { name: 'Back to connections' }));
  chooseConnection('My Kimi');
  expect(screen.getAllByRole('option')).toHaveLength(1);
  expect(screen.getByRole('option', { name: /kimi-k3/ })).toBeTruthy();
  expect(screen.queryByRole('option', { name: /gpt-6-luna/ })).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

it('selects the model by connection id so two keys of one provider stay apart', () => {
  const { onChange } = setup({
    models: modelsOf([
      openaiConnection(),
      connection('conn-openai-2', 'Backup OpenAI', 'openai', [
        option('gpt-6-mini', true),
      ]),
    ]),
  });
  chooseConnection('Backup OpenAI');
  fireEvent.click(screen.getByRole('option', { name: /gpt-6-mini/ }));
  expect(onChange).toHaveBeenCalledWith('conn-openai-2|gpt-6-mini');
});

it('lists bounded recent choices above recommendations and excludes unavailable models', () => {
  setup({}, [
    'conn-openai|catalog-model-4',
    'conn-kimi|kimi-k3',
    'removed|private',
    'conn-openai|missing',
    'conn-openai|gpt-6-mini',
    'conn-openai|catalog-model-3',
    'conn-openai|catalog-model-2',
    'conn-openai|catalog-model-1',
  ]);
  chooseConnection();
  expect(screen.getByText('Recent')).toBeTruthy();
  expect(optionNames()).toEqual([
    'catalog-model-4',
    'catalog-model-3',
    'catalog-model-2',
    'gpt-6',
    'gpt-6-luna',
    'gpt-6-mini',
  ]);
  expect(screen.queryByText('private')).toBeNull();
  expect(screen.queryByText('missing')).toBeNull();
});

it('explains a connection whose listing failed', () => {
  setup({
    value: '',
    models: modelsOf([
      openaiConnection({
        models: [],
        error: 'Failed to list models for "openai" (401). Check your API key.',
      }),
      kimiConnection(),
    ]),
  });
  expect(
    screen.getByRole('option', { name: /^Team OpenAI/ }).textContent,
  ).toContain('In use');
  chooseConnection();
  expect(screen.getByRole('status').textContent).toContain(
    'Check your API key',
  );
  expect(
    screen.queryByRole('button', { name: 'Browse all models' }),
  ).toBeNull();
});

it('flags an unavailable connection that is not in use', () => {
  setup({
    models: modelsOf([
      openaiConnection(),
      kimiConnection({ models: [], error: 'Could not reach kimi.' }),
    ]),
  });
  expect(
    screen.getByRole('option', { name: /^My Kimi/ }).textContent,
  ).toContain('Unavailable');
});

it('shows an empty state when a connection lists no usable models', () => {
  setup({
    value: '',
    models: modelsOf([openaiConnection({ models: [] })]),
  });
  chooseConnection();
  expect(screen.getByRole('status').textContent).toContain(
    'No usable chat models',
  );
  expect(screen.queryAllByRole('option')).toHaveLength(0);
});

it('keeps the saved default usable when discovery is unavailable', () => {
  const { onChange } = setup({
    models: { loading: false, error: 'provider failure', providerModels: [] },
  });
  fireEvent.click(screen.getByRole('option', { name: /Use saved default/ }));
  expect(onChange).toHaveBeenCalledWith('');
});

it('makes a connection the default and reports it through the callback', async () => {
  const onSetDefault = jest.fn(async () => undefined);
  setup({ onSetDefault });
  chooseConnection('My Kimi');
  fireEvent.click(screen.getByRole('button', { name: 'Make default' }));
  await waitFor(() => expect(onSetDefault).toHaveBeenCalledWith('conn-kimi'));
});

it('shows no make-default action on the connection that is already default', () => {
  setup({ onSetDefault: jest.fn(async () => undefined) });
  chooseConnection();
  expect(screen.queryByRole('button', { name: 'Make default' })).toBeNull();
});

it('scopes model search and always reopens at connection selection', async () => {
  setup();
  chooseConnection();
  const search = screen.getByRole('combobox', { name: 'Search models' });
  fireEvent.change(search, { target: { value: 'kimi-k3' } });
  expect(screen.getByRole('status').textContent).toContain(
    'No matching models',
  );
  fireEvent.keyDown(search, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('combobox', { name: 'Model' }));
  expect(screen.queryByRole('combobox', { name: 'Search models' })).toBeNull();
  expect(screen.getByText('Connection')).toBeTruthy();
  expect(screen.getAllByRole('option')).toHaveLength(3);
});

describe('typed model ids', () => {
  const forbidden = modelsOf([
    openaiConnection({
      models: [],
      error:
        "This OpenAI key can't list models (missing Models: Read permission). Type a model id to use it, or allow Models: Read for the key.",
    }),
  ]);
  const typeModel = (text: string) =>
    fireEvent.change(screen.getByRole('combobox', { name: 'Search models' }), {
      target: { value: text },
    });

  it('verifies and selects a model the key cannot list', async () => {
    const onVerifyModel = jest.fn(async () => null);
    const { onChange, store } = setup({
      value: '',
      models: forbidden,
      onVerifyModel,
    });
    chooseConnection();
    expect(screen.getByRole('status').textContent).toContain(
      'missing Models: Read permission',
    );

    typeModel(' gpt-5.6-luna ');
    fireEvent.click(screen.getByRole('option', { name: 'Use "gpt-5.6-luna"' }));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('conn-openai|gpt-5.6-luna'),
    );
    expect(onVerifyModel).toHaveBeenCalledWith('conn-openai', 'gpt-5.6-luna');
    expect(store.get(agentRecentModelsState)[0]).toBe(
      'conn-openai|gpt-5.6-luna',
    );
  });

  it('shows why a typed model was rejected and keeps the selection', async () => {
    const onVerifyModel = jest.fn(
      async () => 'OpenAI rejected "gpt-7" (404): The model does not exist.',
    );
    const { onChange } = setup({ models: forbidden, onVerifyModel });
    chooseConnection();
    typeModel('gpt-7');
    fireEvent.click(screen.getByRole('option', { name: 'Use "gpt-7"' }));

    expect(
      await screen.findByText(
        'OpenAI rejected "gpt-7" (404): The model does not exist.',
      ),
    ).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    typeModel('gpt-7-mini');
    expect(screen.queryByText(/rejected "gpt-7"/)).toBeNull();
  });

  it.each([
    [
      'the picker closed',
      () => fireEvent.keyDown(document.body, { key: 'Escape' }),
      [],
    ],
    [
      'another choice was picked',
      () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Back to connections' }),
        );
        fireEvent.click(
          screen.getByRole('option', { name: /Use saved default/ }),
        );
      },
      [['']],
    ],
    ['the search text changed', () => typeModel('gpt-5.6-luna-mini'), []],
  ])(
    'ignores a model check that resolves after %s',
    async (_case, interrupt, calls) => {
      let resolveCheck: (error: string | null) => void = () => undefined;
      const onVerifyModel = jest.fn(
        () =>
          new Promise<string | null>((resolve) => {
            resolveCheck = resolve;
          }),
      );
      const { onChange } = setup({ models: forbidden, onVerifyModel });
      chooseConnection();
      typeModel('gpt-5.6-luna');
      fireEvent.click(
        screen.getByRole('option', { name: 'Use "gpt-5.6-luna"' }),
      );
      expect(onVerifyModel).toHaveBeenCalledTimes(1);

      interrupt();
      await act(async () => resolveCheck(null));

      expect(onChange.mock.calls).toEqual(calls);
    },
  );

  it('offers recent picks when the connection cannot list models', () => {
    setup({ value: '', models: forbidden }, [
      'conn-openai|gpt-5.6-luna',
      'conn-kimi|kimi-k3',
    ]);
    chooseConnection();
    expect(screen.getByText('Recent')).toBeTruthy();
    expect(optionNames()).toEqual(['gpt-5.6-luna']);
  });

  it('keeps a verified unlisted selection visible next to the catalog', () => {
    setup({ value: 'conn-openai|gpt-6-luna-preview' });
    chooseConnection();
    expect(optionNames()[0]).toBe('gpt-6-luna-preview');
  });

  it('only offers custom ids that are unlisted, valid and verifiable', () => {
    setup({ onVerifyModel: jest.fn(async () => null) });
    chooseConnection();
    typeModel('gpt-6-luna');
    expect(screen.queryByRole('option', { name: /^Use "/ })).toBeNull();
    typeModel('gpt 6');
    expect(screen.queryByRole('option', { name: /^Use "/ })).toBeNull();
    typeModel('gpt-6-nano');
    expect(
      screen.getByRole('option', { name: 'Use "gpt-6-nano"' }),
    ).toBeTruthy();
  });

  it('offers no custom ids without a verifier', () => {
    setup({ models: forbidden });
    chooseConnection();
    typeModel('gpt-6-nano');
    expect(screen.queryByRole('option', { name: /^Use "/ })).toBeNull();
  });
});

describe('access checks for listed models', () => {
  it('checks a listed model the user has not used before', async () => {
    const onVerifyModel = jest.fn(
      async () =>
        'OpenAI rejected "gpt-6" (403): Project does not have access to model gpt-6.',
    );
    const { onChange } = setup({ onVerifyModel });
    chooseConnection();
    fireEvent.click(screen.getByRole('option', { name: /^gpt-6$/ }));

    expect(
      await screen.findByText(/Project does not have access to model gpt-6/),
    ).toBeTruthy();
    expect(onVerifyModel).toHaveBeenCalledWith('conn-openai', 'gpt-6');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects a listed model once the connection accepts it', async () => {
    const onVerifyModel = jest.fn(async () => null);
    const { onChange } = setup({ onVerifyModel });
    chooseConnection();
    fireEvent.click(screen.getByRole('option', { name: /^gpt-6-mini$/ }));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith('conn-openai|gpt-6-mini'),
    );
  });

  it('skips the check for current and recent selections', () => {
    const onVerifyModel = jest.fn(async () => null);
    const { onChange } = setup({ value: '', onVerifyModel }, [
      'conn-openai|gpt-6-mini',
    ]);
    chooseConnection();
    fireEvent.click(screen.getByRole('option', { name: /^gpt-6-mini$/ }));
    expect(onChange).toHaveBeenCalledWith('conn-openai|gpt-6-mini');
    expect(onVerifyModel).not.toHaveBeenCalled();
  });
});

describe('display names', () => {
  const named = modelsOf([
    connection('conn-openai', 'Team OpenAI', 'openai', [
      { ...option('gpt-6-luna', true), name: 'GPT-6 Luna' },
      option('gpt-6', true),
    ]),
  ]);

  it('titles a model with its name and shows the id muted', () => {
    setup({ value: 'conn-openai|gpt-6-luna', models: named });
    expect(screen.getByRole('combobox', { name: 'Model' }).textContent).toBe(
      'GPT-6 Luna',
    );
    chooseConnection();
    const row = screen.getByRole('option', { name: /^GPT-6 Luna/ });
    expect(row.querySelector('.text-muted-foreground')?.textContent).toBe(
      'gpt-6-luna',
    );
    expect(screen.getByRole('option', { name: /^gpt-6$/ }).textContent).toBe(
      'gpt-6',
    );
  });

  it('finds a model by its name or its id', () => {
    setup({ models: named });
    chooseConnection();
    const search = screen.getByRole('combobox', { name: 'Search models' });
    fireEvent.change(search, { target: { value: 'luna' } });
    expect(optionNames()).toEqual(['GPT-6 Lunagpt-6-luna']);
    fireEvent.change(search, { target: { value: 'GPT-6 L' } });
    expect(optionNames()).toEqual(['GPT-6 Lunagpt-6-luna']);
  });
});
