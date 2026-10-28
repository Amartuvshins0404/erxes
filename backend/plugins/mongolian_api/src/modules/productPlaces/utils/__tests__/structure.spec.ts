import {
  groupLinesByPrintCondition,
  IPlacedLine,
  IStructureNode,
} from '../structure';

const node = (_id: string, order: string): IStructureNode => ({
  _id,
  order,
  title: _id,
});

const nodeById: Record<string, IStructureNode> = {
  root: node('root', '/root/'),
  north: node('north', '/root/north/'),
  northStore: node('northStore', '/root/north/northStore/'),
  northKiosk: node('northKiosk', '/root/north/northKiosk/'),
  south: node('south', '/root/south/'),
  kitchen: node('kitchen', '/root/north/kitchen/'),
  coldKitchen: node('coldKitchen', '/root/north/kitchen/coldKitchen/'),
  bar: node('bar', '/root/north/bar/'),
};

const groupIds = <L extends { id: string }, C extends { name: string }>(
  groups: { condition: C; lines: L[] }[],
) =>
  groups.map(({ condition, lines }) => [
    condition.name,
    lines.map((line) => line.id),
  ]);

describe('groupLinesByPrintCondition', () => {
  it('routes a line placed below a condition node to that condition', () => {
    const groups = groupLinesByPrintCondition(
      [{ id: 'l1', placeEntityId: 'northStore' }],
      [{ name: 'north', placeEntityId: 'north' }],
      nodeById,
    );

    expect(groupIds(groups)).toEqual([['north', ['l1']]]);
  });

  it('gives each line to the closest place node only', () => {
    const groups = groupLinesByPrintCondition(
      [
        { id: 'store', placeEntityId: 'northStore' },
        { id: 'kiosk', placeEntityId: 'northKiosk' },
      ],
      [
        { name: 'north', placeEntityId: 'north' },
        { name: 'store', placeEntityId: 'northStore' },
      ],
      nodeById,
    );

    expect(groupIds(groups)).toEqual([
      ['north', ['kiosk']],
      ['store', ['store']],
    ]);
  });

  it('ignores lines placed outside the condition subtree', () => {
    const groups = groupLinesByPrintCondition(
      [{ id: 'south', placeEntityId: 'south' }],
      [{ name: 'north', placeEntityId: 'north' }],
      nodeById,
    );

    expect(groups).toEqual([]);
  });

  it('matches a condition without a place only to lines without a place', () => {
    const emptyCondition: IPlacedLine & { name: string } = { name: 'empty' };

    const groups = groupLinesByPrintCondition(
      [{ id: 'none' }, { id: 'placed', placeEntityId: 'north' }],
      [emptyCondition],
      nodeById,
    );

    expect(groupIds(groups)).toEqual([['empty', ['none']]]);
  });

  it('resolves the responsible node by the same closest-ancestor rule', () => {
    const groups = groupLinesByPrintCondition(
      [
        {
          id: 'cold',
          placeEntityId: 'northStore',
          responsibleEntityId: 'coldKitchen',
        },
        {
          id: 'drink',
          placeEntityId: 'northStore',
          responsibleEntityId: 'bar',
        },
      ],
      [
        {
          name: 'kitchen',
          placeEntityId: 'north',
          responsibleEntityId: 'kitchen',
        },
        { name: 'bar', placeEntityId: 'north', responsibleEntityId: 'bar' },
      ],
      nodeById,
    );

    expect(groupIds(groups)).toEqual([
      ['kitchen', ['cold']],
      ['bar', ['drink']],
    ]);
  });

  it('treats a line whose node is unknown as outside every subtree', () => {
    const groups = groupLinesByPrintCondition(
      [{ id: 'ghost', placeEntityId: 'archivedGhost' }],
      [{ name: 'root', placeEntityId: 'root' }],
      nodeById,
    );

    expect(groups).toEqual([]);
  });
});
