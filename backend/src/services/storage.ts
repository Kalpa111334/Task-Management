import fs from 'fs';
import path from 'path';
import { User, Task, ChatMessage, Group } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File paths
const FILES = {
  USERS: path.join(DATA_DIR, 'users.json'),
  TASKS: path.join(DATA_DIR, 'tasks.json'),
  MESSAGES: path.join(DATA_DIR, 'messages.json'),
  GROUPS: path.join(DATA_DIR, 'groups.json'),
};

// Initialize files if they don't exist
Object.values(FILES).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]');
  }
});

class StorageService {
  private readFile<T>(file: string): T[] {
    try {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private writeFile<T>(file: string, data: T[]): void {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  // Users
  getUsers(): User[] {
    return this.readFile<User>(FILES.USERS);
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.writeFile(FILES.USERS, users);
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.writeFile(FILES.USERS, users);
    }
  }

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    this.writeFile(FILES.USERS, filtered);
  }

  // Tasks
  getTasks(): Task[] {
    return this.readFile<Task>(FILES.TASKS);
  }

  addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.writeFile(FILES.TASKS, tasks);
  }

  updateTask(taskId: string, updatedTask: Task): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.writeFile(FILES.TASKS, tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.writeFile(FILES.TASKS, filtered);
  }

  // Messages
  getMessages(): ChatMessage[] {
    return this.readFile<ChatMessage>(FILES.MESSAGES);
  }

  addMessage(message: ChatMessage): void {
    const messages = this.getMessages();
    messages.push(message);
    this.writeFile(FILES.MESSAGES, messages);
  }

  // Groups
  getGroups(): Group[] {
    return this.readFile<Group>(FILES.GROUPS);
  }

  addGroup(group: Group): void {
    const groups = this.getGroups();
    groups.push(group);
    this.writeFile(FILES.GROUPS, groups);
  }

  updateGroup(groupId: string, updates: Partial<Group>): void {
    const groups = this.getGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates };
      this.writeFile(FILES.GROUPS, groups);
    }
  }

  deleteGroup(groupId: string): void {
    const groups = this.getGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    this.writeFile(FILES.GROUPS, filtered);
  }
}

export const storageService = new StorageService(); 