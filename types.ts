
export enum TerritoryStatus {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red'
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
  code: string;
  name: string;
  address: string;
  observations: string;
  images: TerritoryImage[];
  geolocation: GeolocationData;
  lastWorkedDate: any;
  lastWorkedBy: string;
  status: TerritoryStatus;
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: any;
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
  name: string;
  description: string;
  color: string;
  territoryIds: string[];
  createdAt: string;
}

export interface WeeklyPlan {
  id: string;
  groupId: string;
  startDate: string; // ISO date
  days: DailyAllocation;
  createdAt: string;
}
