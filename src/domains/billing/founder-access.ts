import { FOUNDER_ACCESS } from "@/config/pricing";

export type FounderAccessState = {
  hasAccess: boolean;
  claimedSeats: number;
};

export function canClaimFounderAccess(state: FounderAccessState) {
  return state.hasAccess && state.claimedSeats < FOUNDER_ACCESS.maxSeats;
}

export function founderSeatLabel(claimedSeats: number) {
  return `${claimedSeats}/${FOUNDER_ACCESS.maxSeats} claimed`;
}
