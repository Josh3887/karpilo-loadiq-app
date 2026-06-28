export const ATLAS_EDUCATIONAL_ENABLED_STORAGE_KEY =
  "loadiq.atlasEducational.enabled";

export const ATLAS_EDUCATIONAL_ENABLED_EVENT =
  "loadiq:atlas-educational-enabled-updated";

export function readAtlasEducationalEnabled() {
  if (typeof window === "undefined") return true;

  return (
    window.localStorage.getItem(ATLAS_EDUCATIONAL_ENABLED_STORAGE_KEY) !==
    "false"
  );
}

export function writeAtlasEducationalEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    ATLAS_EDUCATIONAL_ENABLED_STORAGE_KEY,
    String(enabled)
  );
  window.dispatchEvent(
    new CustomEvent(ATLAS_EDUCATIONAL_ENABLED_EVENT, {
      detail: { enabled },
    })
  );
}

export function subscribeAtlasEducationalEnabled(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  function onStorage(event: StorageEvent) {
    if (event.key === ATLAS_EDUCATIONAL_ENABLED_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(ATLAS_EDUCATIONAL_ENABLED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ATLAS_EDUCATIONAL_ENABLED_EVENT, callback);
  };
}
