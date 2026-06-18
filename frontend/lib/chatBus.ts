// Lightweight decoupled bridge so any component can open the Career Twin chat
// widget with a prefilled question (no prop drilling).
export const CHAT_ASK_EVENT = "careertwin:ask";

export function askCareerTwin(prompt: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHAT_ASK_EVENT, { detail: prompt }));
}
