"use client";

export function speakText(text: string, rate = 0.95) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { ok: false, reason: "当前浏览器不支持浏览器朗读。" };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return { ok: true };
}

export function hasSpeechRecognition() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}
