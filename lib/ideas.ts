export type IdeaStatus = "Spark 闪念" | "Draft 草案";
export type PriorityLevel = "P0" | "P1" | "P2" | "P3";

export type IdeaCard = {
  id: string;
  original_text: string;
  title: string;
  summary: string;
  tags: string[];
  status: IdeaStatus;
  priority?: PriorityLevel;
  action_items: string[];
  created_at: string;
};

export const INCUBATE_API_PATH = "/api/incubate";
export const USE_REMOTE_INCUBATE_API = true;

const tagRules = [
  { tag: "商业", words: ["商业", "变现", "收入", "用户", "增长", "市场", "创业", "客户"] },
  { tag: "工具", words: ["工具", "效率", "自动", "系统", "流程", "平台", "工作流"] },
  { tag: "设计", words: ["设计", "体验", "界面", "交互", "视觉", "产品", "品牌"] },
  { tag: "内容", words: ["写作", "内容", "故事", "媒体", "文章", "视频", "传播"] },
  { tag: "AI", words: ["ai", "AI", "智能", "模型", "助手", "自动生成"] },
  { tag: "学习", words: ["学习", "知识", "课程", "研究", "阅读", "训练"] }
];

const titleOpeners = ["把碎片变成系统", "一个可执行的灵感雏形", "从念头到原型", "值得推进的小实验"];
const statusWords = ["验证", "原型", "拆解", "发布", "沉淀", "连接"];

export function incubateIdeaLocally(input: string): IdeaCard {
  const cleanInput = input.trim().replace(/\s+/g, " ");
  const tags = pickTags(cleanInput);
  const title = createTitle(cleanInput, tags);
  const summary = createSummary(cleanInput, tags);

  return {
    id: crypto.randomUUID(),
    original_text: cleanInput,
    title,
    summary,
    tags,
    status: cleanInput.length > 80 ? "Draft 草案" : "Spark 闪念",
    action_items: createActionItems(cleanInput, tags),
    created_at: new Date().toISOString()
  };
}

export async function incubateIdea(input: string): Promise<IdeaCard> {
  if (USE_REMOTE_INCUBATE_API) {
    const response = await fetch(INCUBATE_API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input })
    });

    if (!response.ok) {
      throw new Error("AI 孵化服务暂时不可用");
    }

    return response.json();
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  return incubateIdeaLocally(input);
}

export function formatIdeaMarkdown(idea: IdeaCard) {
  return [
    `# ${idea.title}`,
    "",
    `> ${idea.summary}`,
    "",
    `状态：${idea.status}`,
    `标签：${idea.tags.map((tag) => `#${tag}`).join(" ")}`,
    "",
    "## 下一步",
    ...idea.action_items.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## 原始想法",
    idea.original_text
  ].join("\n");
}

function pickTags(input: string) {
  const matched = tagRules
    .filter((rule) => rule.words.some((word) => input.includes(word)))
    .map((rule) => rule.tag);

  const fallback = ["创意", "策略", "实验"];
  return Array.from(new Set([...matched, ...fallback])).slice(0, 3);
}

function createTitle(input: string, tags: string[]) {
  const compact = input.replace(/[，。！？,.!?]/g, " ");
  const meaningfulWords = compact.split(/\s+/).filter((word) => word.length > 1);
  const anchor = meaningfulWords[0]?.slice(0, 12) || tags[0];
  const opener = titleOpeners[input.length % titleOpeners.length];
  return `${opener}：${anchor}`;
}

function createSummary(input: string, tags: string[]) {
  const excerpt = input.length > 56 ? `${input.slice(0, 56)}...` : input;
  return `围绕「${excerpt}」建立一个以${tags[0]}为核心、可快速验证的创意方向。`;
}

function createActionItems(input: string, tags: string[]) {
  const verb = statusWords[input.length % statusWords.length];
  return [
    `用 15 分钟写出这个想法的目标用户、使用场景和最小成功标准。`,
    `围绕「${tags[0]}」做一次小型${verb}，产出一个可展示的页面、脚本或流程图。`
  ];
}
