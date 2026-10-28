export const TypeExtensions = `
  extend type User @key(fields: "_id") {
    _id: String @external
  }

  extend type StructureEntity @key(fields: "_id") {
    _id: String! @external
  }

  extend type Company @key(fields: "_id") {
    _id: String @external
  }

  extend type Customer @key(fields: "_id") {
    _id: String @external
  }

  extend type Tag @key(fields: "_id") {
    _id: String @external
  }

  extend type Product @key(fields: "_id") {
    _id: String! @external
  }
`;
