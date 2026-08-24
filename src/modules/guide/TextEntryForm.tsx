import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import TestChips from './TestChips';

export interface TextEntryFieldDef {
  key: string;
  label: string;
  /** Must be filled (or satisfied via `absentOption`) before Continue is enabled. */
  required?: boolean;
  /** Lets this field be satisfied by an explicit non-numeric clinical result instead of forcing a fake number (e.g. "No blur"). */
  absentOption?: { label: string; value: string };
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
    if (!field.required) return true;
    if (field.absentOption && absent[field.key]) return true;
    return (values[field.key] ?? '').trim() !== '';
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
        return (
          <div key={field.key} className="rx-textentry-field">
            <FieldBox
              label={field.label}
              inputMode="text"
              value={values[field.key] ?? ''}
              disabled={fieldIsAbsent}
              error={submitAttempted && !isSatisfied(field) ? 'Required' : undefined}
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
