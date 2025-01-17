import { Worker } from "node:worker_threads";
import ora from "ora";

const meta = {
  hashlru: { url: "https://npmjs.com/package/hashlru" },
  "hyperlru-map": { url: "https://npmjs.com/package/hyperlru-map" },
  "hyperlru-object": { url: "https://npmjs.com/package/hyperlru-object" },
  lru_map: { url: "https://www.npmjs.com/package/lru_map" },
  "js-lru": { url: "https://www.npmjs.com/package/js-lru" },
  lru: { url: "https://www.npmjs.com/package/lru" },
  "lru-cache": { url: "https://npmjs.com/package/lru-cache" },
  "lru-fast": { url: "https://npmjs.com/package/lru-fast" },
  //'lru_cache': {url: 'https://npmjs.com/package/lru_cache'},  // NOTE: temporarily withdrawn because of a capacity leak - see https://github.com/Empact/lru_cache/pull/2
  mkc: { url: "https://npmjs.com/packacge/package/mkc" },
  "modern-lru": { url: "https://npmjs.com/package/modern-lru" },
  "quick-lru": { url: "https://npmjs.com/package/quick-lru" },
  "secondary-cache": { url: "https://npmjs.com/package/secondary-cache" },
  "simple-lru-cache": { url: "https://npmjs.com/package/simple-lru-cache" },
  "tiny-lru": { url: "https://npmjs.com/package/tiny-lru" },
  "mnemonist/lru-cache.js": { url: "https://www.npmjs.com/package/mnemonist" },
  "mnemonist/lru-map.js": { url: "https://www.npmjs.com/package/mnemonist" },
  "@ekwoka/weak-lru-cache": { url: "https://www.npmjs.com/package/@ekwoka/weak-lru-cache" },
  "least-recent": { url: "https://www.npmjs.com/package/least-recent" },
};
const caches = Object.keys(meta);
const nth = caches.length;

const spinner = ora(`Starting benchmark of ${nth} caches`).start(),
  promises = [];

caches.forEach((i, idx) => {
  promises.push(
    new Promise((resolve, reject) => {
      return (idx === 0 ? Promise.resolve() : promises[idx - 1])
        .then(() => {
          const worker = new Worker("./worker.js");

          worker.on("message", (ev) => {
            resolve(ev);
            worker.terminate();
          });
          // worker.onmessage = (ev) => {
          //   resolve(ev.data);
          //   worker.terminate();
          // };

          worker.on("error", (err) => {
            reject(err);
            worker.terminate();
          });

          worker.onerror = (err) => {
            reject(err);
            worker.terminate();
          };

          spinner.text = `Benchmarking ${idx + 1} of ${nth} caches [${i}]`;
          worker.postMessage(i);
        })
        .catch(reject);
    }),
  );
});

try {
  const results = await Promise.all(promises);
  const { default: toMD } = await import("markdown-tables");
  const { keysort } = await import("keysort");

  const pad = (input) => {
    return String(input).padStart(7);
  };

  spinner.stop();
  console.log(
    toMD(
      ["name,set,get1,update,get2,evict,evict2"]
        .concat(
          keysort(
            results.map((i) => JSON.parse(i)),
            "evict2 desc, evict desc, set desc, get1 desc, update desc, get2 desc",
          ).map(
            (i) =>
              `[${i.name}](${meta[i.name].url}),${pad(i.set)},${pad(i.get1)},${pad(i.update)},${pad(i.get2)},${pad(
                i.evict,
              )},${pad(i.evict2)}`,
          ),
        )
        .join("\n"),
    ),
  );
} catch (err) {
  console.error(err.stack || err.message || err);
  process.exit(1);
}
