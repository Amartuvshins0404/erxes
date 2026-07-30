export const TypeExtensions = `
  extend type User @key(fields: "_id") {
    _id: String @external
  }

  extend type cpPoscProduct @key(fields: "_id") {
    _id: String @external
    supplier: Supplier
  }
`;
