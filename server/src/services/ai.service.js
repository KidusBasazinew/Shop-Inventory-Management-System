import fs from "node:fs";
import { env } from "../config/env.js";

/**
 * AI verification of subscription payment screenshots.
 *
 * This is the 15-minute fallback used by the scheduler when the
 * platform owner hasn't reviewed a payment manually. It returns
 *   { verified: boolean, confidence: 0..1, details: object }
 *
 * Two implementations:
 *  - "stub" (default): deterministic heuristic so the flow works end
 *    to end in development without any external API. It never
 *    auto-approves on its own unless you explicitly lower the
 *    threshold — confidence is capped below autoAiThreshold, so
 *    everything stays PENDING for human review.
 *  - "openai": sends the image to OpenAI's vision model with a
 *    verification prompt. Set AI_PROVIDER=openai and OPENAI_API_KEY.
 *
 * The same interface is where you'd plug Telebirr/CBE statement OCR
 * or any local model later.
 */

async function stubVerify(filePath, { amountEtb }) {
  // File sanity checks only — a stub cannot truly read the receipt.
  let bytes = 0;
  try {
    bytes = fs.statSync(filePath).size;
  } catch {
    return {
      verified: false,
      confidence: 0.9,
      details: { reason: "Screenshot file missing on server" },
    };
  }

  // Deliberately below autoAiThreshold: dev stub never auto-decides.
  return {
    verified: true,
    confidence: 0.4,
    details: {
      mode: "stub",
      bytes,
      note: "Stub check only — awaiting human review",
      expectedAmountEtb: amountEtb,
    },
  };
}

function buildPrompt({ amountEtb }) {
  return [
    "You are verifying a mobile-money / bank transfer payment screenshot for a software subscription.",
    `The shop claims to have paid ETB ${amountEtb}.`,
    "Decide: (1) does the screenshot look like a genuine transfer receipt,",
    "(2) is the amount equal to the claimed amount,",
    "(3) does it look recently dated and not an obvious duplicate of a template?",
    'Reply ONLY with compact JSON: {"verified": boolean, "confidence": number between 0 and 1, "reason": string}',
  ].join(" ");
}

async function openaiVerify(filePath, { amountEtb }) {
  const apiKey = env.ai.openaiApiKey;
  if (!apiKey) return stubVerify(filePath, { amountEtb });

  const imageBase64 = fs.readFileSync(filePath).toString("base64");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildPrompt({ amountEtb }) },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI vision failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { verified: false, confidence: 0.2, reason: `unparseable model output: ${raw.slice(0, 120)}` };
  }
  return {
    verified: Boolean(parsed.verified),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    details: { mode: "openai", model: env.ai.openaiModel, reason: parsed.reason },
  };
}

export async function aiVerifyScreenshot(filePath, meta) {
  if (env.ai.provider === "openai") {
    return openaiVerify(filePath, meta);
  }
  return stubVerify(filePath, meta);
}

export default { aiVerifyScreenshot };
