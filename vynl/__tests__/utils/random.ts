/*
    This file is used to store utility functions used to create a seeded random number
    and string generator. This will be used for having a deterministic random number
    generator for testing purposes.
*/

// Creates a seeded random number generator from a seed string.
export function makeSeededRand(seed: string) {
    const seed_nums = cyrb128(seed);
    return splitmix32(seed_nums[0]);
}

// Generates a random string given a random number generator
export function getRandomString(rand: () => number, length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(rand() * charactersLength));
  }
  return result;
}

// Generates a random float within a range giving a random number generator
export function getRandomFloat(rand: () => number, min: number, max: number) {
  return rand() * (max - min) + min;
}

// Generates a random int within a range giving a random number generator
export function getRandomInt(rand: () => number, min: number, max: number) {
    return Math.floor(getRandomFloat(rand, min, max));
}

// 128-bit hashing function used for seed generation
// Side note: Only designed & tested for seed generation,
// may be suboptimal as a general 128-bit hash.
function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

// A 32-bit state PRNG that was made by taking MurmurHash3's mixing function, adding a
// incrementor and tweaking the constants. It's potentially one of the better 32-bit PRNGs
// so far; even the author of Mulberry32 considers it to be the better choice.
// Returns random number generator, similar to that of Math.random()
function splitmix32(a: number) {
 return function(): number {
   a |= 0;
   a = a + 0x9e3779b9 | 0;
   let t = a ^ a >>> 16;
   t = Math.imul(t, 0x21f0aaad);
   t = t ^ t >>> 15;
   t = Math.imul(t, 0x735a2d97);
   return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}