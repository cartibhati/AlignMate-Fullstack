# AlignMate/ai_feedback.py

import random
from langchain_core.prompts import PromptTemplate
from llm_provider import get_llm

llm = get_llm()

# ── Varied prompt templates ───────────────────────────────────────────────────
# Multiple templates so the AI doesn't produce the same structure every time

TEMPLATES = [
    # Template 1 — coach tone
    """You are a strict but caring posture coach named AlignMate.
Based on this session data, give 3-4 sentences of specific, actionable feedback.
Vary your language — don't repeat the same phrases. Be direct, not generic.

Mode: {mode} | Score: {score}/100 | Bad posture: {bad_duration}s / {session_duration}s total
Issues: {issues}

Rules:
- student mode: mention screen height, chair position, study breaks
- athlete mode: mention spinal alignment, injury risk, performance impact
- both: cover both angles briefly
- If score > 75: positive reinforcement + one improvement tip
- If score 50-75: balanced feedback, highlight what went wrong
- If score < 50: firm correction, specific fixes, urgency

Feedback (no greetings, no bullet points):""",

    # Template 2 — analytical tone
    """You are AlignMate, an AI posture analyst giving a post-session report.
Write 3-4 sentences analyzing this session. Be specific about the data. Vary your phrasing.

Session stats — Mode: {mode} | Score: {score}/100
Time in bad posture: {bad_duration}s out of {session_duration}s
Detected issues: {issues}

Tailor advice to the mode:
- student: desk ergonomics, screen distance, sitting habits
- athlete: form precision, muscle imbalances, injury prevention
- both: blend both

Tone: analytical, specific, not repetitive. No bullet points. No greetings.
Analysis:""",

    # Template 3 — motivational tone
    """You are AlignMate. Give personalized posture feedback after a session.
Be motivational but honest. 3-4 sentences. Never use the same opening twice.

Data: Mode={mode}, Score={score}/100, Bad posture={bad_duration}s/{session_duration}s
Issues detected: {issues}

Personalize based on mode ({mode}):
- student → study environment, screen ergonomics, break reminders
- athlete → training form, alignment under load, performance
- both → cover study and training context

No greetings. No lists. Just flowing, varied, specific sentences.
Feedback:""",
]

def get_ai_feedback(
    mode: str,
    score: int,
    bad_duration: int,
    session_duration: int,
    issues: list[str],
) -> str:
    issues_str = ", ".join(issues) if issues else "none detected"

    # ── Pick a random template each call for variety ──
    template_str = random.choice(TEMPLATES)

    prompt = PromptTemplate(
        input_variables=["mode", "score", "bad_duration", "session_duration", "issues"],
        template=template_str,
    )
    chain = prompt | llm

    try:
        result = chain.invoke({
            "mode":             mode,
            "score":            score,
            "bad_duration":     bad_duration,
            "session_duration": session_duration,
            "issues":           issues_str,
        })
        text = result.content if hasattr(result, "content") else result
        return text.strip()
    except Exception as e:
        print(f"[WARNING] Ollama model error ({e}). Generating rule-based feedback fallback...")
        if score > 75:
            feedback = f"Excellent job! Your posture during this {mode} session was outstanding with an average score of {score}/100. "
            if mode == "student":
                feedback += "Keep your screen at eye level and maintain this great habit during your study breaks."
            else:
                feedback += "Your spinal alignment looks great. Keep up this precision to maximize performance and prevent injuries."
        elif score >= 50:
            feedback = f"Good effort, but there is room for improvement. You spent {bad_duration}s in poor posture during this {session_duration}s session. "
            if issues:
                feedback += f"We detected some issues with {issues_str}. "
            if mode == "student":
                feedback += "Try adjusting your chair height and taking regular breaks every 30 minutes to stretch."
            else:
                feedback += "Ensure your core is braced and avoid tilting your neck under training load."
        else:
            feedback = f"Your posture needs urgent attention. Your score was only {score}/100, spending {bad_duration}s slouched. "
            if issues:
                feedback += f"Issues detected: {issues_str}. "
            if mode == "student":
                feedback += "Please raise your screen immediately and sit fully back in your chair to protect your spine."
            else:
                feedback += "High injury risk detected. Please stand straight, align your neck, and brace your core immediately."
        return feedback