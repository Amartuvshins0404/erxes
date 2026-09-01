import { INavigationActivity } from '@/navigation/types/NavigationActivity';
import {
  getPromotedNavigationRank,
  isPromotedNavigationActivity,
  splitPromotedNavigationActivities,
} from '@/navigation/utils/promotedNavigationActivities';

const activity = (
  defaultPath: string,
  id = defaultPath,
): INavigationActivity => ({
  id,
  label: id,
  kind: 'plugin',
  modules: [],
  defaultPath,
});

describe('promoted navigation activities', () => {
  it('ranks Command', () => {
    expect(getPromotedNavigationRank(activity('cf-os'))).toBe(0);
    expect(getPromotedNavigationRank(activity('/cf-os/'))).toBe(0);
  });

  it('leaves other plugins unpromoted', () => {
    expect(isPromotedNavigationActivity(activity('sales'))).toBe(false);
    expect(isPromotedNavigationActivity(activity('erxes-agent'))).toBe(false);
    expect(isPromotedNavigationActivity(activity('erxes-agent/agents'))).toBe(
      false,
    );
  });

  it('pulls Command out of the plugin list', () => {
    const sales = activity('sales');
    const agent = activity('erxes-agent', 'AI Agent');
    const command = activity('cf-os', 'command');
    const operation = activity('operation');

    expect(
      splitPromotedNavigationActivities([sales, agent, command, operation]),
    ).toEqual({
      promoted: [command],
      rest: [sales, agent, operation],
    });
  });

  it('keeps the full plugin list when neither product is loaded', () => {
    const sales = activity('sales');
    const operation = activity('operation');

    expect(splitPromotedNavigationActivities([sales, operation])).toEqual({
      promoted: [],
      rest: [sales, operation],
    });
  });
});
