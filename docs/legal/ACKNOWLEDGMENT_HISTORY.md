# Acknowledgment History

This file is an immutable log of every version of RxKit's first-launch
clinical-use acknowledgment (`src/components/FirstLaunchAcknowledgment.tsx`).

**When the acknowledgment wording materially changes, add a new dated
version entry below — never edit or replace an existing entry.** Each
entry is the permanent record of what a given `acknowledgmentVersion`
actually said, independent of what the app happens to show today.

Bumping `ACKNOWLEDGMENT_VERSION` in `src/store/onboardingStore.ts`
causes every device to be re-prompted, regardless of any prior
acknowledgment — see that file for the mechanism.

---

## Version 1.0

- **Effective date:** 2026-09-01
- **`ACKNOWLEDGMENT_VERSION`:** `"1.0"`

### Text shown to the user

> **RxKit**
>
> **Before you begin**
>
> - RxKit is intended for qualified eye-care professionals.
> - It is a clinical reference and decision-support tool — not a diagnostic device.
> - Calculations, findings, and interpretations must be independently verified.
> - You remain responsible for diagnosis, management, and treatment decisions.

### Action button text

> I understand

### Local storage of acceptance

Tapping "I understand" persists an `AcknowledgmentRecord` locally via
Capacitor Preferences (`src/store/onboardingStore.ts`), containing:

- `acknowledged`: `true`
- `acknowledgedAt`: ISO 8601 timestamp of acceptance
- `acknowledgmentVersion`: `"1.0"`
- `appVersion`: RxKit's `package.json` version at the time of acceptance

No account, backend, analytics platform, or device identifier is
involved — the record never leaves the device.
