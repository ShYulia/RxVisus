/**
 * Clinical pathways: symptom/problem-first navigation into the canonical
 * test cards in clinicalTests.ts. A node is either a branch (more choices)
 * or a leaf (guidance + relevant tests, referenced by id — never duplicated).
 *
 * Content is a reasonable starting draft, not yet clinically validated.
 */
export interface ClinicalPathwayNode {
  id: string;
  title: string;
  kind: 'branch' | 'leaf';
  /** Short framing text — a sentence or two, not an article. */
  overview?: string;
  keySteps?: string[];
  redFlags?: string[];
  /** Branch only: child ClinicalPathwayNode ids. */
  children?: string[];
  /** Leaf only: ClinicalTest ids this situation calls for. */
  testIds?: string[];
}

export const clinicalPathways: ClinicalPathwayNode[] = [
  {
    id: 'diplopia',
    title: 'Diplopia',
    kind: 'branch',
    overview: 'Distinguish monocular vs. binocular first — this determines the entire workup.',
    children: ['diplopia-monocular', 'diplopia-binocular'],
  },
  {
    id: 'diplopia-monocular',
    title: 'Monocular diplopia',
    kind: 'leaf',
    overview: 'Persists with the fellow eye covered. Points to the eye itself, not to alignment — refractive, corneal, lens, or macular causes.',
    keySteps: [
      'Confirm it persists with each eye covered individually.',
      'Pinhole: if it resolves, suspect a refractive cause.',
      'Check cornea, lens, and macula if pinhole does not resolve it.',
    ],
    redFlags: ['New monocular diplopia with a visual field defect or metamorphopsia — refer for retinal/macular assessment.'],
  },
  {
    id: 'diplopia-binocular',
    title: 'Binocular diplopia',
    kind: 'branch',
    overview: 'Resolves when either eye is covered. Next: is it primarily vertical or horizontal?',
    children: ['diplopia-vertical', 'diplopia-horizontal'],
  },
  {
    id: 'diplopia-vertical',
    title: 'Vertical diplopia',
    kind: 'leaf',
    overview: 'Most often a cyclovertical muscle palsy (commonly superior oblique) or a restrictive/orbital cause.',
    keySteps: [
      'Cover test in primary, right, and left gaze.',
      'Parks 3-step if a single cyclovertical palsy is suspected.',
      'Double Maddox rod if torsion is part of the picture.',
    ],
    redFlags: ['Sudden onset with pain, ptosis, or pupil involvement — treat as a possible third-nerve palsy until proven otherwise.'],
    testIds: ['cover-test', 'parks-3-step', 'double-maddox-rod'],
  },
  {
    id: 'diplopia-horizontal',
    title: 'Horizontal diplopia',
    kind: 'leaf',
    overview: 'Consider a phoria decompensating, a sixth-nerve palsy, or a comitant strabismus.',
    keySteps: [
      'Cover test at distance and near.',
      'Maddox rod to quantify a phoria if the deviation is small.',
      'Hess/Lancaster if a paretic muscle is suspected, and to track it over time.',
    ],
    redFlags: ['New, sudden sixth-nerve pattern in an adult — consider urgent neuro-imaging referral, especially with other neuro signs.'],
    testIds: ['cover-test', 'maddox-rod', 'hess-lancaster'],
  },
];

export function getPathwayNode(id: string): ClinicalPathwayNode | undefined {
  return clinicalPathways.find((node) => node.id === id);
}
