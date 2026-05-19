export const types = `
  extend type User @key(fields: "_id") {
    _id: String! @external
  }

  extend type Tag @key(fields: "_id") {
    _id: String! @external
  }

  extend type Customer @key(fields: "_id") {
    _id: String! @external
  }

  extend type Company @key(fields: "_id") {
    _id: String! @external
  }

  type CarCategory {
    _id: String!
    name: String
    description: String
    parentId: String
    code: String!
    order: String!
    isRoot: Boolean
    carCount: Int
    image: Attachment
    secondaryImages: [Attachment]
    productCategoryId: String
    createdAt: Date
  }

  type Car {
    _id: String!
    createdAt: Date
    modifiedAt: Date
    ownerId: String
    mergedIds: [String]
    description: String
    owner: User
    customers: [Customer]
    companies: [Company]
    getTags: [Tag]
    tagIds: [String]
    plateNumber: String
    vinNumber: String
    colorCode: String
    categoryId: String
    category: CarCategory
    bodyType: String
    fuelType: String
    gearBox: String
    vintageYear: Float
    importYear: Float
    status: String
    attachment: Attachment
    customFieldsData: JSON
  }

  type CarsListResponse {
    list: [Car]
    totalCount: Float
  }
`;

const queryParams = `
  page: Int
  perPage: Int
  tag: String
  segment: String
  segmentData: String
  categoryId: String
  ids: [String]
  searchValue: String
  sortField: String
  sortDirection: Int
  brand: String
  conformityMainType: String
  conformityMainTypeId: String
  conformityRelType: String
  conformityIsRelated: Boolean
  conformityIsSaved: Boolean
`;

export const queries = `
  carsMain(${queryParams}): CarsListResponse
  cars(${queryParams}): [Car]
  carCounts(${queryParams}, only: String): JSON
  carDetail(_id: String!): Car
  carCountByTags: JSON
  carCategories(parentId: String, searchValue: String): [CarCategory]
  carCategoriesTotalCount: Int
  carCategoryDetail(_id: String): CarCategory
  cpCarsMain(${queryParams}, customerId: String, companyId: String): CarsListResponse
  cpCars(${queryParams}, customerId: String, companyId: String): [Car]
  cpCarDetail(_id: String!, customerId: String, companyId: String): Car
  cpCarCategories(parentId: String, searchValue: String): [CarCategory]
  cpCarCategoriesTotalCount: Int
  cpCarCategoryDetail(_id: String): CarCategory
  carPlateSuffixes: [String]
`;

const commonFields = `
  ownerId: String
  description: String
  plateNumber: String
  vinNumber: String
  colorCode: String
  categoryId: String
  bodyType: String
  fuelType: String
  gearBox: String
  vintageYear: Float
  importYear: Float
  status: String
  tagIds: [String]
  attachment: AttachmentInput
  customFieldsData: JSON
`;

const carCategoryParams = `
  name: String!
  code: String!
  description: String
  parentId: String
  image: AttachmentInput
  secondaryImages: [AttachmentInput]
  productCategoryId: String
`;

export const mutations = `
  carsAdd(${commonFields}): Car
  carsEdit(_id: String!, ${commonFields}): Car
  carsRemove(carIds: [String]): [String]
  carsMerge(carIds: [String], carFields: JSON): Car
  carCategoriesAdd(${carCategoryParams}): CarCategory
  carCategoriesEdit(_id: String!, ${carCategoryParams}): CarCategory
  carCategoriesRemove(_id: String!): JSON
  cpCarsAdd(${commonFields}, customerId: String, companyId: String): Car
  cpCarsEdit(
    _id: String!
    ${commonFields}
    customerId: String
    companyId: String
  ): Car
  cpCarsRemove(carIds: [String], customerId: String, companyId: String): [String]
`;
