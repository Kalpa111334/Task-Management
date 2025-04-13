export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'employee';
  createdAt: Date;
  token?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: 'pending' | 'completed' | 'rejected';
  proofImage?: string;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
} 