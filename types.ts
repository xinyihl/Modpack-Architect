
export type ResourceType = string;

export interface ResourceCategory {
  id: string;
  name: string;
  color: string;
  iconType: 'box' | 'droplet' | 'zap' | 'wind' | 'star';
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  hidden: boolean;
}

export interface ResourceStack {
  resourceId: string;
  amount: number;
}

export interface MachineSlot {
  type: ResourceType;
  label: string;
  optional?: boolean;
}

export type MetadataFieldType = 'string' | 'number' | 'boolean' | 'color';

export interface MetadataField {
  key: string;
  label: string;
  type: MetadataFieldType;
}

export interface MachineDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  inputs: MachineSlot[];
  outputs: MachineSlot[];
  metadataSchema?: MetadataField[];
}

export interface Recipe {
  id: string;
  name: string;
  machineId: string;
  duration?: number;
  inputs: ResourceStack[];
  outputs: ResourceStack[];
  note?: string;
  metadata?: Record<string, any>;
}

export interface SyncSettings {
  enabled: boolean;
  apiUrl: string;
  username: string;
  password?: string;
  syncInterval: number; // in seconds
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface ModpackData {
  categories: ResourceCategory[];
  resources: Resource[];
  recipes: Recipe[];
  machines: MachineDefinition[];
}
