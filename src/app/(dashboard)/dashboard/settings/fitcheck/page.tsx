import { FitCheckProfilePanel } from "@/components/fitcheck/fitcheck-profile-panel";
import { SettingsPageShell, SettingsPanel } from "@/components/settings/settings-shell";

export default function FitCheckProfilePage() {
  return (
    <SettingsPageShell
      title="FitCheck Settings Review"
      description="Review reusable FitCheck defaults, operator income goals, operating assumptions, load preferences, and saved FitCheck results used by Settings."
    >
      <SettingsPanel
        title="Saved FitCheck Settings"
        description="Only reusable profile fields are saved by default. Sensitive financial result snapshots are saved only after explicit opt-in."
      >
        <FitCheckProfilePanel />
      </SettingsPanel>
    </SettingsPageShell>
  );
}
