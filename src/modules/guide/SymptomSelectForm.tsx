import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { SymptomOption } from '../../domain/reference/clinicalPathways';

export interface SymptomSelectFormProps {
  options: SymptomOption[];
  exclusiveKey?: string;
  onSubmit: (selectedKeys: string[]) => void;
}

/** Multi-select symptom checklist — tapping the exclusive option (e.g. "No symptoms") clears every other selection, and vice versa. */
const SymptomSelectForm: React.FC<SymptomSelectFormProps> = ({ options, exclusiveKey, onSubmit }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (key === exclusiveKey) {
        return next.has(key) ? new Set() : new Set([key]);
      }
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        if (exclusiveKey) next.delete(exclusiveKey);
      }
      return next;
    });
  };

  return (
    <div className="rx-symptom-select">
      <div className="rx-wizard-choices">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`rx-wizard-choice rx-symptom-choice ${selected.has(option.key) ? 'rx-symptom-choice-active' : ''}`}
            onClick={() => toggle(option.key)}
          >
            <span>{option.label}</span>
            <span className="rx-symptom-check" aria-hidden="true">
              {selected.has(option.key) ? '✓' : ''}
            </span>
          </button>
        ))}
      </div>
      <IonButton className="rx-btn-solid" expand="block" onClick={() => onSubmit([...selected])} style={{ marginTop: 20 }}>
        Continue
      </IonButton>
    </div>
  );
};

export default SymptomSelectForm;
