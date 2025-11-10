// When running with Node ESM/ts-node ESM the importer needs an explicit file
// extension. Import the TS file directly so the ESM loader can resolve it.
import { ITunesSong } from "@/src/types/index.ts";
import { getRecommendationsForSongTable } from "./recommendationUtils.ts";

async function test() {
  const seedSongs: ITunesSong[] = [
    { artist: "Bl3ss", title: "Kisses (feat. bbyclose)", cover_url: "", preview_url: "", duration_sec: 30, song_id: 1},
    { artist: "Disco Lines", title: "No Broke Boys", cover_url: "", preview_url: "", duration_sec: 35, song_id: 2 },
  ];

  try {
    const recommendations = await getRecommendationsForSongTable(seedSongs, 15);
    console.log("Top recommendations:", recommendations);
  } catch (error) {
    console.error("Error during recommendation test:", error);
  }
}

test();
