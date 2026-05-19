import { generateFieldsFromSchema } from 'erxes-api-shared/core-modules';
import { Schema } from 'mongoose';
import { IModels } from '~/connectionResolvers';

type SchemaWithNestedPaths = Schema & {
  paths: Record<string, { schema?: Schema }>;
};

const buildCategoryField = (
  name: string,
  label: string,
  options: Array<{ value: string; label: string }>,
) => ({
  _id: name,
  name,
  label,
  type: 'String',
  selectOptions: options,
});

const buildSelectionField = (
  name: string,
  label: string,
  queryName: string,
  labelField: string,
) => ({
  _id: name,
  name,
  label,
  type: 'String',
  selectionConfig: {
    queryName,
    labelField,
    multi: true,
  },
});

export const generateCarFields = async (models: IModels) => {
  const schema = models.Cars.schema as SchemaWithNestedPaths;
  let fields: any[] = [];

  if (schema) {
    fields = [...(await generateFieldsFromSchema(schema, ''))];

    for (const name of Object.keys(schema.paths || {})) {
      const path = schema.paths[name];

      if (path.schema) {
        fields = [
          ...fields,
          ...(await generateFieldsFromSchema(path.schema, `${name}.`)),
        ];
      }
    }
  }

  const rootCategories = await models.CarCategories.find({
    $or: [
      { parentId: null },
      { parentId: '' },
      { parentId: { $exists: false } },
    ],
  })
    .sort({ order: 1 })
    .lean();

  const childCategories = await models.CarCategories.find({
    parentId: { $nin: [null, ''] },
  })
    .sort({ order: 1 })
    .lean();

  const additionalFields = [
    buildCategoryField(
      'parentCarCategoryId',
      'Category',
      rootCategories.map((category) => ({
        value: category._id,
        label: category.name,
      })),
    ),
    buildCategoryField(
      'carCategoryId',
      'Sub category',
      childCategories.map((category) => ({
        value: category._id,
        label: category.name,
      })),
    ),
    buildSelectionField('drivers', 'Driver(s)', 'customers', 'primaryEmail'),
    buildSelectionField('companies', 'Company(s)', 'companies', 'primaryName'),
    buildSelectionField('tagIds', 'Tags', 'tags', 'name'),
  ];

  const excludedFieldNames = new Set([
    '_id',
    'createdAt',
    'modifiedAt',
    'mergedIds',
    'searchText',
    'processId',
    'tagIds',
    'customFieldsData.field',
    'customFieldsData.value',
    'customFieldsData.stringValue',
    'customFieldsData.numberValue',
    'customFieldsData.dateValue',
    'customFieldsData.locationValue',
    'customFieldsData.locationValue.type',
    'customFieldsData.locationValue.coordinates',
  ]);

  return [
    ...additionalFields,
    ...fields.filter((field) => !excludedFieldNames.has(field.name)),
  ];
};
