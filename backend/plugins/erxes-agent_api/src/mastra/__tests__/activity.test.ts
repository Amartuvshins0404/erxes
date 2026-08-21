import { createActivityTracker } from '../activity';

describe('createActivityTracker', () => {
  it('emits a deterministic tool status without a model callback', () => {
    const emit = jest.fn();
    const toolSignal = jest.fn(() => 'Searching customers');
    const tracker = createActivityTracker({ emit, toolSignal });

    tracker.onToolCall('searchCustomers', { name: 'John' });

    expect(toolSignal).toHaveBeenCalledWith('searchCustomers', {
      name: 'John',
    });
    expect(emit).toHaveBeenCalledWith('Searching customers');
  });

  it('does not re-emit an unchanged tool status', () => {
    const emit = jest.fn();
    const tracker = createActivityTracker({
      emit,
      toolSignal: () => 'Searching customers',
    });

    tracker.onToolCall('searchCustomers', { page: 1 });
    tracker.onToolCall('searchCustomers', { page: 2 });

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('never emits after stop', () => {
    const emit = jest.fn();
    const tracker = createActivityTracker({
      emit,
      toolSignal: () => 'Searching customers',
    });

    tracker.stop();
    tracker.onToolCall('searchCustomers');

    expect(emit).not.toHaveBeenCalled();
  });
});
