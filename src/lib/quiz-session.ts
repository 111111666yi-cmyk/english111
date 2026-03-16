export interface QuizSessionState {
  quizId: string;
  selected: string;
  textAnswer: string;
  reorderAnswer: string[];
  matchedPairs: string[];
  activeLeft: string;
  feedbackVisible: boolean;
  feedbackCorrect: boolean;
}

export function createEmptyQuizSession(quizId = ""): QuizSessionState {
  return {
    quizId,
    selected: "",
    textAnswer: "",
    reorderAnswer: [],
    matchedPairs: [],
    activeLeft: "",
    feedbackVisible: false,
    feedbackCorrect: false
  };
}

export function normalizeQuizSession(
  session?: Partial<QuizSessionState> | null,
  quizId = ""
): QuizSessionState {
  return {
    quizId: session?.quizId ?? quizId,
    selected: session?.selected ?? "",
    textAnswer: session?.textAnswer ?? "",
    reorderAnswer: Array.isArray(session?.reorderAnswer) ? session.reorderAnswer : [],
    matchedPairs: Array.isArray(session?.matchedPairs) ? session.matchedPairs : [],
    activeLeft: session?.activeLeft ?? "",
    feedbackVisible: Boolean(session?.feedbackVisible),
    feedbackCorrect: Boolean(session?.feedbackCorrect)
  };
}
