export interface StatsCardProps {
  title: string;
  value: string | number;
  change: string | number;
  type: 'increase' | 'decrease';
}

export interface Shuttle {
  id: string | number;
  name: string;
  type: 'in-house' | 'outsourced';
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  lastMaintenance?: string;
  nextMaintenance?: string;
  mileage?: number;
  vendor?: string;
  licensePlate: string;
  categoryId?: string | number;
  dailyRate?: number;
  driver?: Array<{
    id: string | number;
    name?: string;
  }>;
}

export interface ShuttleCategory {
  id: string | number;
  name: string;
  capacity: number;
}

export interface Driver {
  id: string | number;
  name: string;
  licenseNumber: string;
  status: 'active' | 'off-duty' | 'break';
  experience: number;
  rating: number;
  route?: string;
}

export interface MaintenanceSchedule extends Pick<
  Shuttle,
  'id' | 'name' | 'licensePlate' | 'lastMaintenance' | 'nextMaintenance'
> {}