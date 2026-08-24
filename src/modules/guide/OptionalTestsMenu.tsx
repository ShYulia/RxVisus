import { suggestOptionalTests } from '../../domain/reference/binocularOptionalHints';
import { parseBinocularFindings } from '../../domain/reference/binocularFindings';
import type { OptionalTestOption } from '../../domain/reference/clinicalPathways';

export interface OptionalTestsMenuProps {
  options: OptionalTestOption[];
  findings: Record<string, string>;
  onSelect: (option: OptionalTestOption) => void;
  onSkip: () => void;
}

/** Loop-back menu of optional/targeted tests — never mandatory, always skippable straight to the Summary. */
const OptionalTestsMenu: React.FC<OptionalTestsMenuProps> = ({ options, findings, onSelect, onSkip }) => {
  const hints = suggestOptionalTests(parseBinocularFindings(findings));

  return (
    <div className="rx-wizard-step">
      <p className="rx-wizard-question">Optional / targeted tests</p>

      {hints.length > 0 && (
        <div className="rx-optional-hints">
          {hints.map((hint) => (
            <p key={hint} className="rx-optional-hint">
              {hint}
            </p>
          ))}
        </div>
      )}

      <div className="rx-wizard-choices">
        {options.map((option) => (
          <button key={option.stepId} type="button" className="rx-wizard-choice" onClick={() => onSelect(option)}>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <button type="button" className="rx-optional-skip" onClick={onSkip}>
        Skip to Summary
      </button>
    </div>
  );
};

export default OptionalTestsMenu;
