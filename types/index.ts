import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'consultant';
  isApproved: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  emailVerified: boolean;
  accessReason: string;
}

export interface AdminNotification {
  id: string;
  message: string;
  type: 'new_user' | 'sensor_alert' | 'system';
  read: boolean;
  createdAt: Timestamp;
  link?: string; // Optional link to navigate to, e.g., the user management page
}
