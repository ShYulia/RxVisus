/** Interrupts the wizard flow for a finding-specific red flag — impossible to miss, must be acknowledged to continue. */
const RedFlagAlert: React.FC<{ message: string; onContinue: () => void }> = ({ message, onContinue }) => (
  <div className="rx-alert-overlay" role="alertdialog" aria-modal="true" aria-label="Urgent assessment may be indicated">
    <div className="rx-alert-box">
      <p className="rx-alert-title">Urgent assessment may be indicated</p>
      <p className="rx-alert-message">{message}</p>
      <button type="button" className="rx-alert-continue" onClick={onContinue}>
        Continue exam
      </button>
    </div>
  </div>
);

export default RedFlagAlert;
