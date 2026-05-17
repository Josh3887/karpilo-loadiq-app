// TODO(Atlas migration): these iAtion event/storage keys remain as
// compatibility wiring until the floating overlay is replaced by embedded
// Atlas Intelligence surfaces.
export const IATION_VISIBILITY_STORAGE_KEY = "loadiq.iationOverlay.visible";
export const IATION_CORE_EVENT = "loadiq:iation-core-open";
export const IATION_VISIBILITY_EVENT = "loadiq:iation-visibility-updated";

export function readIationVisibility() {
  if (typeof window === "undefined") return true;

  return window.localStorage.getItem(IATION_VISIBILITY_STORAGE_KEY) !== "false";
}

export function writeIationVisibility(visible: boolean) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(IATION_VISIBILITY_STORAGE_KEY, String(visible));
  window.dispatchEvent(
    new CustomEvent(IATION_VISIBILITY_EVENT, {
      detail: { visible },
    })
  );
}

export function subscribeIationVisibility(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  function onStorage(event: StorageEvent) {
    if (event.key === IATION_VISIBILITY_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(IATION_VISIBILITY_EVENT, callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(IATION_VISIBILITY_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
