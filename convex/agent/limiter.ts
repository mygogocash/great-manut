import { Id } from "../_generated/dataModel";

/**
 * Agent-component thread owner key. Threads are stored in the agent
 * component keyed by this composite id, scoping every thread to a single
 * (organization, user) pair — listing/reading threads can therefore never
 * cross org boundaries.
 */
export function threadUserKey(
  orgId: Id<"organizations">,
  userId: Id<"users">
): string {
  return `${orgId}:${userId}`;
}
