"use client";
import { openDB } from "idb";

const DB_NAME = "pwc-offline-db";
const STORE_NAME = "pendingBeneficiaries";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId", autoIncrement: true });
      }
    },
  });
}

export async function queueBeneficiary(record) {
  const db = await getDb();
  await db.add(STORE_NAME, { ...record, savedAt: new Date().toISOString() });
}

export async function getQueuedBeneficiaries() {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function removeQueuedBeneficiary(localId) {
  const db = await getDb();
  await db.delete(STORE_NAME, localId);
}

export async function countQueuedBeneficiaries() {
  const db = await getDb();
  return db.count(STORE_NAME);
}
