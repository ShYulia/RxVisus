/** Clinical Guide's top-level entry points. Not every area has pathway content yet — see pathwayId. */
export interface GuideArea {
  id: string;
  title: string;
  desc: string;
  /** Root ClinicalPathwayNode id, if this area's content exists yet. */
  pathwayId?: string;
}

export const guideAreas: GuideArea[] = [
  { id: 'binocular-status', title: 'Binocular Status', desc: 'How to evaluate binocular vision' },
  { id: 'symptom-testing', title: 'Symptom-Driven Testing', desc: 'What to check based on symptoms' },
  { id: 'diplopia', title: 'Diplopia', desc: 'Approach and key tests', pathwayId: 'diplopia' },
  { id: 'strabismus', title: 'Strabismus', desc: 'History, exam, sensory status, and prism workflow', pathwayId: 'strabismus' },
];
