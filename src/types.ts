export enum ItemStatus {
  AVAILABLE = 'متوفر',
  ASSIGNED = 'عهدة مع العامل',
  INSTALLED = 'مركبة',
  DAMAGED = 'تالفة',
  LOST = 'مفقودة',
}

export interface Department {
  id: string;
  name: string;
}

export interface Worker {
  id: string;
  name: string;
  departmentId: string;
  status: 'active' | 'inactive';
  password?: string;
}

export interface CustodyItem {
  serialNumber: string;
  status: ItemStatus;
  workerId?: string;
  deliveryDate?: string;
  installationDate?: string;
  location?: string;
  meterNumber?: string;
  operationType?: string;
  notes?: string;
}

export interface OperationLog {
  id: string;
  serialNumber: string;
  workerId: string;
  status: ItemStatus;
  timestamp: string;
  location?: string;
  meterNumber?: string;
  operationType?: string;
  notes?: string;
}
