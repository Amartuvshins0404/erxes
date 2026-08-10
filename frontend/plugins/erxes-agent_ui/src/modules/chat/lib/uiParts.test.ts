import { asToolPart } from './uiParts';
import type { AgentUIMessage } from '~/modules/chat/types';

type MessagePart = AgentUIMessage['parts'][number];

const toolPart = (overrides: Record<string, unknown>): MessagePart =>
  ({ type: 'dynamic-tool', toolName: 'do_thing', ...overrides } as MessagePart);

describe('asToolPart isError', () => {
  it('flags a hard output-error state', () => {
    const view = asToolPart(
      toolPart({ state: 'output-error', errorText: 'boom' }),
    );
    expect(view?.isError).toBe(true);
  });

  // A tool that catches its own failure returns `{error:true}` with a normal
  // output-available state. Artifact failure cards still need to show it.
  it('flags a soft {error:true} output on an output-available state', () => {
    const view = asToolPart(
      toolPart({
        state: 'output-available',
        output: { error: true, message: 'nope' },
      }),
    );
    expect(view?.isError).toBe(true);
  });

  it('does not flag a normal successful output', () => {
    const view = asToolPart(
      toolPart({
        state: 'output-available',
        output: { ok: true, error: false },
      }),
    );
    expect(view?.isError).toBe(false);
  });

  it('does not flag a non-object output', () => {
    const view = asToolPart(
      toolPart({ state: 'output-available', output: 'plain string result' }),
    );
    expect(view?.isError).toBe(false);
  });
});
