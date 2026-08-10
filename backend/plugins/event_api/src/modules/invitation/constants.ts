export enum InvitationStatus {
  PENDING = 'pending',
  GOING = 'going',
  MAYBE = 'maybe',
  DECLINED = 'declined',
}

export enum InvitationSource {
  INVITED = 'invited',
  SELF = 'self',
}

export const ATTENDANCE_STATUS_ORDER: InvitationStatus[] = [
  InvitationStatus.GOING,
  InvitationStatus.MAYBE,
  InvitationStatus.DECLINED,
  InvitationStatus.PENDING,
];
