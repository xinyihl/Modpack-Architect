
import { MachineDefinition } from '../types';

export const INITIAL_MACHINES: MachineDefinition[] = [
  {
    id: 'furnace',
    name: 'Standard Furnace',
    description: 'Basic smelting of ores and items.',
    inputs: [
      { type: 'item', label: 'Ingredient' }
    ],
    outputs: [
      { type: 'item', label: 'Smelted Result' }
    ]
  },
  {
    id: 'crusher',
    name: 'Ore Crusher',
    description: 'Pulverizes ores into dusts. Requires power.',
    inputs: [
      { type: 'item', label: 'Input Item' },
      { type: 'energy', label: 'Power Source' }
    ],
    outputs: [
      { type: 'item', label: 'Primary Output' },
      { type: 'item', label: 'Secondary Output (Optional)' }
    ]
  },
  {
    id: 'chemical_reactor',
    name: 'Chemical Reactor',
    description: 'Complex reactions between fluids and items.',
    inputs: [
      { type: 'item', label: 'Base Item' },
      { type: 'fluid', label: 'Reagent Fluid' },
      { type: 'energy', label: 'Power' }
    ],
    outputs: [
      { type: 'fluid', label: 'Product Fluid' },
      { type: 'item', label: 'Byproduct Item' }
    ]
  },
  {
    id: 'centrifuge',
    name: 'Industrial Centrifuge',
    description: 'Separates components based on density.',
    inputs: [
      { type: 'fluid', label: 'Input Mixture' },
      { type: 'energy', label: 'Power' }
    ],
    outputs: [
      { type: 'fluid', label: 'Light Phase' },
      { type: 'fluid', label: 'Heavy Phase' },
      { type: 'item', label: 'Sediment' }
    ]
  }
];
