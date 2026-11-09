import { z } from "zod";

export const facilitySchema = z.object({
  id: z.string().trim().min(1).max(300),
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().length(2),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/),
  source: z.enum(["driver_saved", "directory", "openstreetmap"]).default("directory"),
});
export type Facility = z.infer<typeof facilitySchema>;

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

// Conservative matching: preserve unit numbers and distinct businesses at one address.
export function facilityKey(facility: Facility) {
  return [facility.name, facility.address, facility.city, facility.state, facility.zip]
    .map(normalize).join("|");
}

export function searchFacilities(facilities: Facility[], query: string) {
  const terms = normalize(query).split(/\s+/);
  const matches = new Map<string, Facility>();
  for (const facility of facilities) {
    const key = facilityKey(facility);
    if (terms.every((term) => key.includes(term)) && !matches.has(key)) {
      matches.set(key, facility);
    }
    if (matches.size === 8) break;
  }
  return [...matches.values()];
}

// Read only driver input, never Google's formatted addresses, geocodes, or notes.
export function facilitiesFromSavedLoads(rows: Array<{ id: string; input_snapshot: unknown }>) {
  const facilities: Facility[] = [];
  for (const row of rows) {
    const input = row.input_snapshot;
    if (!input || typeof input !== "object" || Array.isArray(input)) continue;
    const values = input as Record<string, unknown>;
    for (const kind of ["pickup", "delivery"] as const) {
      const parsed = facilitySchema.safeParse({
        id: `saved:${row.id}:${kind}`,
        name: values[`${kind}FacilityName`] || values[`${kind}Address`],
        address: values[`${kind}Address`],
        city: values[`${kind}City`],
        state: values[`${kind}State`],
        zip: values[`${kind}Zip`],
        source: "driver_saved",
      });
      if (parsed.success) facilities.push(parsed.data);
    }
  }
  return facilities;
}
