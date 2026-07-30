/**
 * @jest-environment jsdom
 */
import { fireEvent, render } from '@testing-library/react';
import { ToolCallRow } from './ToolCallRow';
import type { ToolPartView } from '~/modules/chat/lib/uiParts';

jest.mock('erxes-ui', () => ({
  cn: (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(' '),
}));

const softErrorCall: ToolPartView = {
  toolCallId: 'c1',
  toolName: 'do_thing',
  state: 'output-available',
  input: { q: 'x' },
  output: { error: true, message: 'boom happened' },
  errorText: undefined,
  isError: true,
  pending: false,
};

describe('ToolCallRow soft-error branch', () => {
  // Regression for EDGEART-001 follow-up: a soft {error:true} output has no
  // dedicated errorText, so the expanded Response must fall back to the output
  // payload — not render an empty '—' that hides why the call failed.
  it('shows the output payload when isError but no errorText', () => {
    const { container, getByRole } = render(<ToolCallRow call={softErrorCall} />);
    // The row starts collapsed; expand it to reveal the Response body.
    fireEvent.click(getByRole('button'));

    expect(container.textContent).toContain('boom happened');
    expect(container.textContent).not.toContain('—');
  });

  it('still prefers errorText for a hard output-error row', () => {
    const hardError: ToolPartView = {
      ...softErrorCall,
      state: 'output-error',
      output: { error: true, message: 'ignored' },
      errorText: 'hard failure text',
    };
    const { container, getByRole } = render(<ToolCallRow call={hardError} />);
    fireEvent.click(getByRole('button'));

    expect(container.textContent).toContain('hard failure text');
    expect(container.textContent).not.toContain('ignored');
  });
});
