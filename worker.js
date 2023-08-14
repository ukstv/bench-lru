import { parentPort } from "node:worker_threads";

import { precise } from "precise";
import retsu from "retsu";


import LRUCacheHyphen from "lru-cache";
import JsLru from 'js-lru'


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

import MnemonistLRUCache from "mnemonist/lru-cache.js";
import MnemonistLRUMap from "mnemonist/lru-map.js";

import hyperlruObjectImport from "hyperlru-object";
const hyperlruObject = hyperlru(hyperlruObjectImport);
import hyperlryMapImport from "hyperlru-map";
const hyperlruMap = hyperlru(hyperlryMapImport);

const caches = {
  "lru-cache": (n) => new LRUCacheHyphen(n),
  "lru-fast": (n) => new Fast(n),
  "lru_map": (n) => new lru_map.LRUMap(n),
  "js-lru": (n) => new JsLru.LRUCache(n),
  "modern-lru": (n) => new Modern(n),
  "quick-lru": (maxSize) => new QuickLRU({ maxSize }),
  "secondary-cache": await import("secondary-cache").then((m) => m.default),
  "simple-lru-cache": (maxSize) => new Simple({ maxSize }),
  "tiny-lru": await import("tiny-lru").then(m => m.lru),
  hashlru: await import("hashlru").then((m) => m.default),
  "hyperlru-object": (max) => hyperlruObject({ max }),
  "hyperlru-map": (max) => hyperlruMap({ max }),
  //lru_cache: n => new LRUCache(n),
  lru: await import("lru").then((m) => m.default),
  mkc: (max) => new MKC({ max }),
  "mnemonist-object": (n) => new MnemonistLRUCache(n),
  "mnemonist-map": (n) => new MnemonistLRUMap(n),
};
const num = 2e5;
const evict = num * 2;
const times = 5;
const x = 1e6;
const data1 = new Array(evict);
const data2 = new Array(evict);

(function seed() {
  let z = -1;

  while (++z < evict) {
    data1[z] = [z, Math.floor(Math.random() * 1e7)];
    data2[z] = [z, Math.floor(Math.random() * 1e7)];
  }
})();

parentPort.on("message", (ev) => {
  const id = ev,
    time = {
      set: [],
      get1: [],
      update: [],
      get2: [],
      evict: [],
    },
    results = {
      name: id,
      set: 0,
      get1: 0,
      update: 0,
      get2: 0,
      evict: 0,
    };

  let n = -1;

  while (++n < times) {
    const lru = caches[id](num);
    const stimer = precise().start();
    for (let i = 0; i < num; i++) lru.set(data1[i][0], data1[i][1]);
    time.set.push(stimer.stop().diff() / x);

    const gtimer = precise().start();
    for (let i = 0; i < num; i++) lru.get(data1[i][0]);
    time.get1.push(gtimer.stop().diff() / x);

    const utimer = precise().start();
    for (let i = 0; i < num; i++) lru.set(data1[i][0], data2[i][1]);
    time.update.push(utimer.stop().diff() / x);

    const g2timer = precise().start();
    for (let i = 0; i < num; i++) lru.get(data1[i][0]);
    time.get2.push(g2timer.stop().diff() / x);

    const etimer = precise().start();
    for (let i = num; i < evict; i++) lru.set(data1[i][0], data1[i][1]);
    time.evict.push(etimer.stop().diff() / x);
  }

  ["set", "get1", "update", "get2", "evict"].forEach((i) => {
    results[i] = Number((num / retsu.median(time[i]).toFixed(2)).toFixed(0));
  });

  parentPort.postMessage(JSON.stringify(results));
});
