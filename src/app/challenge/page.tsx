import { Suspense } from "react";
import { ChallengeScreen } from "@/features/challenge/challenge-screen";

export default function ChallengePage() {
  return (
    <Suspense fallback={null}>
      <ChallengeScreen />
    </Suspense>
  );
}
