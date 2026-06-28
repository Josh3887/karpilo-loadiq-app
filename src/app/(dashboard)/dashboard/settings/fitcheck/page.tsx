import { FitCheckProfilePanel } from "@/components/fitcheck/fitcheck-profile-panel";
import { SettingsPageShell, SettingsPanel } from "@/components/settings/settings-shell";

export default function FitCheckProfilePage() {
  return (
    <SettingsPageShell
      title="FitCheck Profile Review"
      description="Review reusable FitCheck answers that can hydrate the Settings operating profile. This route is a snapshot review surface, not a separate profile source of truth."
    >
      <SettingsPanel
        title="Saved FitCheck Snapshot"
        description="Only reusable profile fields are saved by default. Sensitive financial result snapshots are saved only after explicit opt-in, and Settings remains the operating-profile source of truth."
      >
        <FitCheckProfilePanel />
      </SettingsPanel>
    </SettingsPageShell>
  );
}
