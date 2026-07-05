export type WorkspaceRoute =
  | { kind: "home" }
  | { kind: "projects" }
  | { kind: "cycles" }
  | { kind: "ai" }
  | { kind: "search" }
  | { kind: "discovery" }
  | { kind: "service" }
  | { kind: "service-request"; requestId: string }
  | { kind: "docs" }
  | { kind: "docs-space"; spaceId: string }
  | { kind: "docs-page"; pageId: string }
  | { kind: "team"; teamId: string }
  | { kind: "team-board"; teamId: string }
  | { kind: "unknown" };

/** Map optional catch-all segments to a workspace view (sidebar routes only). */
export function parseWorkspaceRoute(
  section: string[] | undefined,
): WorkspaceRoute {
  if (!section || section.length === 0) {
    return { kind: "home" };
  }

  const [first, second, third] = section;

  if (first === "projects" && section.length === 1) {
    return { kind: "projects" };
  }
  if (first === "cycles" && section.length === 1) {
    return { kind: "cycles" };
  }
  if (first === "ai" && section.length === 1) {
    return { kind: "ai" };
  }
  if (first === "search" && section.length === 1) {
    return { kind: "search" };
  }
  if (first === "discovery" && section.length === 1) {
    return { kind: "discovery" };
  }
  if (first === "service" && section.length === 1) {
    return { kind: "service" };
  }
  if (first === "docs" && section.length === 1) {
    return { kind: "docs" };
  }
  if (first === "docs" && second === "space" && third && section.length === 3) {
    return { kind: "docs-space", spaceId: third };
  }
  if (first === "docs" && second === "page" && third && section.length === 3) {
    return { kind: "docs-page", pageId: third };
  }
  if (first === "team" && second && section.length === 2) {
    return { kind: "team", teamId: second };
  }
  if (first === "team" && second && third === "board" && section.length === 3) {
    return { kind: "team-board", teamId: second };
  }
  if (first === "service" && second && section.length === 2) {
    return { kind: "service-request", requestId: second };
  }

  return { kind: "unknown" };
}
