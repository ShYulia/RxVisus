import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { FieldBox, FieldBoxGrid } from '../../components/FieldBox';

export interface TextEntryFieldDef {
  key: string;
  label: string;
}

export interface TextEntryFormProps {
  fields: TextEntryFieldDef[];
  helperText?: string;
  onSubmit: (values: Record<string, string>) => void;
}

/** Short free-text recording (e.g. VA per eye) — always submittable, since it's context, not a gating measurement. */
const TextEntryForm: React.FC<TextEntryFormProps> = ({ fields, helperText, onSubmit }) => {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <div className="rx-textentry-form">
      <FieldBoxGrid columns={fields.length <= 2 ? 2 : 3}>
        {fields.map((field) => (
          <FieldBox
            key={field.key}
            label={field.label}
            inputMode="text"
            value={values[field.key] ?? ''}
            onChange={(v) => setValues((cur) => ({ ...cur, [field.key]: v }))}
          />
        ))}
      </FieldBoxGrid>
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
