import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import { parseStrictNumber } from '../../domain/reference/binocularFindings';
import TestChips from './TestChips';

export interface TextEntryFieldDef {
  key: string;
  label: string;
  /** Must be filled (or satisfied via `absentOption`) before Continue is enabled. */
  required?: boolean;
  /** Lets this field be satisfied by an explicit non-numeric clinical result instead of forcing a fake number (e.g. "No blur"). */
  absentOption?: { label: string; value: string };
  /**
   * Marks this field as a numeric clinical measurement rather than free text: switches to a
   * decimal numeric keyboard, and rejects non-numeric text with a visible error instead of
   * letting it pass the (purely non-empty) `required` check only to be silently reinterpreted
   * as "not entered" later. VA/stereoacuity-style fields deliberately omit this. `allowNegative`
   * opts in for a signed measurement (e.g. MEM/Nott lag/lead).
   */
  numeric?: { allowNegative?: boolean };
}

/** Returns an error message when `raw` is non-empty but fails this field's numeric requirement — undefined otherwise (including for a genuinely blank value, which is a `required`-check concern, not a numeric one). */
function numericError(field: TextEntryFieldDef, raw: string): string | undefined {
  if (!field.numeric) return undefined;
  if (raw.trim() === '') return undefined;
  const value = parseStrictNumber(raw);
  if (value === undefined) return 'Enter a valid number.';
  if (!field.numeric.allowNegative && value < 0) return 'Enter a non-negative number.';
  return undefined;
}

export interface TextEntryFormProps {
  fields: TextEntryFieldDef[];
  /** Reorganizes `fields` into labeled visual sections (e.g. "BI"/"BO") — `fields` stays the source of truth for values. */
  groups?: { label: string; keys: string[] }[];
  helperText?: string;
  testIds?: string[];
  /** Carried to a linked Test Card so its Back returns here. */
  backState?: Record<string, unknown>;
  /** When provided, an explicit "Skip test" action is offered that discards any entry and bypasses validation — for optional/targeted tests only. */
  onSkip?: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

/**
 * Short free-text recording (e.g. VA per eye, or a full test's results). Fields with no
 * `required` flag are always submittable — pure context, never a gate. A `required` field blocks
 * Continue until filled (or, if it has an `absentOption`, until that's explicitly toggled) — the
 * validation message only appears after a blocked Continue attempt, not while the clinician is
 * still filling the form in.
 */
const TextEntryForm: React.FC<TextEntryFormProps> = ({ fields, groups, helperText, testIds, backState, onSkip, onSubmit }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [absent, setAbsent] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));

  const isSatisfied = (field: TextEntryFieldDef) => {
    if (field.absentOption && absent[field.key]) return true;
    const raw = values[field.key] ?? '';
    // Invalid numeric text blocks Continue regardless of `required` — entered-but-unparseable
    // data must never be accepted, let alone silently reinterpreted as "not entered".
    if (numericError(field, raw)) return false;
    if (!field.required) return true;
    return raw.trim() !== '';
  };

  const toggleAbsent = (field: TextEntryFieldDef) => {
    setAbsent((cur) => ({ ...cur, [field.key]: !cur[field.key] }));
    setValues((cur) => ({ ...cur, [field.key]: '' }));
  };

  const handleContinue = () => {
    if (fields.some((f) => !isSatisfied(f))) {
      setSubmitAttempted(true);
      return;
    }
    const finalValues = { ...values };
    for (const field of fields) {
      if (field.absentOption && absent[field.key]) finalValues[field.key] = field.absentOption.value;
    }
    onSubmit(finalValues);
  };

  const renderFields = (defs: TextEntryFieldDef[]) => (
    <FieldBoxGrid columns={defs.length <= 2 ? 2 : 3}>
      {defs.map((field) => {
        const fieldIsAbsent = !!(field.absentOption && absent[field.key]);
        const raw = values[field.key] ?? '';
        // A numeric error is shown as soon as it's typed (like the calculators' own progressive
        // validation) — the clinician shouldn't have to hit Continue to find out garbage text
        // won't be accepted. "Required" only appears after a blocked Continue attempt, and never
        // alongside a numeric error for the same field.
        const numError = numericError(field, raw);
        const requiredError = submitAttempted && !isSatisfied(field) && !numError ? 'Required' : undefined;
        return (
          <div key={field.key} className="rx-textentry-field">
            <FieldBox
              label={field.label}
              inputMode={field.numeric ? 'decimal' : 'text'}
              value={raw}
              disabled={fieldIsAbsent}
              error={numError ?? requiredError}
              onChange={(v) => setValues((cur) => ({ ...cur, [field.key]: v }))}
            />
            {field.absentOption && (
              <button
                type="button"
                className={`rx-textentry-absent-toggle${fieldIsAbsent ? ' rx-textentry-absent-toggle-active' : ''}`}
                onClick={() => toggleAbsent(field)}
              >
                {fieldIsAbsent ? `✓ ${field.absentOption.label}` : field.absentOption.label}
              </button>
            )}
          </div>
        );
      })}
    </FieldBoxGrid>
  );

  return (
    <div className="rx-textentry-form">
      <TestChips testIds={testIds} state={backState ?? {}} />

      {groups && groups.length > 0
        ? groups.map((group) => (
            <div key={group.label} style={{ marginTop: 12 }}>
              <p className="rx-list-section-label">{group.label}</p>
              {renderFields(group.keys.map((key) => fieldByKey.get(key)).filter((f): f is TextEntryFieldDef => !!f))}
            </div>
          ))
        : renderFields(fields)}

      {helperText && (
        <p className="rx-hint" style={{ marginTop: 8 }}>
          {helperText}
        </p>
      )}
      <IonButton className="rx-btn-solid" expand="block" onClick={handleContinue} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
      {onSkip && (
        <IonButton fill="outline" expand="block" onClick={onSkip} style={{ marginTop: 8 }}>
          Skip test
        </IonButton>
      )}
    </div>
  );
};

export default TextEntryForm;
