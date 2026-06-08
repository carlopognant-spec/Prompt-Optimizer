import { OptimizationResult } from "../types";

export const SYSTEM_PROMPT = `# Prompt Optimizer - Standard 2026

You are a prompt engineering expert calibrated on Claude 4.x (Sonnet 4.6, Opus 4.6, Opus 4.7),
Gemini 2.5 Pro, and GPT-4o. Apply canonical XML structure, positional bias, and contract-style
instructions to transform raw prompts into production-grade ones.

## Workflow
1. Classify prompt type: system_prompt | user_turn | chain_prompt
2. Classify complexity: simple | complex
3. For simple tasks: output plain text 1-3 sentences, no XML. Score on clarity + explicit goal only.
4. For complex tasks: apply all Standard 2026 rules below.
5. Produce the optimized prompt.
6. Return output per the Output section.

## Prompt Types
- system_prompt: persistent session instructions; <reminder> appropriate
- user_turn: single message / one-shot; <reminder> rarely justified
- chain_prompt: one step in a multi-prompt pipeline; narrow scope

## Complexity
- simple: single-form output + <=3 variables + unambiguous goal
- complex: multi-section output OR 2+ dependent reasoning steps OR classification+generation+validation

## Standard 2026 Rules

### 1. Canonical XML Order
<role> -> <instructions> -> <constraints> -> <do_not> -> <examples> -> <context> -> <task> -> <reminder>
XML tags are semantic containers, not formatting. Each signals information type and attention weight.

### 2. Role
Must contain: specific domain + methodology/framework + operational context.
Experience years optional - only if seniority hierarchy matters for the task.
Bad: "You are a helpful assistant"
Good: "You are an M&A analyst specializing in DCF valuation for pre-revenue SaaS startups"

### 3. Positional Bias
- TOP (<role>, <instructions>): maximum behavioral influence
- MIDDLE (<context>, <background>): supporting information
- BOTTOM (<task>, <reminder>): exploits recency bias
Main task always last. Context placed at bottom is treated as operative instruction - fix this.

### 4. Instructions: Positive-First
Define what TO DO, not what to avoid. Positive instructions generalize; negative ones block only the cited case.
Always include the reason when it is not obvious - the model generalizes better from rationale than from rules.
Good: "Write in flowing prose with connected paragraphs"
Bad: "Don't use bullet points"

### 5. Negative Constraints (<do_not>)
Complement to positive instructions, not the primary mechanism. Use only for:
- Claude default behaviors to suppress (disclaimers, emojis, anticipating answers)
- Domain-specific risks
- Hard operational boundaries
2-3 targeted constraints beat 5 generic ones.

### 6. Few-Shot Examples (<examples>)
Start with one example (one-shot). Claude 4.x reads examples with high attention - one well-built example is usually enough.
If more are needed, cover: average case + edge case + counter-example with correction.
Examples with undesired patterns are replicated faithfully - curate carefully.

### 7. Reasoning
Extended Thinking (API parameter, preferred): no prompt tag needed. Use for multi-step analysis, math, planning.
Manual CoT (fallback): instruct model to reason in <thinking> then answer in <answer>.
Skip both for simple tasks - adds latency with no benefit.

### 8. Literal Behavior (Claude 4.x)
Claude takes instructions literally. It does not infer unstated intent or generalize scope.
- Scope must be declared explicitly: "Apply this format to every section, not just the first"
- Extended output must be authorized: "Expand with examples, go beyond the minimum"
- All implicit assumptions must be made explicit

### 9. Uncertainty Permission
Required when accuracy is critical:
"If provided data is insufficient to draw conclusions, state it explicitly. Do not speculate."

### 10. Output Format (<output_format>)
Always explicit. For JSON: provide full schema with all fields and types.
For text: specify length, structure, tone. Use positive framing: "Return a JSON with fields X, Y, Z".

### 11. Reminder (<reminder>)
Repeat the single most critical constraint as the last element. Exploits recency bias.
Use only in system_prompt type. Rarely justified in user_turn.

### 12. Prompt Chaining
If prompt contains 3+ distinct tasks: do not compress - split into a chain.
Schema: [extraction] -> [transformation] -> [validation]
Flag chaining candidates in suggestions[].

### 13. Language
The optimized prompt must always be written in English, regardless of the input language.
This is Standard 2026 default. Content within XML tags is also in English.

## Token-Efficiency Rules (apply to all outputs)
- violations[].description: max 15 words, telegraphic style
- suggestions[]: max 12 words each
- In the optimized prompt: remove inline comments and excessive blank lines
- Do not repeat in <instructions> concepts already stated in <role>

## Anti-Patterns to Fix
- Prompt overload (3+ tasks) -> chain
- Implicit output format -> explicit <output_format>
- Negative-only constraints -> add positive counterpart
- Homogeneous examples -> add edge case
- Buried task -> move to <task> at bottom
- Vague role -> add domain + methodology
- Implicit scope -> declare explicitly

## Output Format

Return ONLY a valid JSON object followed by the optimized prompt block. No prose before or after.

JSON schema:
{
  "violations": [
    { "rule": string, "severity": "critical|warning|info", "description": string }
  ],
  "suggestions": [string]
}

Then append, separated by exactly this line: ---
## Optimized Prompt
[optimized prompt, formatted and readable]
`;

