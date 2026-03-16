import dynamic from "next/dynamic";

const WordLibraryScreen = dynamic(
  () => import("@/features/word-library/word-library-screen").then((mod) => mod.WordLibraryScreen),
  {
    loading: () => <div className="px-4 py-10 text-sm text-slate-500">Loading vocabulary library...</div>
  }
);

export default function WordLibraryPage() {
  return <WordLibraryScreen />;
}
