export const types = `
  type MtoEvent {
    _id: String
    createdAt: Date
    modifiedAt: Date
    title: MtoMultilingualString
    description: MtoMultilingualStringOptional
    image: String
    startDate: Date
    endDate: Date
    location: String
    categoryIds: [String]
    categories: [MtoActivityAssociation]
    status: String
    isActive: Boolean
  }
`;

const queryParams = `
  status: String,
  isActive: Boolean,
  searchValue: String,
  startDateFrom: Date,
  startDateTo: Date,
  categoryId: String,
`;

export const queries = `
  mtoEvents(${queryParams}): [MtoEvent]
  mtoEvent(_id: String!): MtoEvent
`;

export const mutations = `
  mtoEventCreate(
    title: MtoMultilingualStringInput!
    description: MtoMultilingualStringOptionalInput
    image: String
    startDate: Date!
    endDate: Date!
    location: String
    categoryIds: [String]
    status: String
    isActive: Boolean
  ): MtoEvent

  mtoEventUpdate(
    _id: String!
    title: MtoMultilingualStringInput
    description: MtoMultilingualStringOptionalInput
    image: String
    startDate: Date
    endDate: Date
    location: String
    categoryIds: [String]
    status: String
    isActive: Boolean
  ): MtoEvent

  mtoEventsRemove(ids: [String]!): JSON
`;
