import { gql } from '~/gql';

export const TRANSACTION_DETAIL_QUERY = gql(`
query accountingAccTransactionDetail($_id: String!) {
  accTransactionDetail(_id: $_id) {
    _id
    ptrId
    parentId
    number
    ptrNumber
    ptrStatus
    createdAt
    updatedAt
    date
    description
    status
    mentionOwnerId
    mentionUserIds
    journal
    side
    relAccounts
    originId
    originType
    originSubId
    followInfos
    placeEntityId
    responsibleEntityId
    customerType
    customerId
    assignedUserIds
    placeEntity {
      _id
      code
      title
    }
    responsibleEntity {
      _id
      code
      title
    }
    details {
      _id
      accountId
      transactionId
      placeEntityId
      responsibleEntityId
      placeEntity {
        _id
        code
        title
      }
      responsibleEntity {
        _id
        code
        title
      }
      originId
      originType
      originSubId
      followInfos
      amount
      currencyAmount
      customRate
      assignedUserId
      productId
      fixedAssetId
      fixedAssetCategoryId
      fixedAssetCode
      fixedAssetName
      count
      unitPrice
      weight
      excludeVat
      excludeCtax
      account {
        _id
        code
        name
        currency
        kind
        journal
        extra {
          bank
          bankAccount
        }
      }
    }
    shortDetail {
      _id
      accountId
      transactionId
      placeEntityId
      responsibleEntityId
      placeEntity {
        _id
        code
        title
      }
      responsibleEntity {
        _id
        code
        title
      }
      originId
      originType
      originSubId
      followInfos
      amount
      currencyAmount
      customRate
      assignedUserId
      productId
      fixedAssetId
      fixedAssetCategoryId
      fixedAssetCode
      fixedAssetName
      count
      unitPrice
      weight
      excludeVat
      excludeCtax
      account {
        _id
        code
        name
        currency
        extra {
          bank
          bankAccount
        }
      }
    }
    sumDt
    sumCt
    createdBy
    modifiedBy
    followTrs {
      _id
      ptrId
      parentId
      number
      ptrStatus
      details {
        _id
        accountId
        transactionId
        placeEntityId
        responsibleEntityId
        placeEntity {
          _id
          code
          title
        }
        responsibleEntity {
          _id
          code
          title
        }
        originId
        originType
        originSubId
        followInfos
        amount
        currencyAmount
        customRate
        assignedUserId
        productId
        fixedAssetId
        fixedAssetCategoryId
        fixedAssetCode
        fixedAssetName
        count
        unitPrice
        weight
        excludeVat
        excludeCtax
      }
      shortDetail {
        _id
        accountId
        transactionId
        placeEntityId
        responsibleEntityId
        placeEntity {
          _id
          code
          title
        }
        responsibleEntity {
          _id
          code
          title
        }
        originId
        originType
        originSubId
        followInfos
        amount
        currencyAmount
        customRate
        assignedUserId
        productId
        fixedAssetId
        fixedAssetCategoryId
        fixedAssetCode
        fixedAssetName
        count
        unitPrice
        weight
        excludeVat
        excludeCtax
      }
      sumDt
      sumCt
    }
    hasVat
    vatRowId
    afterVat
    isHandleVat
    vatAmount
    vatRow {
      _id
      number
      name
      percent
    }
    hasCtax
    ctaxRowId
    isHandleCtax
    ctaxAmount
    ctaxRow {
      _id
      number
      name
      percent
    }
    extraData
    contentType
    contentId
    permission
    details {
      product {
        _id
        code
        name
        unitPrice
        uom
      }
    }
    customer {
      _id
      code
      primaryPhone
      firstName
      primaryEmail
      lastName
    }
  }
}
`);
