/**
 * Visual-acuity notation validation for text-entry fields like Strabismus/Diplopia's
 * "Best-corrected VA" — a notation check only, never a clinical judgment about what acuity is
 * normal/acceptable. Accepts whatever a clinician would actually write on a chart:
 *
 *  - Snellen fraction (metric or imperial): numerator/denominator, both positive finite
 *    numbers — e.g. "6/6", "6/7.5", "6/60", "20/20", "20/40". Deliberately NOT a whitelist of
 *    standard chart lines: any positive fraction is accepted, since the point is to reject
 *    garbage input, not to second-guess which lines a real chart has.
 *  - Decimal VA: a plain positive finite number — e.g. "1.0", "0.8", "0.05".
 *  - Low-vision notation, case-insensitive, optionally followed by a qualifier: CF (Counting
 *    Fingers), HM (Hand Motion), LP (Light Perception), NLP (No Light Perception) — e.g. "CF",
 *    "CF at 1m", "HM 2ft".
 *
 * A blank string is not itself valid notation — whether blank is acceptable is a separate
 * required-field concern for the caller (see TextEntryForm's numericError for the same split).
 */

const LOW_VISION_PATTERN = /^(NLP|LP|HM|CF)\b/i;
const SNELLEN_PATTERN = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

export function isValidVisualAcuity(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === '') return false;

  if (LOW_VISION_PATTERN.test(trimmed)) return true;

  const snellen = trimmed.match(SNELLEN_PATTERN);
  if (snellen) {
    const numerator = parseFloat(snellen[1]);
    const denominator = parseFloat(snellen[2]);
    return Number.isFinite(numerator) && Number.isFinite(denominator) && numerator > 0 && denominator > 0;
  }

  if (DECIMAL_PATTERN.test(trimmed)) {
    const value = parseFloat(trimmed);
    return Number.isFinite(value) && value > 0;
  }

  return false;
}
