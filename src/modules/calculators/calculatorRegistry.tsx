import TranspositionCalculator from './TranspositionCalculator';
import WorkingDistanceToAddCalculator from './WorkingDistanceToAddCalculator';
import VertexDistanceCalculator from './VertexDistanceCalculator';

export interface CalculatorDefinition {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  /** Short optical/mathematical notation used as the hub tile's recognition mark. */
  mark: string;
  component: React.FC;
}

export const calculatorDefinitions: CalculatorDefinition[] = [
  {
    id: 'transposition',
    path: '/calculate/transposition',
    title: 'Transposition',
    subtitle: 'Switch between plus- and minus-cylinder notation',
    mark: '+CYL ↔ −CYL',
    component: TranspositionCalculator,
  },
  {
    id: 'working-distance-add',
    path: '/calculate/working-distance-add',
    title: 'Working Distance → ADD',
    subtitle: 'Convert a clinically tested ADD to a different working distance',
    mark: 'cm → D',
    component: WorkingDistanceToAddCalculator,
  },
  {
    id: 'vertex-distance',
    path: '/calculate/vertex-distance',
    title: 'Vertex Distance',
    subtitle: 'Convert a prescription between two vertex distances',
    mark: 'd₁ → d₂',
    component: VertexDistanceCalculator,
  },
];
