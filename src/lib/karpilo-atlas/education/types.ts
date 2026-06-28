import type { KarpiloAtlasReferenceLibrary } from "../types";

export type KarpiloAtlasEducationLessonType =
  | "tutorial"
  | "warning"
  | "regulation_awareness"
  | "tip"
  | "feature_guidance"
  | "tier_guidance"
  | "mistake_correction";

export type KarpiloAtlasEducationUserLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "professional";

export type KarpiloAtlasEducationOutput = {
  lessonType: KarpiloAtlasEducationLessonType;
  userLevel: KarpiloAtlasEducationUserLevel;
  topic: string;
  explanation: string;
  actionSteps: string[];
  cautionNotes: string[];
  relatedAppFeatures: string[];
  sourceLibrariesUsed: KarpiloAtlasReferenceLibrary[];
  disclaimerRequired: boolean;
  guardrailsApplied: string[];
};
