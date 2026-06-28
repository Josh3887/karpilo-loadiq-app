export const verifyProviderDocLinksScaffold = {
  status: "scaffold",
  purpose:
    "Future check that each category-scoped provider contract includes official provider, endpoint, auth, quota/rate, and last verified fields.",
  normalCiBehavior: "must use static docs/mocks unless explicit live link checking is enabled",
  liveProviderAccess: false,
} as const;

