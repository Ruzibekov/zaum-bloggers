export type Stage = "approval" | "scheduled" | "published" | "results" | "other";
export type BudgetKind = "paid" | "barter";

export interface Placement {
  id: string;
  row: number;
  article: string | null;
  blogger: string;
  platform: string | null;
  budget: BudgetKind | null;
  budgetLabel: string | null;
  followers: number | null;
  audienceAge: string | null;
  audienceGeo: string | null;
  storiesReach: number | null;
  reelsViews: number | null;
  cost: number | null;
  productCost: number | null;
  format: string | null;
  stage: Stage;
  statusLabel: string | null;
  date: string | null;
  adUrl: string | null;
  comment: string | null;
}

export type DatasetSource =
  | { kind: "file"; title: string }
  | { kind: "sheet"; title: string; url: string };

export interface Dataset {
  generatedAt: string;
  source: DatasetSource;
  placements: Placement[];
}
