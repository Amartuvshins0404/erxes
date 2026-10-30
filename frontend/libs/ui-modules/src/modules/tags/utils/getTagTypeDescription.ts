import { startCase } from 'lodash';

export const getTagTypeDescription = ({
  type,
  tagTypes,
}: {
  type: string | null;
  tagTypes: Record<string, { description: string; contentType: string }[]>;
}) => {
  if (!type) {
    return 'Workspace';
  }

  const [plugin, contentType] = type.split(':');
  const known = tagTypes[plugin]?.find((item) => item.contentType === type);

  if (known?.description) {
    return known.description;
  }

  return startCase(
    plugin === 'core' ? contentType : `${plugin} ${contentType}`,
  );
};
