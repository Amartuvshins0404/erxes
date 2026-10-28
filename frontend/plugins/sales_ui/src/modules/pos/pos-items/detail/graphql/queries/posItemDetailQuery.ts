import { gql } from '~/gql';

export const POS_ITEM_DETAIL_QUERY = gql(`
  query salesPosItemDetail($_id: String) {
    posOrderDetail(_id: $_id) {
      customer {
        _id
        code
        primaryPhone
        firstName
        primaryEmail
        lastName
      }
      _id
      billId
      billType
      placeEntity
      placeEntityId
      cashAmount
      convertDealId
      createdAt
      customerId
      customerType
      deal
      dealLink
      deliveryInfo
      responsibleEntity
      responsibleEntityId
      description
      dueDate
      finalAmount
      isPre
      items
      mobileAmount
      number
      oldBillId
      origin
      paidAmounts
      paidDate
      posName
      posToken
      printedEbarimt
      putResponses
      registerNumber
      returnInfo
      shouldPrintEbarimt
      status
      subPlaceEntity
      subPlaceEntityId
      syncErkhetInfo
      syncedErkhet
      totalAmount
      type
      user {
        username
      }
    }
  }
`);
