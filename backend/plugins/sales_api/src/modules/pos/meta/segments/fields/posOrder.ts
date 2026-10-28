import { SegmentField, SegmentFieldMeta } from 'erxes-api-shared/core-modules';

/**
 * Filterable POS order fields.
 *
 * The order document carries a great deal a segment has no business filtering
 * on - ebarimt receipts, Erkhet sync state, print flags, the raw paid-amount
 * arrays. What is listed here is what someone building an audience would name:
 * who bought, how much, when, where, and through which register.
 */

export const POS_ORDER_SEGMENT_FIELDS: SegmentFieldMeta[] = [
  SegmentField.text({ key: 'number', label: 'Order number' }),
  SegmentField.text({ key: 'description', label: 'Description' }),

  // Free text rather than a fixed list: which statuses and order types a
  // tenant uses are set by its own POS configuration, not by this schema.
  SegmentField.text({ key: 'status', label: 'Status' }),
  SegmentField.text({ key: 'type', label: 'Order type' }),

  SegmentField.number({ key: 'totalAmount', label: 'Total amount' }),
  SegmentField.number({ key: 'finalAmount', label: 'Final amount' }),
  SegmentField.number({ key: 'cashAmount', label: 'Cash amount' }),
  SegmentField.number({ key: 'mobileAmount', label: 'Mobile amount' }),

  SegmentField.date({ key: 'paidDate', label: 'Paid date' }),
  SegmentField.date({ key: 'dueDate', label: 'Due date' }),
  SegmentField.date({ key: 'closeDate', label: 'Close date' }),
  SegmentField.date({ key: 'createdAt', label: 'Created at' }),

  SegmentField.lookup({
    key: 'customerId',
    label: 'Customer',
    query: { name: 'customers', labelField: 'primaryEmail' },
  }),
  SegmentField.text({ key: 'customerType', label: 'Customer type' }),

  SegmentField.lookup({
    key: 'userId',
    label: 'Cashier',
    query: { name: 'users', labelField: 'email' },
  }),
  SegmentField.lookup({
    key: 'productId',
    label: 'Product',
    path: 'items.productId',
    query: { name: 'products', labelField: 'name' },
  }),

  SegmentField.lookup({
    key: 'placeEntityId',
    label: 'Place',
    query: { name: 'structureEntities', labelField: 'title' },
  }),
  SegmentField.lookup({
    key: 'responsibleEntityId',
    label: 'Responsible structure node',
    query: { name: 'structureEntities', labelField: 'title' },
  }),
  SegmentField.text({ key: 'posId', label: 'POS' }),

  SegmentField.boolean({ key: 'isPre', label: 'Is pre-order' }),
];
