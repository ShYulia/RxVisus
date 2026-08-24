import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';
import TestChips from './TestChips';

export interface TextEntryFieldDef {
  key: string;
  label: string;
}

export interface TextEntryFormProps {
  fields: TextEntryFieldDef[];
  /** Reorganizes `fields` into labeled visual sections (e.g. "BI"/"BO") — `fields` stays the source of truth for values. */
  groups?: { label: string; keys: string[] }[];
  helperText?: string;
  testIds?: string[];
  /** Carried to a linked Test Card so its Back returns here. */
  backState?: Record<string, unknown>;
  onSubmit: (values: Record<string, string>) => void;
}

/** Short free-text recording (e.g. VA per eye) — always submittable, since it's context, not a gating measurement. */
const TextEntryForm: React.FC<TextEntryFormProps> = ({ fields, groups, helperText, testIds, backState, onSubmit }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));

  const renderFields = (defs: TextEntryFieldDef[]) => (
    <FieldBoxGrid columns={defs.length <= 2 ? 2 : 3}>
      {defs.map((field) => (
        <FieldBox
          key={field.key}
          label={field.label}
          inputMode="text"
          value={values[field.key] ?? ''}
          onChange={(v) => setValues((cur) => ({ ...cur, [field.key]: v }))}
        />
      ))}
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
      <IonButton className="rx-btn-solid" expand="block" onClick={() => onSubmit(values)} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
    </div>
  );
};

export default TextEntryForm;
