import {
  bootstrapSnapshotSchema,
  createLocalStore,
  hydrateBootstrap,
  listActiveIssues,
  SyncManager,
  bootstrapFromServer,
  type Issue,
  type LocalStore,
  type Team,
} from "@great-manut/core";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { browserHttpAdapter } from "../adapters/http.js";
import { browserWebSocketAdapter } from "../adapters/websocket.js";
import { getApiOrigin, memoryAuthAdapter } from "../adapters/auth.js";
import { startLocalPersistence } from "../adapters/persister.js";

const store = createLocalStore();
let persistenceReady: Promise<void> | null = null;

function ensurePersistence(): Promise<void> {
  if (!persistenceReady) {
    persistenceReady = startLocalPersistence(store).catch(() => {
      // IndexedDB may be unavailable in SSR or test environments.
    });
  }
  return persistenceReady;
}

void ensurePersistence();
let syncManager: SyncManager | null = null;

function subscribe(callback: () => void) {
  const listenerId = store.addTableListener("issues", callback);
  return () => {
    store.delListener(listenerId);
  };
}

export function useAppStore(): LocalStore {
  void ensurePersistence();
  return store;
}

export function useIssues(teamId: string | null): Issue[] {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (teamId ? listActiveIssues(store, teamId) : []),
    () => []
  );
  return snapshot;
}

export function useTeams(): Team[] {
  return useSyncExternalStore(
    (callback) => {
      const listenerId = store.addTableListener("teams", callback);
      return () => store.delListener(listenerId);
    },
    () => Object.values(store.getTable("teams")).map((row) => row as unknown as Team),
    () => []
  );
}

export async function loginWithMagicCode(email: string, code: string): Promise<void> {
  const response = await browserHttpAdapter.request(`${getApiOrigin()}/api/auth/magic-code/verify`, {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    throw new Error("Invalid login code");
  }

  const tokens = await response.json<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>();

  memoryAuthAdapter.setTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
  });
}

export async function requestMagicCode(email: string): Promise<void> {
  const response = await browserHttpAdapter.request(`${getApiOrigin()}/api/auth/magic-code/initiate`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Unable to send magic code");
  }
}

export async function bootstrapOrg(orgSlug: string): Promise<void> {
  const token = memoryAuthAdapter.getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const snapshot = bootstrapSnapshotSchema.parse(
    await bootstrapFromServer(browserHttpAdapter, getApiOrigin(), orgSlug, token)
  );
  hydrateBootstrap(store, {
    teams: snapshot.teams,
    states: snapshot.states,
    issues: snapshot.issues,
    labels: snapshot.labels,
  });

  syncManager?.stop();
  syncManager = new SyncManager({
    store,
    http: browserHttpAdapter,
    ws: browserWebSocketAdapter,
    getAccessToken: () => memoryAuthAdapter.getAccessToken(),
    apiOrigin: getApiOrigin(),
    orgSlug,
  });
  await syncManager.start();
}

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(memoryAuthAdapter.getAccessToken());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setToken(memoryAuthAdapter.getAccessToken());
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  return useMemo(() => token, [token]);
}

export function logout() {
  syncManager?.stop();
  syncManager = null;
  memoryAuthAdapter.clearTokens();
}
