// When running with Node ESM/ts-node ESM the importer needs an explicit file
// extension. Import the TS file directly so the ESM loader can resolve it.
import { getRecommendationsForSongTable } from "./recommendationUtils.ts";

async function test() {
  const seedSongs = [
    { artist: "Bl3ss", title: "Kisses (feat. bbyclose)" },
    { artist: "Disco Lines", title: "No Broke Boys" },
  ];

  try {
    const recommendations = await getRecommendationsForSongTable(seedSongs, 15);
    console.log("Top recommendations:", recommendations);
  } catch (error) {
    console.error("Error during recommendation test:", error);
  }
}

test();
