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
  "mvp_plan": "最小 MVP 版本怎么搭建，说明第一版流程、验证方式和边界，100字以内",
  "mvp_features": ["3-5个 MVP 必备功能"],
  "iteration_directions": ["2-3个后续版本迭代方向，建议用 V1.1/V1.2/V2.0 开头"],
  "ai_impact": ["2-3条 AI 预计能解决的问题，用百分比范围表达，例如：整理成本预计减少 60%-80%"]
}

要求：
- tags 必须是 2 到 3 个短标签。
- status 只能是 "Spark 闪念" 或 "Draft 草案"。
- mvp_plan 要具体到用户第一周能搭建的最小版本，不要写空泛愿景。
- mvp_features 必须是可实现的功能点，不要超过 5 条。
- iteration_directions 是后续版本路线图，不要和 MVP 功能重复。
- ai_impact 必须是预估辅助范围，不要做绝对评分，不要声称真实准确率。
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
    mvp_plan: asString(parsed.mvp_plan, createFallbackMvpPlan(originalText)).slice(0, 180),
    mvp_features: normalizeMvpFeatures(parsed.mvp_features),
    iteration_directions: normalizeIterationDirections(parsed.iteration_directions),
    ai_impact: normalizeAiImpact(parsed.ai_impact),
    action_items: normalizeAiImpact(parsed.ai_impact),
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

function normalizeAiImpact(value: unknown) {
  if (!Array.isArray(value)) {
    return ["整理成本：预计减少 60%-80%", "决策压力：预计减少 35%-55%", "执行阻力：预计减少 30%-45%"];
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  while (items.length < 2) {
    items.push(items.length === 0 ? "整理成本：预计减少 60%-80%" : "决策压力：预计减少 35%-55%");
  }

  return items;
}

function normalizeMvpFeatures(value: unknown) {
  if (!Array.isArray(value)) {
    return ["灵感输入", "AI 结构化生成", "本地保存", "复制分享"];
  }

  const features = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  while (features.length < 3) {
    features.push(features.length === 0 ? "灵感输入" : features.length === 1 ? "AI 结构化生成" : "本地保存");
  }

  return features;
}

function normalizeIterationDirections(value: unknown) {
  if (!Array.isArray(value)) {
    return ["V1.1：补充模板化流程", "V1.2：加入数据反馈", "V2.0：支持团队协作"];
  }

  const directions = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  while (directions.length < 2) {
    directions.push(directions.length === 0 ? "V1.1：补充模板化流程" : "V1.2：加入数据反馈");
  }

  return directions;
}

function createFallbackMvpPlan(originalText: string) {
  return `先围绕「${originalText.slice(0, 18)}」做一个单场景 MVP，只保留输入、AI 处理、结果保存和反馈验证。`;
}

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};
