
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
export type ServiceRole = 'publisher' | 'auxiliary_pioneer' | 'regular_pioneer';

export interface ServiceReport {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  hours: number;
  minutes: number;
  bibleStudies: number;
  participated: boolean; // For publishers who don't report hours
  isCampaign: boolean; // For Aux Pioneers (15h vs 30h)
  submitted: boolean;
  submittedAt?: string;
  updatedAt: string;
  dailyRecords?: Record<number, {
    hours: number;
    minutes: number;
    studies: number;
    notes?: string;
  }>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  congregationId?: string;
  congregationName?: string;
  role?: Role; // System Role
  serviceRole?: ServiceRole; // Field Service Role
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
  announcements?: Announcement[];
}

export type AnnouncementPriority = 'low' | 'normal' | 'high';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: AnnouncementPriority;
  createdBy: string;
  authorName: string;
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

export interface TrackingPoint {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface TrackingSession {
  id: string;
  userId: string;
  congregationId: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'approved' | 'rejected';
  distanceMeters: number;
  durationSeconds: number;
  observations?: string;
  notes?: string;
  points?: TrackingPoint[];
  createdAt: string;
}

// Weekly and Monthly Planning Types
export interface PlannedDay {
  hours: number;
  minutes: number;
  notes?: string;
  isFlexible: boolean; // If can be adjusted/redistributed
}

export interface WeeklySchedule {
  id: string;
  userId: string;
  planId: string; // Reference to MonthlyPlan
  month: string; // YYYY-MM
  weekNumber: number; // 1-5 (week of the month)
  days: {
    monday?: PlannedDay;
    tuesday?: PlannedDay;
    wednesday?: PlannedDay;
    thursday?: PlannedDay;
    friday?: PlannedDay;
    saturday?: PlannedDay;
    sunday?: PlannedDay;
  };
  totalPlannedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyPlan {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  targetHours: number; // Monthly goal
  weeks: WeeklySchedule[];
  totalPlannedHours: number;
  projectedCompletion: number; // Estimated percentage
  createdAt: string;
  updatedAt: string;
}

export type PlanSuggestionType = 'balanced' | 'frontloaded' | 'backloaded' | 'weekends' | 'weekdays' | 'custom';

export interface PlanSuggestion {
  type: PlanSuggestionType;
  name: string;
  description: string;
  distribution: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  totalHours: number;
}

export interface PlanTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  serviceRole: ServiceRole;
  targetHours: number;
  distribution: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalPatterns {
  averageHoursPerDay: Record<string, number>;
  mostProductiveDays: string[];
  completionRate: number;
  monthlyTrends: Array<{ month: string; hours: number }>;
}

