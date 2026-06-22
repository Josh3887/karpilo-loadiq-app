export const ATLAS_OVERLAY_VISIBILITY_STORAGE_KEY =
  "loadiq.karpiloAtlasOverlay.visible";
export const ATLAS_CORE_EVENT = "loadiq:karpilo-atlas-core-open";
export const ATLAS_OVERLAY_VISIBILITY_EVENT =
  "loadiq:karpilo-atlas-visibility-updated";
export const ATLAS_EDUCATIONAL_CONTEXT_EVENT =
  "loadiq:atlas-educational-context-requested";

export type AtlasEducationalContextRequestDetail = {
  key: string;
  source?: string;
};

export function readAtlasOverlayVisibility() {
  if (typeof window === "undefined") return false;

  return (
    window.localStorage.getItem(ATLAS_OVERLAY_VISIBILITY_STORAGE_KEY) === "true"
  );
}

export function writeAtlasOverlayVisibility(visible: boolean) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    ATLAS_OVERLAY_VISIBILITY_STORAGE_KEY,
    String(visible)
  );
  window.dispatchEvent(
    new CustomEvent(ATLAS_OVERLAY_VISIBILITY_EVENT, {
      detail: { visible },
    })
  );
}

export function subscribeAtlasOverlayVisibility(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  function onStorage(event: StorageEvent) {
    if (event.key === ATLAS_OVERLAY_VISIBILITY_STORAGE_KEY) {
      callback();
    }
  }

  window.addEventListener(ATLAS_OVERLAY_VISIBILITY_EVENT, callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(ATLAS_OVERLAY_VISIBILITY_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function requestAtlasEducationalContext(
  request: string | AtlasEducationalContextRequestDetail
) {
  if (typeof window === "undefined") return;

  const detail =
    typeof request === "string"
      ? { key: request }
      : { key: request.key, source: request.source };

  window.dispatchEvent(
    new CustomEvent<AtlasEducationalContextRequestDetail>(
      ATLAS_EDUCATIONAL_CONTEXT_EVENT,
      { detail }
    )
  );
}

export function subscribeAtlasEducationalContextRequests(
  callback: (detail: AtlasEducationalContextRequestDetail) => void
) {
  if (typeof window === "undefined") return () => {};

  function onContextRequest(event: Event) {
    const customEvent =
      event as CustomEvent<AtlasEducationalContextRequestDetail>;
    const key = customEvent.detail?.key?.trim();

    if (!key) return;

    callback({
      key,
      source: customEvent.detail?.source,
    });
  }

  window.addEventListener(ATLAS_EDUCATIONAL_CONTEXT_EVENT, onContextRequest);

  return () => {
    window.removeEventListener(
      ATLAS_EDUCATIONAL_CONTEXT_EVENT,
      onContextRequest
    );
  };
}