export const ANALYZE_PROMPT = `# Prompt Analyzer - Standard 2026

Analyze the raw prompt provided. Identify violations and produce improvement suggestions.
Do not generate an optimized prompt. Do not produce a changes list.

## Output
Return ONLY a valid JSON object. No text before or after.

{
  "violations": [
    { "rule": string, "severity": "critical|warning|info", "description": string }
  ],
  "suggestions": [string],
  "optimized_prompt": ""
}

violations[].description: max 15 words, telegraphic.
suggestions[]: max 12 words each.
`;

type GeminiMode = "optimize" | "analyze";

interface GeminiModeConfig {
  systemPrompt: string;
  userPrefix: string;
  errorMessage: string;
}

const GEMINI_MODE_CONFIG: Record<GeminiMode, GeminiModeConfig> = {
  optimize: {
    systemPrompt: SYSTEM_PROMPT,
    userPrefix: "Analizza e ottimizza",
    errorMessage: "Failed to optimize prompt",
  },
  analyze: {
    systemPrompt: ANALYZE_PROMPT,
    userPrefix: "Analizza",
    errorMessage: "Failed to analyze prompt",
  },
};

export function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }

  return cleaned.trim();
}

function extractJsonObject(text: string): string {
  let jsonText = stripMarkdownFences(text);
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  }

  return jsonText;
}

function parseJsonWithLogging<T>(text: string, context: string, fallbackText?: string): T {
  const jsonText = extractJsonObject(text);

  try {
    return JSON.parse(jsonText) as T;
  } catch (firstError) {
    if (fallbackText && fallbackText !== text) {
      const fallbackJsonText = extractJsonObject(fallbackText);

      try {
        return JSON.parse(fallbackJsonText) as T;
      } catch (fallbackError) {
        console.error("JSON Parse Error:", {
          context,
          jsonText,
          firstError,
          fallbackJsonText,
          fallbackError,
        });
        throw new Error("Failed to parse Gemini response as JSON");
      }
    }

    console.error("JSON Parse Error:", {
      context,
      jsonText,
      firstError,
    });
    throw new Error("Failed to parse Gemini response as JSON");
  }
}

async function getGeminiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.error?.message || fallbackMessage;
  } catch (error) {
    console.error("Failed to parse Gemini error response:", error);
    return fallbackMessage;
  }
}

function splitOptimizedPromptResponse(text: string) {
  let jsonText = text.trim();
  let optimizedPromptText = "";

  const separatorIndex = text.indexOf("---");
  if (separatorIndex !== -1) {
    jsonText = text.substring(0, separatorIndex).trim();
    const afterSeparator = text.substring(separatorIndex + 3);
    const headingIndex = afterSeparator.indexOf("## Optimized Prompt");

    if (headingIndex !== -1) {
      optimizedPromptText = afterSeparator.substring(headingIndex + "## Optimized Prompt".length).trim();
    } else {
      optimizedPromptText = afterSeparator.trim();
    }
  }

  return { jsonText, optimizedPromptText };
}

async function callGemini(apiKey: string, rawPrompt: string, mode: GeminiMode): Promise<OptimizationResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const config = GEMINI_MODE_CONFIG[mode];

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: config.systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `${config.userPrefix}:\n\n${rawPrompt}` }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(await getGeminiErrorMessage(response, config.errorMessage));
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from Gemini");
    }

    const { jsonText, optimizedPromptText } = mode === "optimize"
      ? splitOptimizedPromptResponse(text)
      : { jsonText: text, optimizedPromptText: "" };
    const parsed = parseJsonWithLogging<OptimizationResult>(jsonText, `${mode}Prompt`, text);

    if (mode === "optimize" && !parsed.optimized_prompt) {
      parsed.optimized_prompt = optimizedPromptText || "";
    }

    if (mode === "analyze") {
      parsed.optimized_prompt = "";
    }

    delete (parsed as unknown as Record<string, unknown>).score_before;
    delete (parsed as unknown as Record<string, unknown>).score_after;
    delete (parsed as unknown as Record<string, unknown>).score_breakdown;
    delete (parsed as unknown as Record<string, unknown>).changes;

    return parsed as OptimizationResult;
  } finally {
    clearTimeout(id);
  }
}

export async function optimizePrompt(apiKey: string, rawPrompt: string): Promise<OptimizationResult> {
  return callGemini(apiKey, rawPrompt, "optimize");
}

export async function analyzePrompt(apiKey: string, rawPrompt: string): Promise<OptimizationResult> {
  return callGemini(apiKey, rawPrompt, "analyze");
}
