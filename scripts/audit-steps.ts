import { ALL_LESSONS, getLessonSteps } from "../src/content/study-lessons";

const SUPPORTED_KINDS = new Set([
  "which-tag-mini",
  "find-layer",
  "prompt-builder",
  "prompt-strength",
  "prompt-gallery",
  "action-step",
  "send-prompt",
  "checklist",
  "quiz",
  "hallucination-spotter",
  "fix-prompt",
  "role-swap",
]);

let problems = 0;
const issues: string[] = [];

for (const lesson of ALL_LESSONS) {
  const slug = lesson.slug;

  if (!lesson.content) {
    issues.push(`[${slug}] no content (status=${lesson.status})`);
    problems++;
    continue;
  }
  if (!lesson.content.landing?.youtubeVideoId) {
    issues.push(`[${slug}] no youtubeVideoId in landing`);
    problems++;
  }

  const steps = getLessonSteps(slug);
  if (steps.length === 0) {
    issues.push(`[${slug}] no steps`);
    problems++;
    continue;
  }

  const ns = steps.map((s) => s.n).sort((a, b) => a - b);
  for (let i = 0; i < ns.length; i++) {
    if (ns[i] !== i + 1) {
      issues.push(`[${slug}] step numbering gap: expected ${i + 1}, got ${ns[i]} (sequence ${ns.join(",")})`);
      problems++;
      break;
    }
  }

  for (const step of steps) {
    if (step.completion?.type === "submission") continue;
    if (!step.kind) {
      issues.push(`[${slug}] step ${step.n} ("${step.title}") has no kind → placeholder "Этот тип шага пока не поддержан"`);
      problems++;
      continue;
    }
    if (!SUPPORTED_KINDS.has(step.kind)) {
      issues.push(`[${slug}] step ${step.n} kind="${step.kind}" not in StepRouter → fallback "Неизвестный тип шага"`);
      problems++;
    }
    if (!step.content) {
      issues.push(`[${slug}] step ${step.n} has kind="${step.kind}" but no content → placeholder`);
      problems++;
    }
    if (step.completion?.type === "practice" && !step.completion.key) {
      issues.push(`[${slug}] step ${step.n} practice without completion.key`);
      problems++;
    }
  }

  const hasSubmission = steps.some((s) => s.completion?.type === "submission");
  if (!hasSubmission) {
    issues.push(`[${slug}] no submission step (homework can't be submitted)`);
    problems++;
  }
  if (hasSubmission && !lesson.homework) {
    issues.push(`[${slug}] has submission step but no homework definition → /homework page shows "no homework"`);
    problems++;
  }
}

console.log(`Lessons checked: ${ALL_LESSONS.length}`);
console.log(`Problems found: ${problems}`);
if (issues.length) {
  console.log("\n--- ISSUES ---");
  for (const i of issues) console.log(i);
}
process.exit(problems > 0 ? 1 : 0);
