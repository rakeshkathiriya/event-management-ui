// --------------------------------------
// Base Notification Interface
// --------------------------------------

export interface BaseNotification {
  id: string;
  createdAt: Date;
  isRead?: boolean;
  isDismissed?: boolean;
}

// --------------------------------------
// Message Notification (for all users)
// --------------------------------------

export interface MessageNotification extends BaseNotification {
  type: 'message';
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  subject: string;
  content: string;
  recipientType: string;
}

// --------------------------------------
// Program Update Request Notification (for admins)
// --------------------------------------

export interface ProgramUpdateRequestNotification extends BaseNotification {
  type: 'program-update-request';
  requestId: string;
  programId: string;
  programTitle?: string;
  requestedBy?: string;
  requestedByRole?: string;
  message: string;
}

// --------------------------------------
// Program Update Reviewed Notification (for users)
// --------------------------------------

export interface ProgramUpdateReviewedNotification extends BaseNotification {
  type: 'program-update-reviewed';
  requestId: string;
  programId: string;
  status: 'approved' | 'rejected';
  reviewedBy?: string;
  rejectionReason?: string;
  message: string;
}

// --------------------------------------
// Union Type for All Notifications
// --------------------------------------

export type UnifiedNotification =
  | MessageNotification
  | ProgramUpdateRequestNotification
  | ProgramUpdateReviewedNotification;

// --------------------------------------
// Type Guards
// --------------------------------------

export function isMessageNotification(
  notification: UnifiedNotification
): notification is MessageNotification {
  return notification.type === 'message';
}

export function isProgramUpdateRequestNotification(
  notification: UnifiedNotification
): notification is ProgramUpdateRequestNotification {
  return notification.type === 'program-update-request';
}

export function isProgramUpdateReviewedNotification(
  notification: UnifiedNotification
): notification is ProgramUpdateReviewedNotification {
  return notification.type === 'program-update-reviewed';
}

// --------------------------------------
// Helper to determine notification type for display
// --------------------------------------

export function getNotificationType(notification: UnifiedNotification): 'message' | 'program-update' {
  if (isMessageNotification(notification)) {
    return 'message';
  }
  return 'program-update';
}
