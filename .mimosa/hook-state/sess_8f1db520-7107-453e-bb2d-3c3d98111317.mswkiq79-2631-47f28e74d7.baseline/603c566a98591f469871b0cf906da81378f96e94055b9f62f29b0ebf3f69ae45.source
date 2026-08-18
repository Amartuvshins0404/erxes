import { ICarCategory, ICategoryTreeNode } from '~/types/car';

export const buildCategoryTree = (
  categories: ICarCategory[],
): ICategoryTreeNode[] => {
  const ordered = [...categories].sort((a, b) =>
    (a.order || '').localeCompare(b.order || ''),
  );

  const nodeMap = new Map<string, ICategoryTreeNode>();

  for (const category of ordered) {
    nodeMap.set(category._id, {
      ...category,
      children: [],
      depth: 0,
    });
  }

  const roots: ICategoryTreeNode[] = [];

  for (const category of ordered) {
    const node = nodeMap.get(category._id);

    if (!node) {
      continue;
    }

    if (category.parentId && nodeMap.has(category.parentId)) {
      const parent = nodeMap.get(category.parentId);

      if (!parent) {
        continue;
      }

      node.depth = parent.depth + 1;
      parent.children.push(node);
      continue;
    }

    roots.push(node);
  }

  return roots;
};

export const buildCategoryOptions = (
  categories: ICarCategory[],
  excludeId?: string,
) => {
  const tree = buildCategoryTree(
    excludeId
      ? categories.filter((category) => category._id !== excludeId)
      : categories,
  );

  const options: Array<{ label: string; value: string }> = [];

  const visit = (nodes: ICategoryTreeNode[]) => {
    for (const node of nodes) {
      options.push({
        value: node._id,
        label: `${'— '.repeat(node.depth)}${node.name || node.code}`,
      });

      visit(node.children);
    }
  };

  visit(tree);

  return options;
};
