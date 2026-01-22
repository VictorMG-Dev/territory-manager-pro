
export enum TerritoryStatus {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red'
}

export enum TerritorySize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export interface TerritoryImage {
  url: string;
  name: string;
  isPrimary: boolean;
  uploadedAt: any;
}

export interface GeolocationData {
  type: "Polygon" | "Rectangle" | "Circle";
  coordinates: [number, number][];
  area: number;
  center: { lat: number, lng: number };
}

export interface Territory {
  id: string;
  userId: string;
  congregationId: string;
  code: string;
  name: string;
  address: string;
  observations: string;
  images: TerritoryImage[];
  geolocation: GeolocationData;
  lastWorkedDate: any;
  lastWorkedBy: string;
  status: TerritoryStatus;
  size: TerritorySize;
  daysSinceWork: number;
  createdAt: any;
  updatedAt: any;
}

export interface WorkRecord {
  id: string;
  territoryId: string;
  date: any;
  publisherName: string;
  notes: string;
  photos: { url: string; name: string }[];
  createdAt: any;
}

export type Role = 'publisher' | 'territory_servant' | 'service_overseer' | 'elder' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  congregationId?: string;
  congregationName?: string;
  role?: Role;
  createdAt: any;
}

export interface Congregation {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  createdAt: any;
  memberCount?: number;
}

export interface CongregationMember {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: Role;
  joinedAt: any;
}

export interface DailyAllocation {
  segunda: string[];
  terca: string[];
  quarta: string[];
  quinta: string[];
  sexta: string[];
  sabado: string[];
  domingo: string[];
}

export interface TerritoryGroup {
  id: string;
  congregationId: string;
  name: string;
  description: string;
  color: string;
  territoryIds: string[];
  memberIds?: string[];
  createdAt: string;
}

export interface WeeklyPlan {
  id: string;
  groupId: string;
  startDate: string; // ISO date
  days: DailyAllocation;
  createdAt: string;
}
