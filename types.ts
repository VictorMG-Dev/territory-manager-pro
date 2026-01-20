
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
