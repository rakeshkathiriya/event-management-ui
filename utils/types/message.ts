export interface MessageRecipient {
  userId: string;
  isRead: boolean;
  readAt?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Admin' | 'User';
  recipientType: 'Admin' | 'Department' | 'Broadcast';
  departmentId?: string;
  subject: string;
  content: string;
  parentMessageId?: string;
  threadId: string;
  recipients: MessageRecipient[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  recipientType: 'Admin' | 'Department' | 'Broadcast';
  departmentId?: string; // Deprecated - keeping for backwards compatibility
  departmentIds?: string[]; // New: support multiple departments
  subject: string;
  content: string;
  parentMessageId?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface GetThreadResponse {
  success: boolean;
  data: {
    messages: Message[];
  };
}

export interface GetUnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: Message;
}

export interface MarkAsReadResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
  };
}
