import { NextResponse } from "next/server";
import { IdeaCard, IdeaStatus, incubateIdeaLocally } from "@/lib/ideas";

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ message: "Missing idea text" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return NextResponse.json(incubateIdeaLocally(text));
  }

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(18_000),
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是 FlowState 的 AI 创意孵化助手。请把用户的碎片想法扩写为结构化创意卡片。必须只输出合法 JSON，不要输出 Markdown，不要添加解释。"
          },
          {
            role: "user",
            content: buildPrompt(text)
          }
        ],
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        stream: false,
        max_tokens: 1200,
        temperature: 0.82
      })
    });

    if (!response.ok) {
      return NextResponse.json(incubateIdeaLocally(text));
    }

    const payload = (await response.json()) as DeepSeekChatResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(incubateIdeaLocally(text));
    }

    return NextResponse.json(toIdeaCard(text, content));
  } catch {
    return NextResponse.json(incubateIdeaLocally(text));
  }
}

function buildPrompt(text: string) {
  return `请基于下面的原始想法，输出一个 JSON 对象。

原始想法：
${text}

JSON 格式必须完全符合这个结构：
{
  "title": "AI 提炼的响亮中文标题，16字以内",
  "summary": "一句话总结，50字以内",
  "tags": ["2-3个中文标签"],
  "status": "Spark 闪念 或 Draft 草案",
  "evaluation": "对这个灵感的评价，指出亮点、潜力和一个主要风险，80字以内",
  "landing_way": "这个灵感的第一种落地方式，具体到 MVP 或验证路径，80字以内",
  "expansion_ideas": ["2-3个可继续发散的新想法或变体方向"],
  "action_items": ["具体的下一步行动建议1", "具体的下一步行动建议2"]
}

要求：
- tags 必须是 2 到 3 个短标签。
- status 只能是 "Spark 闪念" 或 "Draft 草案"。
- evaluation 要像产品合伙人的判断，不要空泛夸奖。
- landing_way 要能让用户知道下一周具体做什么。
- expansion_ideas 必须给用户新的想法涌现，不要重复 action_items。
- action_items 必须刚好 2 条，具体、可执行。
- 不要包含 id、created_at 或 original_text，这些字段由系统生成。`;
}

function toIdeaCard(originalText: string, content: string): IdeaCard {
  const parsed = parseJsonContent(content);

  return {
    id: crypto.randomUUID(),
    original_text: originalText,
    title: asString(parsed.title, "未命名灵感").slice(0, 40),
    summary: asString(parsed.summary, originalText).slice(0, 120),
    tags: normalizeTags(parsed.tags),
    status: normalizeStatus(parsed.status),
    evaluation: asString(parsed.evaluation, createFallbackEvaluation(originalText)).slice(0, 140),
    landing_way: asString(parsed.landing_way, createFallbackLandingWay(originalText)).slice(0, 140),
    expansion_ideas: normalizeExpansionIdeas(parsed.expansion_ideas),
    action_items: normalizeActionItems(parsed.action_items),
    created_at: new Date().toISOString()
  };
}

function parseJsonContent(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned) as Record<string, unknown>;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return ["创意", "策略"];

  const tags = value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

  return Array.from(new Set(tags)).slice(0, 3).length
    ? Array.from(new Set(tags)).slice(0, 3)
    : ["创意", "策略"];
}

function normalizeStatus(value: unknown): IdeaStatus {
  return value === "Draft 草案" ? "Draft 草案" : "Spark 闪念";
}

function normalizeActionItems(value: unknown) {
  if (!Array.isArray(value)) {
    return ["明确目标用户和核心场景", "设计一个可验证的最小原型"];
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  while (items.length < 2) {
    items.push(items.length === 0 ? "明确目标用户和核心场景" : "设计一个可验证的最小原型");
  }

  return items;
}

function normalizeExpansionIdeas(value: unknown) {
  if (!Array.isArray(value)) {
    return ["拆成一个可验证的 MVP", "寻找真实用户访谈", "尝试加入 AI 自动化能力"];
  }

  const ideas = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  while (ideas.length < 2) {
    ideas.push(ideas.length === 0 ? "拆成一个可验证的 MVP" : "寻找真实用户访谈");
  }

  return ideas;
}

function createFallbackEvaluation(originalText: string) {
  return `这个灵感有继续探索的价值，核心需要验证的是用户是否愿意为「${originalText.slice(0, 18)}」投入时间或付费。`;
}

function createFallbackLandingWay(originalText: string) {
  return `先围绕「${originalText.slice(0, 18)}」做一个单场景 MVP，用 3-5 个用户访谈验证需求强度。`;
}

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};
