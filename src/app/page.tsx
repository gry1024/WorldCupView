import { WorldCupViewApp } from "@/components/worldcup-view-app";
import worldCupData from "@/data/worldcup-data.json";
import type { WorldCupData } from "@/lib/worldcup/types";

export default function Home() {
  return <WorldCupViewApp initialData={worldCupData as WorldCupData} />;
}
