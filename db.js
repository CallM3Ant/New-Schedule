/* ==========================================================================
   Scheduly — IndexedDB persistence layer
   Mirrors the shape of ScheduleStore.swift: a `templates` table, a `plans`
   table keyed by yyyy-MM-dd, and a small `meta` table for settings/seed flag.
   No server, no localStorage — just the browser's built-in database.
   ========================================================================== */

const DB = (() => {
  const DB_NAME = "scheduly";
  const DB_VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("templates")) {
          db.createObjectStore("templates", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("plans")) {
          db.createObjectStore("plans"); // key: "yyyy-MM-dd" -> value: Block[]
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta"); // key: string -> value: anything
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(storeName, mode) {
    return open().then((db) => db.transaction(storeName, mode).objectStore(storeName));
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAll(storeName) {
    const store = await tx(storeName, "readonly");
    return reqToPromise(store.getAll());
  }

  async function getAllKV(storeName) {
    const store = await tx(storeName, "readonly");
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    const [keys, vals] = await Promise.all([reqToPromise(keysReq), reqToPromise(valsReq)]);
    const out = {};
    keys.forEach((k, i) => { out[k] = vals[i]; });
    return out;
  }

  async function put(storeName, value, key) {
    const store = await tx(storeName, "readwrite");
    return reqToPromise(key !== undefined ? store.put(value, key) : store.put(value));
  }

  async function del(storeName, key) {
    const store = await tx(storeName, "readwrite");
    return reqToPromise(store.delete(key));
  }

  async function getMeta(key) {
    const store = await tx("meta", "readonly");
    return reqToPromise(store.get(key));
  }

  async function setMeta(key, value) {
    return put("meta", value, key);
  }

  // ---- Starter content, ported from ScheduleStore.seedStarterContent() ----
  function starterTemplates() {
    return [
      {
        id: crypto.randomUUID(),
        name: "Focused Workday",
        colorID: 2,
        blocks: [
          { id: crypto.randomUUID(), title: "Morning routine", startMinutes: 7 * 60, endMinutes: 8 * 60, details: "Stretch, shower, coffee", colorID: 6, alert: "alarm" },
          { id: crypto.randomUUID(), title: "Deep work", startMinutes: 9 * 60, endMinutes: 11 * 60, details: "Most important task first", colorID: 2, alert: "notify" },
          { id: crypto.randomUUID(), title: "Lunch & walk", startMinutes: 12 * 60, endMinutes: 13 * 60, details: "", colorID: 5, alert: "notify" },
          { id: crypto.randomUUID(), title: "Meetings", startMinutes: 14 * 60, endMinutes: 16 * 60, details: "Standup · 1:1s", colorID: 3, alert: "notify" },
          { id: crypto.randomUUID(), title: "Wind down", startMinutes: 21 * 60, endMinutes: 22 * 60, details: "Plan tomorrow", colorID: 1, alert: "none" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Rest Day",
        colorID: 4,
        blocks: [
          { id: crypto.randomUUID(), title: "Slow morning", startMinutes: 9 * 60, endMinutes: 11 * 60, details: "", colorID: 6, alert: "none" },
          { id: crypto.randomUUID(), title: "Workout", startMinutes: 11 * 60, endMinutes: 12 * 60, details: "", colorID: 4, alert: "alarm" },
          { id: crypto.randomUUID(), title: "Friends", startMinutes: 18 * 60, endMinutes: 20 * 60, details: "", colorID: 7, alert: "notify" },
        ],
      },
    ];
  }

  async function seedIfNeeded(dateKeyForToday) {
    const seeded = await getMeta("seeded");
    if (seeded) return false;
    const templates = starterTemplates();
    for (const t of templates) await put("templates", t);
    const workday = templates[0];
    const freshBlocks = workday.blocks.map((b) => ({ ...b, id: crypto.randomUUID() }));
    await put("plans", freshBlocks, dateKeyForToday);
    await setMeta("seeded", true);
    return true;
  }

  return {
    async init(dateKeyForToday) {
      await open();
      await seedIfNeeded(dateKeyForToday);
    },
    getAllTemplates: () => getAll("templates"),
    putTemplate: (template) => put("templates", template),
    deleteTemplate: (id) => del("templates", id),
    getAllPlans: () => getAllKV("plans"),
    putPlan: (dateKey, blocks) => put("plans", blocks, dateKey),
    deletePlan: (dateKey) => del("plans", dateKey),
    clearAll: async () => {
      const t = await tx("templates", "readwrite"); await reqToPromise(t.clear());
      const p = await tx("plans", "readwrite"); await reqToPromise(p.clear());
    },
  };
})();
