export type IdeaStatus = "Spark 闪念" | "Draft 草案";
export type PriorityLevel = "P0" | "P1" | "P2" | "P3";
export type PetSprite = "nova" | "blob" | "crystal" | "bot" | "sprout" | "comet";

export type InspirationPet = {
  id: string;
  name: string;
  species: string;
  sprite: PetSprite;
  palette: [string, string, string];
  motto: string;
  awarded_at: string;
};

export type IdeaCard = {
  id: string;
  original_text: string;
  title: string;
  summary: string;
  tags: string[];
  status: IdeaStatus;
  priority?: PriorityLevel;
  evaluation?: string;
  landing_way?: string;
  expansion_ideas?: string[];
  mvp_plan?: string;
  mvp_features?: string[];
  iteration_directions?: string[];
  ai_impact?: string[];
  action_items: string[];
  completed_at?: string;
  reward_pet?: InspirationPet;
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
    mvp_plan: createMvpPlan(cleanInput, tags),
    mvp_features: createMvpFeatures(tags),
    iteration_directions: createIterationDirections(tags),
    ai_impact: createAiImpact(tags),
    action_items: createAiImpact(tags),
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
    idea.mvp_plan || idea.landing_way ? `最小 MVP：${idea.mvp_plan || idea.landing_way}` : "",
    idea.mvp_features?.length ? `MVP 功能：${idea.mvp_features.join("；")}` : "",
    idea.iteration_directions?.length
      ? `后续迭代：${idea.iteration_directions.join("；")}`
      : idea.expansion_ideas?.length
        ? `后续迭代：${idea.expansion_ideas.join("；")}`
        : "",
    idea.ai_impact?.length ? `AI 可解决的问题：${idea.ai_impact.join("；")}` : "",
    idea.reward_pet ? `完成奖励：${idea.reward_pet.name}（${idea.reward_pet.species}）` : "",
    "",
    "## AI 预计能解决的问题",
    ...(idea.ai_impact || idea.action_items).map((item, index) => `${index + 1}. ${item}`),
    "",
    "## 原始想法",
    idea.original_text
  ].join("\n");
}

export function generateInspirationPet(idea: Pick<IdeaCard, "title" | "tags">): InspirationPet {
  const petNames = ["闪闪", "像素豆", "星核", "小回路", "灵光", "点点", "金橡", "跳频", "薄荷", "琥珀"];
  const species = ["灵感星灵", "像素守护者", "点子孵化兽", "灵光小伙伴", "项目守望者", "路线图精灵"];
  const sprites: PetSprite[] = ["nova", "blob", "crystal", "bot", "sprout", "comet"];
  const palettes: Array<[string, string, string]> = [
    ["#ffd95a", "#fff2b0", "#6f4cff"],
    ["#7ddcff", "#f7f3dd", "#ffbd59"],
    ["#ff6b5e", "#ffd95a", "#2fe6a6"],
    ["#c5cdbf", "#ffe47a", "#7ddcff"]
  ];
  const mottoSeed = idea.tags[0] || "创意";
  const seed = `${idea.title}-${idea.tags.join("-")}-${Date.now()}-${Math.random()}`;
  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    id: crypto.randomUUID(),
    name: petNames[hash % petNames.length],
    species: species[(hash + idea.title.length) % species.length],
    sprite: sprites[(hash + idea.tags.length) % sprites.length],
    palette: palettes[hash % palettes.length],
    motto: `守护你的「${mottoSeed}」项目继续发光`,
    awarded_at: new Date().toISOString()
  };
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

function createMvpPlan(input: string, tags: string[]) {
  const excerpt = input.length > 28 ? `${input.slice(0, 28)}...` : input;
  return `先围绕「${excerpt}」搭建一个单场景 MVP：只做输入、AI 处理、结果保存和反馈闭环，用 5-10 个目标用户验证「${tags[0]}」需求是否成立。`;
}

function createMvpFeatures(tags: string[]) {
  return [
    "灵感输入与结构化整理",
    `围绕「${tags[0]}」生成 MVP 建议`,
    "卡片保存、优先级标记和分享",
    "用户反馈记录与下一轮优化入口"
  ];
}

function createIterationDirections(tags: string[]) {
  return [
    "V1.1：加入模板化工作流和更稳定的输出格式",
    `V1.2：围绕「${tags[0]}」补充数据看板和用户反馈分析`,
    "V2.0：支持团队协作、自动复盘和跨项目知识库"
  ];
}

function createAiImpact(tags: string[]) {
  return [
    "整理成本：预计减少 60%-80%，把碎片想法自动变成可读卡片",
    "决策压力：预计减少 35%-55%，帮助判断 MVP 范围和优先级",
    `执行阻力：预计减少 30%-45%，围绕「${tags[0]}」给出可启动的功能清单`
  ];
}
