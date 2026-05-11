export type AccessorialDirection = "revenue" | "expense";

export type AccessorialCategory =
  | "toll"
  | "lumper"
  | "scale"
  | "gate_fee"
  | "washout"
  | "parking"
  | "detention"
  | "layover"
  | "tonu"
  | "extra_stop"
  | "permit"
  | "escort"
  | "misc";

export type AccessorialInputItem = {
  id: string;
  category: AccessorialCategory;
  direction: AccessorialDirection;
  amount: number;
  isReimbursed: boolean;
  notes: string;
};