import { NextResponse } from "next/server";
import { IdeaCard, IdeaStatus } from "@/lib/ideas";

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
    return NextResponse.json({ message: "DeepSeek API key is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
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
        stream: false,
        max_tokens: 900,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: "DeepSeek API request failed", detail: errorText },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as DeepSeekChatResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ message: "DeepSeek returned empty content" }, { status: 502 });
    }

    return NextResponse.json(toIdeaCard(text, content));
  } catch (error) {
    return NextResponse.json(
      {
        message: "AI 孵化服务暂时不可用",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
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
  "action_items": ["具体的下一步行动建议1", "具体的下一步行动建议2"]
}

要求：
- tags 必须是 2 到 3 个短标签。
- status 只能是 "Spark 闪念" 或 "Draft 草案"。
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

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};
