/** Product analytics event names — keep stable for PostHog dashboards. */
export const PostHogEvents = {
  userSignedUp: "user_signed_up",
  userSignedIn: "user_signed_in",
  workspaceCreated: "workspace_created",
  workspaceJoined: "workspace_joined",
  issueCreated: "issue_created",
  aiMessageSent: "ai_message_sent",
  planUpgradeClicked: "plan_upgrade_clicked",
  marketingCtaClicked: "marketing_cta_clicked",
} as const;

export type PostHogEventName =
  (typeof PostHogEvents)[keyof typeof PostHogEvents];
