# bench-lru

benchmark the least-recently-used caches which are available on npm.

## Introduction

An LRU cache is a cache with bounded memory use.
The point of a cache is to improve performance,
so how performant are the available implementations?

LRUs achive bounded memory use by removing the oldest items when a threashold number of items
is reached. We measure 3 cases, adding an item, updating an item, and adding items
which push other items out of the LRU.

There is a [previous benchmark](https://www.npmjs.com/package/bench-cache)
but it did not describe it's methodology. (and since it measures the memory used,
but tests everything in the same process, it does not get clear results)

## Benchmark

I run a very simple multi-process benchmark, with 5 iterations to get a median of ops/ms:

1. Set the LRU to fit max N=200,000 items.
2. Add N random numbers to the cache, with keys 0-N.
3. Then update those keys with new random numbers.
4. Then _evict_ those keys, by adding keys N-2N.

### Results

Operations per millisecond (*higher is better*) on Node.js v20.5.1:

| name                                                                           | set     | get1    | update  | get2    | evict   | evict2  |
|--------------------------------------------------------------------------------|---------|---------|---------|---------|---------|---------|
| [least-recent](https://www.npmjs.com/package/least-recent)                     |   40080 |   57637 |   39139 |   56022 |   11007 |   52083 |
| [simple-lru-cache](https://npmjs.com/package/simple-lru-cache)                 |    7628 |   90090 |   48193 |   57971 |    9479 |   47059 |
| [mnemonist/lru-cache.js](https://www.npmjs.com/package/mnemonist)              |   38536 |   58480 |   26316 |   56180 |    7388 |   43290 |
| [lru-fast](https://npmjs.com/package/lru-fast)                                 |   10741 |   38610 |   22297 |   67114 |    5385 |   41068 |
| [js-lru](https://www.npmjs.com/package/js-lru)                                 |    5147 |   16964 |   16474 |   34542 |    6882 |   29762 |
| [mnemonist/lru-map.js](https://www.npmjs.com/package/mnemonist)                |    6295 |   24272 |   16090 |   19900 |    6378 |   19120 |
| [tiny-lru](https://npmjs.com/package/tiny-lru)                                 |    5588 |   17544 |   20161 |   17715 |    5525 |   18939 |
| [lru-cache](https://npmjs.com/package/lru-cache)                               |    5999 |   17937 |   13689 |   17825 |    5453 |   17094 |
| [hyperlru-object](https://npmjs.com/package/hyperlru-object)                   |    4077 |   13342 |   12308 |   12270 |    5362 |   12477 |
| [hashlru](https://npmjs.com/package/hashlru)                                   |   40404 |   43384 |   21053 |   43478 |   12430 |   11876 |
| [lru_map](https://www.npmjs.com/package/lru_map)                               |    5013 |   13746 |   11211 |   13569 |    3893 |   11123 |
| [quick-lru](https://npmjs.com/package/quick-lru)                               |    6651 |    5591 |   10065 |    5472 |   10199 |   10730 |
| [modern-lru](https://npmjs.com/package/modern-lru)                             |    4606 |    9713 |    8354 |    9079 |    3360 |    9950 |
| [secondary-cache](https://npmjs.com/package/secondary-cache)                   |    4582 |   10267 |    6906 |    9960 |    3198 |    9643 |
| [hyperlru-map](https://npmjs.com/package/hyperlru-map)                         |    3494 |    8811 |    8692 |    8200 |    2908 |    9629 |
| [lru](https://www.npmjs.com/package/lru)                                       |    4672 |    5669 |    4485 |    5531 |    3295 |    5587 |
| [@ekwoka/weak-lru-cache](https://www.npmjs.com/package/@ekwoka/weak-lru-cache) |    3650 |    4786 |    4149 |    4679 |    1783 |    4196 |
| [mkc](https://npmjs.com/packacge/package/mkc)                                  |    2573 |    3438 |    1783 |    3720 |    1417 |    1808 |


We can group the results in a few categories:

* all rounders (mnemonist, lru_cache, tiny-lru, simple-lru-cache, lru-fast) where the performance to add update and evict are comparable.
* fast-write, slow-evict (lru, hashlru, lru-native, modern-lru) these have better set/update times, but for some reason are quite slow to evict items!
* slow in at least 2 categories (lru-cache, mkc, faster-lru-cache, secondary-cache)

## Discussion

It appears that all-round performance is the most difficult to achive, in particular,
performance on eviction is difficult to achive. I think eviction performance is the most important
consideration, because once the cache is _warm_ each subsequent addition causes an eviction,
and actively used, _hot_, cache will run close to it's eviction performance.
Also, some have faster add than update, and some faster update than add.

`modern-lru` gets pretty close to `lru-native` perf.
I wrote `hashlru` after my seeing the other results from this benchmark, it's important to point
out that it does not use the classic LRU algorithm, but has the important properties of the LRU
(bounded memory use and O(1) time complexity)

Splitting the benchmark into multiple processes helps minimize JIT state pollution (gc, turbofan opt/deopt, etc.), and we see a much clearer picture of performance per library.

## Future work

This is still pretty early results, take any difference smaller than an order of magnitude with a grain of salt.

It is necessary to measure the statistical significance of the results to know accurately the relative performance of two closely matched implementations.

I also didn't test the memory usage. This should be done running the benchmarks each in a separate process, so that the memory used by each run is not left over while the next is running.

## Conclusion

Javascript is generally slow, so one of the best ways to make it fast is to write less of it.
LRUs are also quite difficult to implement (linked lists!). In trying to come up with a faster
LRU implementation I realized that something far simpler could do the same job. Especially
given the strengths and weaknesses of javascript, this is significantly faster than any of the
other implementations, _including_ the C implementation. Likely, the overhead of the C<->js boundry
is partly to blame here.

## License

MIT
