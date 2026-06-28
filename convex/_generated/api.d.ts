/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as agent_chat from "../agent/chat.js";
import type * as agent_data from "../agent/data.js";
import type * as agent_embeddings from "../agent/embeddings.js";
import type * as agent_limiter from "../agent/limiter.js";
import type * as agent_models from "../agent/models.js";
import type * as agent_tools from "../agent/tools.js";
import type * as agent_triage from "../agent/triage.js";
import type * as agent_vectorAgent from "../agent/vectorAgent.js";
import type * as attachments from "../attachments.js";
import type * as auth from "../auth.js";
import type * as automations from "../automations.js";
import type * as comments from "../comments.js";
import type * as cycles from "../cycles.js";
import type * as docComments from "../docComments.js";
import type * as docs from "../docs.js";
import type * as epics from "../epics.js";
import type * as http from "../http.js";
import type * as ideas from "../ideas.js";
import type * as issueRelations from "../issueRelations.js";
import type * as issues from "../issues.js";
import type * as labels from "../labels.js";
import type * as lib_activity from "../lib/activity.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_automationEngine from "../lib/automationEngine.js";
import type * as lib_automationSchema from "../lib/automationSchema.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_slug from "../lib/slug.js";
import type * as lib_userDisplay from "../lib/userDisplay.js";
import type * as organizations from "../organizations.js";
import type * as presenceFns from "../presenceFns.js";
import type * as projects from "../projects.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as serviceDesk from "../serviceDesk.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as views from "../views.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  "agent/chat": typeof agent_chat;
  "agent/data": typeof agent_data;
  "agent/embeddings": typeof agent_embeddings;
  "agent/limiter": typeof agent_limiter;
  "agent/models": typeof agent_models;
  "agent/tools": typeof agent_tools;
  "agent/triage": typeof agent_triage;
  "agent/vectorAgent": typeof agent_vectorAgent;
  attachments: typeof attachments;
  auth: typeof auth;
  automations: typeof automations;
  comments: typeof comments;
  cycles: typeof cycles;
  docComments: typeof docComments;
  docs: typeof docs;
  epics: typeof epics;
  http: typeof http;
  ideas: typeof ideas;
  issueRelations: typeof issueRelations;
  issues: typeof issues;
  labels: typeof labels;
  "lib/activity": typeof lib_activity;
  "lib/auth": typeof lib_auth;
  "lib/automationEngine": typeof lib_automationEngine;
  "lib/automationSchema": typeof lib_automationSchema;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/limits": typeof lib_limits;
  "lib/slug": typeof lib_slug;
  "lib/userDisplay": typeof lib_userDisplay;
  organizations: typeof organizations;
  presenceFns: typeof presenceFns;
  projects: typeof projects;
  search: typeof search;
  seed: typeof seed;
  serviceDesk: typeof serviceDesk;
  teams: typeof teams;
  users: typeof users;
  views: typeof views;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
