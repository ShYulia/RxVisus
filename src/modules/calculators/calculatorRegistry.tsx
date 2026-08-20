import TranspositionCalculator from './TranspositionCalculator';
import WorkingDistanceToAddCalculator from './WorkingDistanceToAddCalculator';

export interface CalculatorDefinition {
  id: string;
  path: string;
  title: string;
  subtitle: string;
  component: React.FC;
}

export const calculatorDefinitions: CalculatorDefinition[] = [
  {
    id: 'transposition',
    path: '/calculate/transposition',
    title: 'Transposition',
    subtitle: '+cylinder ↔ −cylinder',
    component: TranspositionCalculator,
  },
  {
    id: 'working-distance-add',
    path: '/calculate/working-distance-add',
    title: 'Working Distance → ADD',
    subtitle: 'Convert a clinically tested ADD to a different working distance',
    component: WorkingDistanceToAddCalculator,
  },
];
