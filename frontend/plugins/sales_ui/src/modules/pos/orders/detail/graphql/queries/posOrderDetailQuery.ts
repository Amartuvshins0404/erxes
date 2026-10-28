import { gql } from '~/gql';

export const POS_ORDER_DETAIL_QUERY = gql(`
  query salesPosOrderDetail($id: String) {
    posOrderDetail(_id: $id) {
      customer {
        _id
        code
        primaryPhone
        firstName
        primaryEmail
        lastName
      }
      _id
      accountingResponse
      billId
      billType
      placeEntity
      placeEntityId
      cashAmount
      convertDealId
      createdAt
      customerId
      customerType
      brokerId
      brokerType
      brokerName
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
