import { OneFitActivityCategory } from '../types/category';

export function generateOrderPath(
  categories: OneFitActivityCategory[],
): Array<OneFitActivityCategory & { order: string; hasChildren: boolean }> {
  const map = new Map(categories.map((item) => [item._id, item]));

  const childrenMap = new Map<string, OneFitActivityCategory[]>();

  categories.forEach((item) => {
    const parentId = item.parentId || '';
    if (parentId) {
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(item);
    }
  });

  const getOrder = (_id: string): string => {
    const item = map.get(_id);
    if (!item) return '';
    const parentId = item.parentId || '';
    if (!parentId) return _id;
    return `${getOrder(parentId)}/${_id}`;
  };

  const result: Array<
    OneFitActivityCategory & { order: string; hasChildren: boolean }
  > = [];

  const traverse = (item: OneFitActivityCategory) => {
    const order = getOrder(item._id);
    const hasChildren = childrenMap.has(item._id);

    result.push({
      ...item,
      order,
      hasChildren,
    });

    const children = childrenMap.get(item._id) || [];
    children.forEach((child) => traverse(child));
  };

  const rootItems = categories.filter(
    (item) => !item.parentId || item.parentId === '',
  );

  rootItems.forEach((root) => traverse(root));

  return result;
}

