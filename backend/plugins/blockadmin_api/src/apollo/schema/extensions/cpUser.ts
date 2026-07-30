export const cpUser = `
  extend type CPUser @key(fields: "_id") {
    _id: String! @external
    isMembership: Boolean
    membership: BaMembership
  }
`;
