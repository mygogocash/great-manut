import { Doc } from "../_generated/dataModel";

/** Map Convex Auth `image` to the `imageUrl` shape used across the UI. */
export function userImageUrl(
  user: Pick<Doc<"users">, "image"> | null | undefined
): string | undefined {
  return user?.image;
}

export function userDisplayName(
  user: Pick<Doc<"users">, "name" | "email"> | null | undefined
): string {
  if (!user) {
    return "Unknown";
  }
  return user.name?.trim() || user.email || "Unknown";
}
