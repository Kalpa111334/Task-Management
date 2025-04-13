export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt: Date;
  settings?: {
    emailNotifications: boolean;
    taskReminders: boolean;
    chatNotifications: boolean;
    darkMode: boolean;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  createdBy: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  proofImage?: string;
  submissionNote?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  isShortTimeTask?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
} 