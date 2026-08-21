import { GQL_OFFSET_PARAM_DEFS } from "erxes-api-shared/utils";

export const types = `
  type CpBlockAdminUnit {
    _id: String
    building: BlockAdminBuilding
    zoning: BlockAdminBuildingZoning
    project: BlockAdminProject
    number: String
    isFeatured: Boolean

    type: CpBlockAdminUnitType
    status: BlockAdminUnitStatus
  }

  type CpBlockAdminUnitType {
    _id: String
    name: String
    description: String
    size: Float
    type: BlockAdminBuildingUnitUsageType
    subTypes: [String]
    featureTypes: [String]
    areaType: String
    tenureTypes: [BlockAdminBuildingUnitTenureType]
    content: String
    price: Float
    prices: [BlockAdminProjectPrice]
    status: String
    rooms: JSON
    roomsCount: Int
    coverImage: String
    images: [String]
    planImages: [String]
    project: BlockAdminProject
    createdAt: Date
    updatedAt: Date
    unitsCount: Int
  }
`;

const queryParams = `
  project: String
  floor: Int
  isFeatured: Boolean
  type: String

  searchValue: String
  district: String
  tenureType: String
  priceMin: Int
  priceMax: Int

  ${GQL_OFFSET_PARAM_DEFS}
`;

export const queries = `
  cpBlockAdminGetUnits(${queryParams}): [CpBlockAdminUnit]
  cpBlockAdminGetUnit(_id: String): CpBlockAdminUnit

  cpBlockAdminGetUnitTypes(project: String): [CpBlockAdminUnitType]
  cpBlockAdminGetUnitType(_id: String): CpBlockAdminUnitType
`;