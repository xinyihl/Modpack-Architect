
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
  hidden: boolean; // True for energy, etc.
}

export interface ResourceStack {
  resourceId: string;
  amount: number;
}

export interface MachineSlot {
  type: ResourceType;
  label: string;
}

export interface MachineDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  inputs: MachineSlot[];
  outputs: MachineSlot[];
}

export interface Recipe {
  id: string;
  name: string;
  machineId: string; // Linking to MachineDefinition
  duration?: number; // in ticks
  inputs: ResourceStack[];
  outputs: ResourceStack[];
  note?: string;
}

export interface GraphData {
  resources: Resource[];
  recipes: Recipe[];
}
