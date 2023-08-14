import { parentPort } from "node:worker_threads";

import { precise } from "precise";
import retsu from "retsu";

import { LRUCache as LRUCacheHyphen } from "lru-cache";
import JsLru from "js-lru";

// import { LRUCache } from "lru_cache";
// import lruCache from "lru_cache";
// const LRUCache = lruCache.LRUCache;

import Simple from "simple-lru-cache";
// import { LRUCache as Fast } from "lru-fast";
import lruFast from "lru-fast";
const Fast = lruFast.LRUCache;

import QuickLRU from "quick-lru";
import Modern from "modern-lru";
import hyperlru from "hyperlru";
import lru_map from "lru_map";
import MKC from "mkc";
import { LRUCache as MostRecent } from "most-recent";

import MnemonistLRUCache from "mnemonist/lru-cache.js";
import MnemonistLRUMap from "mnemonist/lru-map.js";
import { WeakLRUCache } from "@ekwoka/weak-lru-cache";

import hyperlruObjectImport from "hyperlru-object";
const hyperlruObject = hyperlru(hyperlruObjectImport);
import hyperlryMapImport from "hyperlru-map";
const hyperlruMap = hyperlru(hyperlryMapImport);

const caches = {
  "lru-cache": (n) => new LRUCacheHyphen({ max: n }),
  "lru-fast": (n) => new Fast(n),
  lru_map: (n) => new lru_map.LRUMap(n),
  "js-lru": (n) => new JsLru.LRUCache(n),
  "modern-lru": (n) => new Modern(n),
  "quick-lru": (maxSize) => new QuickLRU({ maxSize }),
  "secondary-cache": await import("secondary-cache").then((m) => m.default),
  "simple-lru-cache": (maxSize) => new Simple({ maxSize }),
  "tiny-lru": await import("tiny-lru").then((m) => m.lru),
  hashlru: await import("hashlru").then((m) => m.default),
  "hyperlru-object": (max) => hyperlruObject({ max }),
  "hyperlru-map": (max) => hyperlruMap({ max }),
  //lru_cache: n => new LRUCache(n),
  lru: await import("lru").then((m) => m.default),
  mkc: (max) => new MKC({ max }),
  "mnemonist/lru-cache.js": (n) => new MnemonistLRUCache(n),
  "mnemonist/lru-map.js": (n) => new MnemonistLRUMap(n),
  "@ekwoka/weak-lru-cache": (n) => WeakLRUCache({ size: n }),
  "most-recent": (n) => new MostRecent(n),
};
const NUM = 200_000;
const EVICT = NUM * 2;
const TIMES = 20;
const X = 1_000_000;

const data1 = new Array(EVICT).fill(0).map((_, index) => {
  return [index, { hello: Math.floor(Math.random() * 1e7) }];
});
const data2 = new Array(EVICT).fill(0).map((_, index) => {
  return [index, { world: Math.floor(Math.random() * 1e7) }];
});

parentPort.on("message", (ev) => {
  const id = ev,
    time = {
      set: [],
      get1: [],
      update: [],
      get2: [],
      evict: [],
      evict2: [],
    },
    results = {
      name: id,
      set: 0,
      get1: 0,
      update: 0,
      get2: 0,
      evict: 0,
      evict2: 0,
    };

  let n = -1;

  while (++n < TIMES) {
    const lru = caches[id](NUM);
    const stimer = precise().start();
    for (let i = 0; i < NUM; i++) lru.set(data1[i][0], data1[i][1]);
    time.set.push(stimer.stop().diff() / X);

    const gtimer = precise().start();
    for (let i = 0; i < NUM; i++) lru.get(data1[i][0]);
    time.get1.push(gtimer.stop().diff() / X);

    const utimer = precise().start();
    for (let i = 0; i < NUM; i++) lru.set(data1[i][0], data2[i][1]);
    time.update.push(utimer.stop().diff() / X);

    const g2timer = precise().start();
    for (let i = 0; i < NUM; i++) lru.get(data1[i][0]);
    time.get2.push(g2timer.stop().diff() / X);

    const etimer = precise().start();
    for (let i = NUM; i < EVICT; i++) lru.set(data1[i][0], data1[i][1]);
    time.evict.push(etimer.stop().diff() / X);

    const e2timer = precise().start();
    for (let i = NUM; i < EVICT; i++) lru.set(data2[i][0], data2[i][1]);
    time.evict2.push(e2timer.stop().diff() / X);
  }

  ["set", "get1", "update", "get2", "evict", "evict2"].forEach((i) => {
    results[i] = Number((NUM / retsu.median(time[i]).toFixed(2)).toFixed(0));
  });

  parentPort.postMessage(JSON.stringify(results));
});
