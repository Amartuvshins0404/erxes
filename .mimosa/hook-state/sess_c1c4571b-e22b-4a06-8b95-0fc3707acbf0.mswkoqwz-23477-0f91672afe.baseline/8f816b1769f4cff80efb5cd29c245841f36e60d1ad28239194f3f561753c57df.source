import { gql } from '@apollo/client';

const ATTACHMENT_FIELDS = gql`
  fragment CarsAttachmentFields on Attachment {
    url
    name
    size
    type
  }
`;

const CAR_CATEGORY_FIELDS = gql`
  fragment CarsCategoryFields on CarCategory {
    _id
    name
    order
    code
    parentId
    description
    isRoot
    carCount
    productCategoryId
    image {
      ...CarsAttachmentFields
    }
    secondaryImages {
      ...CarsAttachmentFields
    }
  }
  ${ATTACHMENT_FIELDS}
`;

const CAR_FIELDS = gql`
  fragment CarsCarFields on Car {
    _id
    createdAt
    modifiedAt
    ownerId
    owner {
      _id
      email
      details {
        fullName
      }
    }
    mergedIds
    description
    plateNumber
    vinNumber
    colorCode
    categoryId
    category {
      ...CarsCategoryFields
    }
    bodyType
    fuelType
    gearBox
    vintageYear
    importYear
    status
    tagIds
    getTags {
      _id
      name
      colorCode
    }
    attachment {
      ...CarsAttachmentFields
    }
    customFieldsData
  }
  ${ATTACHMENT_FIELDS}
  ${CAR_CATEGORY_FIELDS}
`;

const LIST_QUERY_PARAMS = `
  $page: Int
  $perPage: Int
  $tag: String
  $segment: String
  $segmentData: String
  $categoryId: String
  $ids: [String]
  $searchValue: String
  $brand: String
  $sortField: String
  $sortDirection: Int
  $conformityMainType: String
  $conformityMainTypeId: String
  $conformityRelType: String
  $conformityIsRelated: Boolean
  $conformityIsSaved: Boolean
`;

const LIST_QUERY_VALUES = `
  page: $page
  perPage: $perPage
  tag: $tag
  segment: $segment
  segmentData: $segmentData
  categoryId: $categoryId
  ids: $ids
  searchValue: $searchValue
  brand: $brand
  sortField: $sortField
  sortDirection: $sortDirection
  conformityMainType: $conformityMainType
  conformityMainTypeId: $conformityMainTypeId
  conformityRelType: $conformityRelType
  conformityIsRelated: $conformityIsRelated
  conformityIsSaved: $conformityIsSaved
`;

export const GET_CARS = gql`
  query Cars(${LIST_QUERY_PARAMS}) {
    cars(${LIST_QUERY_VALUES}) {
      ...CarsCarFields
    }
  }
  ${CAR_FIELDS}
`;

export const GET_CARS_MAIN = gql`
  query CarsMain(${LIST_QUERY_PARAMS}) {
    carsMain(${LIST_QUERY_VALUES}) {
      list {
        ...CarsCarFields
      }
      totalCount
    }
  }
  ${CAR_FIELDS}
`;

export const GET_CAR_DETAIL = gql`
  query CarDetail($_id: String!) {
    carDetail(_id: $_id) {
      ...CarsCarFields
      customers {
        _id
        firstName
        lastName
        primaryEmail
        primaryPhone
      }
      companies {
        _id
        primaryName
        website
      }
    }
  }
  ${CAR_FIELDS}
`;

export const GET_CAR_CATEGORIES = gql`
  query CarCategories($parentId: String, $searchValue: String) {
    carCategories(parentId: $parentId, searchValue: $searchValue) {
      ...CarsCategoryFields
    }
  }
  ${CAR_CATEGORY_FIELDS}
`;

export const GET_CAR_CATEGORY_DETAIL = gql`
  query CarCategoryDetail($_id: String) {
    carCategoryDetail(_id: $_id) {
      ...CarsCategoryFields
    }
  }
  ${CAR_CATEGORY_FIELDS}
`;

export const GET_CAR_COUNTS = gql`
  query CarCounts(${LIST_QUERY_PARAMS}, $only: String) {
    carCounts(${LIST_QUERY_VALUES}, only: $only)
  }
`;

export const GET_CAR_COUNT_BY_TAGS = gql`
  query CarCountByTags {
    carCountByTags
  }
`;

const MUTATION_FIELDS = `
  ownerId: $ownerId
  description: $description
  plateNumber: $plateNumber
  vinNumber: $vinNumber
  colorCode: $colorCode
  categoryId: $categoryId
  bodyType: $bodyType
  fuelType: $fuelType
  gearBox: $gearBox
  vintageYear: $vintageYear
  importYear: $importYear
  status: $status
  attachment: $attachment
  customFieldsData: $customFieldsData
`;

const MUTATION_PARAMS = `
  $ownerId: String
  $description: String
  $plateNumber: String
  $vinNumber: String
  $colorCode: String
  $categoryId: String
  $bodyType: String
  $fuelType: String
  $gearBox: String
  $vintageYear: Float
  $importYear: Float
  $status: String
  $attachment: AttachmentInput
  $customFieldsData: JSON
`;

export const ADD_CAR_MUTATION = gql`
  mutation CarsAdd(${MUTATION_PARAMS}) {
    carsAdd(${MUTATION_FIELDS}) {
      ...CarsCarFields
    }
  }
  ${CAR_FIELDS}
`;

export const EDIT_CAR_MUTATION = gql`
  mutation CarsEdit($_id: String!, ${MUTATION_PARAMS}) {
    carsEdit(_id: $_id, ${MUTATION_FIELDS}) {
      ...CarsCarFields
    }
  }
  ${CAR_FIELDS}
`;

export const REMOVE_CARS_MUTATION = gql`
  mutation CarsRemove($carIds: [String]) {
    carsRemove(carIds: $carIds)
  }
`;

export const MERGE_CARS_MUTATION = gql`
  mutation CarsMerge($carIds: [String], $carFields: JSON) {
    carsMerge(carIds: $carIds, carFields: $carFields) {
      ...CarsCarFields
    }
  }
  ${CAR_FIELDS}
`;

const CATEGORY_MUTATION_PARAMS = `
  $name: String!
  $code: String!
  $description: String
  $parentId: String
  $image: AttachmentInput
  $secondaryImages: [AttachmentInput]
  $productCategoryId: String
`;

const CATEGORY_MUTATION_FIELDS = `
  name: $name
  code: $code
  description: $description
  parentId: $parentId
  image: $image
  secondaryImages: $secondaryImages
  productCategoryId: $productCategoryId
`;

export const ADD_CAR_CATEGORY_MUTATION = gql`
  mutation CarCategoriesAdd(${CATEGORY_MUTATION_PARAMS}) {
    carCategoriesAdd(${CATEGORY_MUTATION_FIELDS}) {
      ...CarsCategoryFields
    }
  }
  ${CAR_CATEGORY_FIELDS}
`;

export const EDIT_CAR_CATEGORY_MUTATION = gql`
  mutation CarCategoriesEdit($_id: String!, ${CATEGORY_MUTATION_PARAMS}) {
    carCategoriesEdit(_id: $_id, ${CATEGORY_MUTATION_FIELDS}) {
      ...CarsCategoryFields
    }
  }
  ${CAR_CATEGORY_FIELDS}
`;

export const REMOVE_CAR_CATEGORY_MUTATION = gql`
  mutation CarCategoriesRemove($_id: String!) {
    carCategoriesRemove(_id: $_id)
  }
`;
