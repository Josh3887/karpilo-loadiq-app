export const weatherRouteDateAlignmentTestScaffold = {
  status: "scaffold",
  scenario: {
    origin: "Denver, CO",
    destination: "Chicago, IL",
    pickup: "2026-12-18 08:00 America/Denver",
    estimatedTransitHours: 16,
  },
  futureAssertions: [
    "use analyzed load pickup and delivery dates, not only current weather",
    "evaluate weather along the route from origin to destination",
    "respect direction of travel",
    "sample route weather by projected time window",
    "normalize time zones across the route",
    "avoid counting alerts outside the route or travel window",
    "degrade clearly when a provider cannot support the required future forecast window",
    "Colorado is evaluated for the morning window",
    "Nebraska is evaluated for midday or afternoon",
    "Iowa is evaluated for evening",
    "Illinois is evaluated for overnight",
  ],
} as const;

