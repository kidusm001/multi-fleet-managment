import type { Request } from 'express';

export interface EmployeeParams {
  id: string;
}

export interface EmployeeBody {
  name: string;
  location?: string;
  departmentId: string;
  shiftId: string;
  latitude?: number | string;
  longitude?: number | string;
  assigned?: boolean;
}

export type TypedRequest<P = Record<string, string>, B = unknown> = Request<P, any, B>;

export interface RouteEmployeeRef {
  employeeId: string;
  stopId: string;
}

export interface RouteBody {
  name: string;
  shuttleId?: string | number;
  shiftId: string;
  date: string | Date;
  totalDistance?: number;
  totalTime: number;
  employees: RouteEmployeeRef[];
}

export interface StopUpdate {
  id: string;
  // Optional employeeId used in some update operations to map stops by employee
  employeeId?: string;
  latitude?: number;
  longitude?: number;
  sequence?: number | null;
  estimatedArrivalTime?: string | Date | null;
}

// Clustering-related types (lightweight to satisfy imports)
export interface ClusterParams {
  shiftId: string;
  shuttleId: string;
}

export interface ClusterBody {
  shiftId: string;
  date: string;
}

export interface ClusteringBody {
  employees: any;
  shuttles: any;
}

export type ClusteringBodyFastApi = ClusteringBody;
