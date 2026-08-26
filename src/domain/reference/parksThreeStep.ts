/**
 * Parks-Bielschowsky 3-step muscle localization for an isolated cyclovertical (vertical)
 * muscle palsy. Table cross-checked against AAO EyeWiki and Wikipedia's step 1/2/3 mechanism
 * (vertical recti are the prime vertical movers in abduction, obliques in adduction; on head
 * tilt the ipsilateral eye's intorters are superior rectus + superior oblique, the
 * contralateral eye's extorters are inferior rectus + inferior oblique) and confirmed
 * internally self-consistent and left/right symmetric — but the 8-row table itself was
 * deduced from that mechanism rather than copied verbatim from a single published table, so
 * treat it as a strong draft to be signed off against a primary source (e.g. a textbook plate)
 * before relying on it clinically.
 *
 * Only valid for a single, isolated cyclovertical muscle palsy — see PARKS_3_STEP_LIMITATION.
 */
export type Side = 'right' | 'left';

export interface Parks3StepAnswer {
  /** Which eye is hypertropic in primary gaze. */
  hyperEye: Side;
  /** Which gaze position the hypertropia is worse in. */
  worseGaze: Side;
  /** Which head tilt (Bielschowsky) the hypertropia is worse on. */
  worseTilt: Side;
}

const MUSCLE_TABLE: Record<string, string> = {
  'right-right-left': 'Right inferior rectus',
  'right-right-right': 'Left inferior oblique',
  'right-left-right': 'Right superior oblique',
  'right-left-left': 'Left superior rectus',
  'left-left-right': 'Left inferior rectus',
  'left-left-left': 'Right inferior oblique',
  'left-right-left': 'Left superior oblique',
  'left-right-right': 'Right superior rectus',
};

export function localizeParks3Step({ hyperEye, worseGaze, worseTilt }: Parks3StepAnswer): string {
  return MUSCLE_TABLE[`${hyperEye}-${worseGaze}-${worseTilt}`];
}

export const PARKS_3_STEP_LIMITATION =
  'Valid only for a single, isolated cyclovertical muscle palsy — unreliable with more than one paretic muscle, restrictive strabismus (e.g. thyroid eye disease, orbital fracture), skew deviation, myasthenia gravis, prior strabismus surgery, or a long-standing/decompensated deviation.';
