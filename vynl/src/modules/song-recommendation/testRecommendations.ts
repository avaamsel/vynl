// When running with Node ESM/ts-node ESM the importer needs an explicit file
// extension. Import the TS file directly so the ESM loader can resolve it.
import { getRecommendationsForSongTable } from "./recommendationUtils.ts";

async function test() {
  const seedSongs = [
    { artist: "nowifi", title: "Without Me" },
    { artist: "Milco", title: "Sippin" },
  ];

  try {
    const recommendations = await getRecommendationsForSongTable(seedSongs, 10);
    console.log("Top recommendations:", recommendations);
  } catch (error) {
    console.error("Error during recommendation test:", error);
  }
}

test();
