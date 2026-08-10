import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  extend type User @key(fields: "_id") {
    _id: String! @external
  }

  enum EVENT_TAB {
    upcoming
    past
    invited
    joined
  }

  type EventAgendaItem {
    startTime: String
    endTime: String
    title: String
    description: String
  }

  input EventAgendaItemInput {
    startTime: String!
    endTime: String!
    title: String!
    description: String
  }

  type EventLocation {
    city: String
    district: String
    address: String
    lat: Float
    lng: Float
  }

  input EventLocationInput {
    city: String
    district: String
    address: String
    lat: Float
    lng: Float
  }

  type Event {
    _id: String!
    name: String
    description: String
    coverImage: String
    images: [String]
    videoUrl: String
    startDate: Date
    endDate: Date
    location: EventLocation
    isOnline: Boolean
    onlineUrl: String
    capacity: Int
    status: String
    agenda: [EventAgendaItem]
    ownerId: String
    owner: User
    tagIds: [String]
    goingCount: Int
    createdBy: String
    createdAt: Date
    updatedAt: Date
  }

  type EventListResponse {
    list: [Event]
    pageInfo: PageInfo
    totalCount: Int
  }

  input EventInput {
    name: String!
    description: String
    coverImage: String
    images: [String]
    videoUrl: String
    startDate: Date!
    endDate: Date!
    location: EventLocationInput
    isOnline: Boolean
    onlineUrl: String
    capacity: Int
    status: String
    agenda: [EventAgendaItemInput]
    ownerId: String
    tagIds: [String]
  }
`;

const eventQueryParams = `
  searchValue: String
  status: String
  tab: EVENT_TAB
  ownerId: String
  startDateFrom: Date
  startDateTo: Date
  ids: [String]
`;

export const queries = `
  events(${eventQueryParams}, ${GQL_CURSOR_PARAM_DEFS}): EventListResponse
  eventDetail(_id: String!): Event

  cpEvents(${eventQueryParams}, ${GQL_CURSOR_PARAM_DEFS}): EventListResponse
  cpEventDetail(_id: String!): Event
  cpEventSavedEvents: [Event]
`;

export const mutations = `
  eventsAdd(doc: EventInput!): Event
  eventsEdit(_id: String!, doc: EventInput!): Event
  eventsRemove(_ids: [String]!): JSON

  cpEventToggleSave(eventId: String!): JSON
`;
