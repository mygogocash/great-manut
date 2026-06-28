export const IDEA_STATUSES = [
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "planned", label: "Planned" },
  { value: "shipped", label: "Shipped" },
  { value: "dropped", label: "Dropped" },
] as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[number]["value"];

export const KANBAN_STATUSES = IDEA_STATUSES.filter(
  (s) => s.value !== "dropped"
);

export const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;
