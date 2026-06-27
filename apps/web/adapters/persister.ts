import { createIndexedDbPersister } from "tinybase/persisters/persister-indexed-db";
import type { LocalStore } from "@great-manut/core";
import type { StorageAdapter } from "@great-manut/core";

const STORE_ID = "great-manut-local-v1";

let persisterStarted = false;

export async function startLocalPersistence(store: LocalStore): Promise<void> {
  if (typeof indexedDB === "undefined" || persisterStarted) {
    return;
  }

  const persister = createIndexedDbPersister(store, STORE_ID);
  await persister.startAutoLoad();
  await persister.startAutoPersisting();
  persisterStarted = true;
}

export const browserStorageAdapter: StorageAdapter = {
  createPersister(storeId: string) {
    return {
      async load() {
        if (typeof localStorage === "undefined") {
          return undefined;
        }
        return localStorage.getItem(`great-manut:${storeId}`) ?? undefined;
      },
      async save(content: string) {
        if (typeof localStorage === "undefined") {
          return;
        }
        localStorage.setItem(`great-manut:${storeId}`, content);
      },
    };
  },
};
