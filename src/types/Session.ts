import type { User } from '../types';

export interface Session {
  id: string;
  name?: string;
  createdAt: string;
  createdBy: string;
  lastModified?: string;
  participants?: User[];
  participantCount?: number;
} 