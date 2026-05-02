"use client";

import {
  Bot,
  Check,
  Clipboard,
  Edit3,
  Grid3X3,
  LayoutGrid,
  Lightbulb,
  List,
  Loader2,
  Mic,
  MicOff,
  Milestone,
  Rocket,
  Settings,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IdeaCard, PriorityLevel, formatIdeaMarkdown, incubateIdea } from "@/lib/ideas";

const STORAGE_KEY = "flowstate.idea-canvas.v1";
const MAX_LENGTH = 500;

const loadingMessages = [
  "AI 正在提炼关键词，构建你的创意卡片...",
  "正在压缩想法噪音，寻找最亮的主线...",
  "正在生成下一步行动建议...",
  "正在把碎片整理成可分享的灵感卡片..."
];

const sampleIdeas: IdeaCard[] = [
  {
    id: "sample-focus-planet",
    original_text: "一款沉浸式专注学习 App，通过番茄钟、白噪音和数据统计，帮助用户进入心流状态。",
    title: "专注力星球",
    summary: "一款沉浸式专注学习 App，通过番茄钟、白噪音和数据统计，帮助用户进入心流状态。",
    tags: ["工具", "学习", "效率"],
    status: "Spark 闪念",
    priority: "P0",
    evaluation: "这个想法的场景清晰，容易做出可感知价值；风险是专注类产品同质化，需要找到更强的学习反馈闭环。",
    landing_way: "先做番茄钟、白噪音和学习统计三件事，用 20 名学生测试 7 天留存和完成率。",
    expansion_ideas: ["加入 AI 学习计划生成", "做班级或自习室排行榜", "把专注数据转成成长报告"],
    action_items: ["设计产品原型并进行用户调研", "实现番茄钟和白噪音核心功能"],
    created_at: new Date(Date.now() - 40_000).toISOString()
  },
  {
    id: "sample-ai-trip",
    original_text: "根据用户的时间、预算和兴趣点，AI 自动生成个性化旅行路线和攻略。",
    title: "AI 旅行规划师",
    summary: "根据用户的时间、预算和兴趣点，AI 自动生成个性化旅行路线和攻略。",
    tags: ["旅行", "AI", "个性化"],
    status: "Draft 草案",
    priority: "P1",
    evaluation: "需求真实但竞争明显，差异点应放在实时约束和个性偏好，而不是泛泛生成攻略。",
    landing_way: "先聚焦周末短途旅行，输入预算、天数和兴趣后生成一页可执行路线。",
    expansion_ideas: ["加入多人偏好协调", "接入预算提醒", "生成可分享的旅行卡片"],
    action_items: ["收集旅行数据和景点信息", "设计行程生成算法逻辑"],
    created_at: new Date(Date.now() - 120_000).toISOString()
  },
  {
    id: "sample-mood-tree",
    original_text: "一个温暖的情绪记录社区，用户可以匿名倾诉，并获得 AI 的温柔回应和建议。",
    title: "情绪树洞",
    summary: "一个温暖的情绪记录社区，用户可以匿名倾诉，并获得 AI 的温柔回应和建议。",
    tags: ["情绪", "社区", "AI"],
    status: "Spark 闪念",
    priority: "P2",
    evaluation: "情绪陪伴有温度和黏性，但需要非常谨慎处理安全边界和隐私信任。",
    landing_way: "先做匿名树洞和 AI 温柔回应，不做公开社区，验证用户是否愿意持续记录。",
    expansion_ideas: ["加入情绪趋势日历", "设计危机提示机制", "推出每日自我关怀卡片"],
    action_items: ["设计社区互动和匿名机制", "设计 AI 的共情回复模型"],
    created_at: new Date(Date.now() - 3_600_000).toISOString()
  },
  {
    id: "sample-idea-market",
    original_text: "一个创意交易平台，连接有想法的人和有资源的人，让好点子被实现。",
    title: "灵感集市",
    summary: "一个创意交易平台，连接有想法的人和有资源的人，让好点子被实现。",
    tags: ["商业", "平台", "创意"],
    status: "Draft 草案",
    priority: "P3",
    evaluation: "平台型想法空间大，但冷启动难度高；更适合先从小圈层撮合和案例沉淀开始。",
    landing_way: "先做一个人工审核的灵感看板，撮合 10 个想法方和资源方，验证成交动机。",
    expansion_ideas: ["增加创意悬赏机制", "建立灵感估值模板", "做成功案例展示页"],
    action_items: ["确定平台商业模式和抽成机制", "设计 MVP 版本核心流程"],
    created_at: new Date(Date.now() - 86_400_000).toISOString()
  }
];

type ViewMode = "canvas" | "all" | "favorites" | "tags" | "settings";

const navItems: Array<{
  id: ViewMode;
  icon: typeof LayoutGrid;
  label: string;
  sub: string;
}> = [
  { id: "canvas", icon: LayoutGrid, label: "画板", sub: "CANVAS" },
  { id: "all", icon: List, label: "全部灵感", sub: "ALL IDEAS" },
  { id: "favorites", icon: Star, label: "收藏夹", sub: "FAVOURITES" },
  { id: "tags", icon: Tag, label: "标签库", sub: "TAGS" },
  { id: "settings", icon: Settings, label: "设置", sub: "SETTINGS" }
];

const priorityLevels: Array<{
  level: PriorityLevel;
  label: string;
  description: string;
}> = [
  { level: "P0", label: "P0", description: "最重要" },
  { level: "P1", label: "P1", description: "高优先级" },
  { level: "P2", label: "P2", description: "中优先级" },
  { level: "P3", label: "P3", description: "低优先级" }
];

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: {
      transcript: string;
    };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export default function Home() {
  const [input, setInput] = useState("");
  const [ideas, setIdeas] = useState<IdeaCard[]>(sampleIdeas);
  const [isIncubating, setIsIncubating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [editingIdea, setEditingIdea] = useState<IdeaCard | null>(null);
  const [selectedView, setSelectedView] = useState<ViewMode>("canvas");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const libraryRef = useRef<HTMLElement | null>(null);

  const loadingText = useTimedMessage(isIncubating);
  const allTags = useMemo(() => new Set(ideas.flatMap((idea) => idea.tags)), [ideas]);
  const favoriteIdeas = useMemo(
    () => ideas.filter((idea) => idea.priority === "P0" || idea.priority === "P1"),
    [ideas]
  );
  const tagStats = useMemo(
    () =>
      Array.from(allTags)
        .map((tag) => ({
          tag,
          count: ideas.filter((idea) => idea.tags.includes(tag)).length,
          ideas: ideas.filter((idea) => idea.tags.includes(tag))
        }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
    [allTags, ideas]
  );
  const viewMeta = getViewMeta(selectedView);
  const visibleIdeas = selectedView === "favorites" ? favoriteIdeas : ideas;

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setIdeas(JSON.parse(stored) as IdeaCard[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        setIdeas(sampleIdeas);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas, loaded]);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  async function handleIncubate() {
    const text = input.trim();
    if (!text || isIncubating) return;

    setError("");
    setIsIncubating(true);

    try {
      const idea = await incubateIdea(text);
      setIdeas((current) => [idea, ...current]);
      setInput("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "孵化失败，请稍后再试");
    } finally {
      setIsIncubating(false);
    }
  }

  async function handleCopy(idea: IdeaCard) {
    try {
      await copyText(formatIdeaMarkdown(idea));
      setCopiedId(idea.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError("复制失败，请检查浏览器剪贴板权限");
    }
  }

  function clearCanvas() {
    setIdeas([]);
    setError("");
  }

  function updateIdeaPriority(id: string, priority: PriorityLevel) {
    setIdeas((current) => current.map((idea) => (idea.id === id ? { ...idea, priority } : idea)));
  }

  function saveIdeaEdits(updatedIdea: IdeaCard) {
    setIdeas((current) => current.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea)));
    setEditingIdea(null);
  }

  function handleNavClick(view: ViewMode) {
    setSelectedView(view);
    window.setTimeout(() => {
      libraryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleVoiceInput() {
    if (isIncubating) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setError("当前浏览器不支持语音输入，请使用 Chrome 或 Edge 再试");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError("");
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      setError(getVoiceErrorMessage(event.error));
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript.trim() || "")
        .filter(Boolean)
        .join("，");

      if (!transcript) return;

      setInput((current) => {
        const separator = current.trim() ? " " : "";
        return `${current}${separator}${transcript}`.slice(0, MAX_LENGTH);
      });
    };

    try {
      recognition.start();
    } catch {
      setError("语音输入启动失败，请稍后再试");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020302] text-[#f7f3dd]">
      <div className="star-field" />
      <div className="scanlines" />
      <div className="floor-grid" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-6">
        <aside className="pixel-panel flex flex-col justify-between p-5 lg:min-h-[calc(100vh-40px)]">
          <div>
            <div className="side-brand mb-9 flex items-center gap-3">
              <div className="pixel-sigil grid h-12 w-12 place-items-center text-[#ffd95a]">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <p className="font-mono text-3xl font-black leading-none tracking-normal text-white">FlowState</p>
                <p className="mt-2 text-sm text-[#d8d2bc]">灵感流态笔记</p>
              </div>
            </div>

            <nav className="side-nav space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`pixel-nav w-full ${selectedView === item.id ? "is-active" : ""}`}
                >
                  <item.icon className="h-6 w-6" />
                  <span>
                    <span className="block text-base">{item.label}</span>
                    <span className="block font-mono text-xs uppercase text-[#9f9988]">{item.sub}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-5">
            <div className="side-stats pixel-box p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-base text-white">灵感统计</p>
                  <p className="font-mono text-xs text-[#a8a18f]">STATISTICS</p>
                </div>
                <span className="dot-line" />
              </div>
              <StatLine label="总灵感" value={ideas.length} />
              <StatLine label="本周新增" value={Math.min(ideas.length, 5)} />
              <StatLine label="标签数" value={allTags.size} />
              <StatLine label="收藏数" value={favoriteIdeas.length} />
            </div>

            <div className="pixel-chart">
              <p className="font-mono text-xs uppercase text-[#e8c75d]">Ideas flow like stars.</p>
              <div className="chart-mountains" />
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-4 flex items-center justify-end gap-3">
            <button className="pixel-tool" type="button" aria-label="切换亮度" title="切换亮度">
              <Sun className="h-5 w-5" />
            </button>
            <button className="pixel-tool px-4" type="button" onClick={clearCanvas}>
              <Trash2 className="h-5 w-5" />
              清空画板
            </button>
          </header>

          <section className="pixel-hero mb-5 p-5 sm:p-7">
            <div className="mb-4 text-center">
              <h1 className="font-mono text-3xl font-black tracking-normal text-white sm:text-4xl">
                <Sparkles className="mr-3 inline h-7 w-7 text-[#ffd95a]" />
                捕捉你的灵感火花
                <Sparkles className="ml-3 inline h-7 w-7 text-[#ffd95a]" />
              </h1>
              <p className="mt-3 text-sm text-[#b8b19e] sm:text-base">
                随时记录脑海中的想法，AI 将帮你孵化成有价值的创意
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
              <div className="pixel-input-frame min-h-36 flex-1">
                <textarea
                  className="fine-scrollbar h-full min-h-36 w-full resize-none bg-transparent px-5 py-4 pb-16 text-base leading-8 text-[#f6f0d5] outline-none placeholder:text-[#8e8878]"
                  placeholder={"在这里输入你的想法...\n例如：我想做一个帮助用户专注学习的 App，\n结合番茄钟和白噪音，还有数据统计功能..."}
                  value={input}
                  maxLength={MAX_LENGTH}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={isIncubating}
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isIncubating || !voiceSupported}
                  title={voiceSupported ? "语音输入" : "当前浏览器不支持语音输入"}
                  className={`voice-button ${isListening ? "is-listening" : ""}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isListening ? "停止聆听" : "语音输入"}
                </button>
                <span className="absolute bottom-4 right-5 font-mono text-sm text-[#8c8676]">
                  {input.length} / {MAX_LENGTH}
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncubate}
                disabled={!input.trim() || isIncubating}
                className="incubate-button"
              >
                {isIncubating ? <Loader2 className="h-7 w-7 animate-spin" /> : <Rocket className="h-8 w-8" />}
                <span className="text-xl">AI 孵化</span>
                <span className="font-mono text-xs uppercase tracking-[0.18em]">Incubate</span>
              </button>
            </div>
          </section>

          {(isIncubating || isListening || error) && (
            <section className="pixel-status mb-5 flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <div className="bot-chip">
                  {isListening ? <Mic className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
                </div>
                <div>
                  <p className="text-base text-white">
                    {isListening ? "正在聆听你的灵感，识别结果会自动写入输入框..." : error || loadingText}
                  </p>
                  <p className="mt-1 text-sm text-[#a8a18f]">
                    {isListening ? "说完后可再次点击语音按钮停止录音。" : "这可能需要 2 秒钟，请稍候..."}
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                {[0, 1, 2, 3, 4].map((dot) => (
                  <span key={dot} className={`status-dot ${dot === 3 ? "is-white" : ""}`} />
                ))}
              </div>
            </section>
          )}

          <section ref={libraryRef}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-end gap-4">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{viewMeta.title}</h2>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#8f8877]">{viewMeta.sub}</span>
              </div>

              <div className={`flex items-center gap-3 ${selectedView === "tags" || selectedView === "settings" ? "hidden sm:flex" : ""}`}>
                <div className="pixel-toggle">
                  <button className="is-active" type="button" aria-label="网格视图" title="网格视图">
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button type="button" aria-label="列表视图" title="列表视图">
                    <List className="h-5 w-5" />
                  </button>
                </div>
                <button className="pixel-select" type="button">
                  最新创建
                  <span>⌄</span>
                </button>
              </div>
            </div>

            {selectedView === "tags" ? (
              <TagLibrary
                tagStats={tagStats}
                copiedId={copiedId}
                onCopy={handleCopy}
                onEdit={setEditingIdea}
                onSetPriority={updateIdeaPriority}
              />
            ) : selectedView === "settings" ? (
              <SettingsLibrary ideas={ideas} tagCount={allTags.size} favoriteCount={favoriteIdeas.length} />
            ) : visibleIdeas.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleIdeas.map((idea) => (
                  <IdeaCardView
                    key={idea.id}
                    idea={idea}
                    copied={copiedId === idea.id}
                    onCopy={() => handleCopy(idea)}
                    onEdit={() => setEditingIdea(idea)}
                    onSetPriority={(priority) => updateIdeaPriority(idea.id, priority)}
                  />
                ))}
              </div>
            ) : (
              <div className="pixel-empty grid min-h-72 place-items-center p-8 text-center">
                <div>
                  <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#ffd95a]" />
                  <p className="text-xl text-white">{viewMeta.emptyTitle}</p>
                  <p className="mt-2 text-sm text-[#aaa391]">{viewMeta.emptyCopy}</p>
                </div>
              </div>
            )}
          </section>

          <footer className="mt-7 flex justify-center gap-9 pb-2 font-mono text-xs text-[#9b947f]">
            <span>你的灵感，是改变世界的开始。</span>
            <span>v1.0.0</span>
          </footer>
        </section>
      </div>

      {editingIdea ? (
        <IdeaEditor
          idea={editingIdea}
          onClose={() => setEditingIdea(null)}
          onSave={saveIdeaEdits}
        />
      ) : null}
    </main>
  );
}

function getViewMeta(view: ViewMode) {
  const meta: Record<
    ViewMode,
    {
      title: string;
      sub: string;
      emptyTitle: string;
      emptyCopy: string;
    }
  > = {
    canvas: {
      title: "灵感画板",
      sub: "Idea Canvas",
      emptyTitle: "画板已清空",
      emptyCopy: "输入一个想法，让 FlowState 重新点亮星图。"
    },
    all: {
      title: "全部灵感库",
      sub: "All Ideas",
      emptyTitle: "灵感库还没有内容",
      emptyCopy: "先在画板里孵化第一张灵感卡片。"
    },
    favorites: {
      title: "收藏夹",
      sub: "Priority Library",
      emptyTitle: "收藏夹还没有重点灵感",
      emptyCopy: "把灵感标记为 P0 或 P1，它们会自动进入这里。"
    },
    tags: {
      title: "标签库",
      sub: "Tag Library",
      emptyTitle: "还没有标签",
      emptyCopy: "生成或编辑卡片后，标签会自动汇总到这里。"
    },
    settings: {
      title: "设置",
      sub: "Settings",
      emptyTitle: "设置",
      emptyCopy: "管理 FlowState 的本地体验。"
    }
  };

  return meta[view];
}

function TagLibrary({
  tagStats,
  copiedId,
  onCopy,
  onEdit,
  onSetPriority
}: {
  tagStats: Array<{ tag: string; count: number; ideas: IdeaCard[] }>;
  copiedId: string | null;
  onCopy: (idea: IdeaCard) => void;
  onEdit: (idea: IdeaCard) => void;
  onSetPriority: (id: string, priority: PriorityLevel) => void;
}) {
  if (!tagStats.length) {
    return (
      <div className="pixel-empty grid min-h-72 place-items-center p-8 text-center">
        <div>
          <Tag className="mx-auto mb-4 h-10 w-10 text-[#ffd95a]" />
          <p className="text-xl text-white">标签库还是空的</p>
          <p className="mt-2 text-sm text-[#aaa391]">生成灵感或编辑标签后，这里会自动归档。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="tag-library-grid">
        {tagStats.map((item) => (
          <section key={item.tag} className="library-mini-card">
            <div>
              <p className="text-lg font-bold text-white">#{item.tag}</p>
              <p className="mt-1 font-mono text-xs text-[#9f9988]">{item.count} IDEAS</p>
            </div>
            <span className="tag-orbit" />
          </section>
        ))}
      </div>

      {tagStats.map((item) => (
        <section key={item.tag} className="tag-section">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">#{item.tag}</h3>
            <span className="font-mono text-xs text-[#8f8877]">{item.count} 张卡片</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {item.ideas.map((idea) => (
              <IdeaCardView
                key={`${item.tag}-${idea.id}`}
                idea={idea}
                copied={copiedId === idea.id}
                onCopy={() => onCopy(idea)}
                onEdit={() => onEdit(idea)}
                onSetPriority={(priority) => onSetPriority(idea.id, priority)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SettingsLibrary({
  ideas,
  tagCount,
  favoriteCount
}: {
  ideas: IdeaCard[];
  tagCount: number;
  favoriteCount: number;
}) {
  const priorityCounts = priorityLevels.map((priority) => ({
    ...priority,
    count: ideas.filter((idea) => idea.priority === priority.level).length
  }));

  return (
    <div className="settings-library">
      <section className="library-mini-card">
        <div>
          <p className="text-lg font-bold text-white">本地存储</p>
          <p className="mt-1 text-sm text-[#bdb59d]">灵感卡片保存在当前浏览器的 localStorage。</p>
        </div>
      </section>

      <section className="settings-metrics">
        <StatLine label="总灵感" value={ideas.length} />
        <StatLine label="标签数" value={tagCount} />
        <StatLine label="重点灵感" value={favoriteCount} />
      </section>

      <section className="priority-summary">
        {priorityCounts.map((priority) => (
          <div key={priority.level} className={`priority-summary-item priority-${priority.level.toLowerCase()}`}>
            <span>{priority.level}</span>
            <strong>{priority.count}</strong>
            <small>{priority.description}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

function IdeaCardView({
  idea,
  copied,
  onCopy,
  onEdit,
  onSetPriority
}: {
  idea: IdeaCard;
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onSetPriority: (priority: PriorityLevel) => void;
}) {
  const [priorityOpen, setPriorityOpen] = useState(false);
  const evaluation = getIdeaEvaluation(idea);
  const landingWay = getIdeaLandingWay(idea);
  const expansionIdeas = getIdeaExpansionIdeas(idea);

  return (
    <article className="idea-card group flex min-h-[480px] flex-col justify-between p-4">
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="status-badge">
              <Sparkles className="h-3.5 w-3.5" />
              {idea.status}
            </span>
            {idea.priority ? <PriorityBadge priority={idea.priority} /> : null}
          </div>
          <span className="text-sm text-[#9c9583]">{relativeTime(idea.created_at)}</span>
        </div>

        <h3 className="text-2xl font-black leading-tight tracking-normal text-white">{idea.title}</h3>
        <p className="mt-3 min-h-[72px] text-sm leading-7 text-[#c7c0aa]">{idea.summary}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>

        <div className="idea-insight-stack">
          <section className="idea-insight">
            <p className="idea-insight-kicker">
              <Lightbulb className="h-3.5 w-3.5" />
              AI 评价
            </p>
            <p>{evaluation}</p>
          </section>

          <section className="idea-insight">
            <p className="idea-insight-kicker">
              <Milestone className="h-3.5 w-3.5" />
              落地方式
            </p>
            <p>{landingWay}</p>
          </section>

          <section className="idea-insight idea-insight-burst">
            <p className="idea-insight-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              涌现方向
            </p>
            <div className="idea-burst-list">
              {expansionIdeas.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-5 border-t border-[#5a5035] pt-4">
        <p className="mb-3 text-sm text-white">下一步行动：</p>
        <ul className="space-y-2 text-sm leading-5 text-[#d6cfb9]">
          {idea.action_items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#ffd95a]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="card-actions-grid mt-5 grid grid-cols-[44px_1fr_112px] gap-3">
          <button className="card-action" type="button" onClick={onEdit} aria-label="编辑灵感" title="编辑灵感">
            <Edit3 className="h-5 w-5" />
          </button>
          <button className="card-action gap-2" type="button" onClick={onCopy}>
            {copied ? <Check className="h-5 w-5 text-[#ffd95a]" /> : <Clipboard className="h-5 w-5" />}
            {copied ? "已复制" : "复制分享"}
          </button>
          <div className="priority-picker">
            <button
              className={`card-action priority-trigger ${idea.priority ? `priority-${idea.priority.toLowerCase()}` : ""}`}
              type="button"
              onClick={() => setPriorityOpen((open) => !open)}
              aria-expanded={priorityOpen}
              aria-label="设置优先级标签"
              title="设置优先级标签"
            >
              <Tag className="h-4 w-4" />
              {idea.priority || "标签"}
            </button>
            {priorityOpen ? (
              <div className="priority-menu">
                {priorityLevels.map((priority) => (
                  <button
                    key={priority.level}
                    type="button"
                    className={`priority-option priority-${priority.level.toLowerCase()} ${
                      idea.priority === priority.level ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      onSetPriority(priority.level);
                      setPriorityOpen(false);
                    }}
                  >
                    <span>{priority.label}</span>
                    <small>{priority.description}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function IdeaEditor({
  idea,
  onClose,
  onSave
}: {
  idea: IdeaCard;
  onClose: () => void;
  onSave: (idea: IdeaCard) => void;
}) {
  const [draft, setDraft] = useState({
    title: idea.title,
    summary: idea.summary,
    original_text: idea.original_text,
    evaluation: getIdeaEvaluation(idea),
    landingWay: getIdeaLandingWay(idea),
    expansionIdeas: getIdeaExpansionIdeas(idea).join("\n"),
    tags: idea.tags.join("，"),
    status: idea.status,
    priority: idea.priority || "P2",
    actionOne: idea.action_items[0] || "",
    actionTwo: idea.action_items[1] || ""
  });
  const [assistInstruction, setAssistInstruction] = useState("");
  const [assistError, setAssistError] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    const tags = draft.tags
      .split(/[,，、\s]+/)
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 3);

    onSave({
      ...idea,
      title: draft.title.trim() || "未命名灵感",
      summary: draft.summary.trim() || draft.original_text.trim() || "待完善的灵感摘要",
      original_text: draft.original_text.trim(),
      tags: tags.length ? tags : ["创意"],
      status: draft.status === "Draft 草案" ? "Draft 草案" : "Spark 闪念",
      priority: draft.priority as PriorityLevel,
      evaluation: draft.evaluation.trim() || getIdeaEvaluation(idea),
      landing_way: draft.landingWay.trim() || getIdeaLandingWay(idea),
      expansion_ideas: normalizeExpansionDraft(draft.expansionIdeas),
      action_items: [
        draft.actionOne.trim() || "明确目标用户和核心场景",
        draft.actionTwo.trim() || "设计一个可验证的最小原型"
      ]
    });
  }

  async function handleAiImprove() {
    setAssistError("");
    setIsImproving(true);

    try {
      const improvedIdea = await incubateIdea(buildImprovePrompt(draft, assistInstruction));

      setDraft((current) => ({
        ...current,
        title: improvedIdea.title,
        summary: improvedIdea.summary,
        evaluation: getIdeaEvaluation(improvedIdea),
        landingWay: getIdeaLandingWay(improvedIdea),
        expansionIdeas: getIdeaExpansionIdeas(improvedIdea).join("\n"),
        tags: improvedIdea.tags.join("，"),
        status: improvedIdea.status,
        actionOne: improvedIdea.action_items[0] || current.actionOne,
        actionTwo: improvedIdea.action_items[1] || current.actionTwo
      }));
    } catch (caughtError) {
      setAssistError(caughtError instanceof Error ? caughtError.message : "AI 辅助完善失败，请稍后再试");
    } finally {
      setIsImproving(false);
    }
  }

  return (
    <div className="editor-backdrop" role="dialog" aria-modal="true" aria-label="编辑灵感">
      <section className="editor-panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ffd95a]">Idea Editor</p>
            <h2 className="mt-2 text-2xl font-black text-white">和 AI 一起完善这张灵感</h2>
          </div>
          <div className="flex gap-3">
            <button className="pixel-tool px-4" type="button" onClick={onClose}>
              取消
            </button>
            <button className="save-edit-button" type="button" onClick={handleSave}>
              保存修改
            </button>
          </div>
        </div>

        <section className="ai-assist-box">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#ffd95a]">AI Assist</p>
            <h3>告诉 AI 你想怎么完善</h3>
          </div>
          <textarea
            value={assistInstruction}
            onChange={(event) => setAssistInstruction(event.target.value)}
            placeholder="例如：把它改得更适合商业落地；补充更具体的下一步；让标题更有吸引力..."
            rows={3}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{assistError || "AI 会基于当前卡片内容，补强评价、落地方式、涌现方向和行动建议。"}</p>
            <button className="ai-assist-button" type="button" onClick={handleAiImprove} disabled={isImproving}>
              {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isImproving ? "AI 正在完善" : "AI 辅助完善"}
            </button>
          </div>
        </section>

        <div className="editor-grid">
          <EditorField label="标题" wide>
            <input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              maxLength={40}
            />
          </EditorField>

          <EditorField label="一句话总结" wide>
            <textarea
              value={draft.summary}
              onChange={(event) => updateDraft("summary", event.target.value)}
              rows={3}
            />
          </EditorField>

          <EditorField label="你的灵感内容" wide>
            <textarea
              value={draft.original_text}
              onChange={(event) => updateDraft("original_text", event.target.value)}
              rows={5}
            />
          </EditorField>

          <EditorField label="AI 评价" wide>
            <textarea
              value={draft.evaluation}
              onChange={(event) => updateDraft("evaluation", event.target.value)}
              rows={3}
            />
          </EditorField>

          <EditorField label="落地方式" wide>
            <textarea
              value={draft.landingWay}
              onChange={(event) => updateDraft("landingWay", event.target.value)}
              rows={3}
            />
          </EditorField>

          <EditorField label="涌现方向（每行一条）" wide>
            <textarea
              value={draft.expansionIdeas}
              onChange={(event) => updateDraft("expansionIdeas", event.target.value)}
              rows={4}
            />
          </EditorField>

          <EditorField label="下一步行动 1" wide>
            <textarea
              value={draft.actionOne}
              onChange={(event) => updateDraft("actionOne", event.target.value)}
              rows={2}
            />
          </EditorField>

          <EditorField label="下一步行动 2" wide>
            <textarea
              value={draft.actionTwo}
              onChange={(event) => updateDraft("actionTwo", event.target.value)}
              rows={2}
            />
          </EditorField>

          <div className="editor-details-toggle">
            <button type="button" onClick={() => setShowDetails((visible) => !visible)}>
              {showDetails ? "收起高级细节" : "展开高级细节"}
            </button>
          </div>

          {showDetails ? (
            <>
              <EditorField label="状态">
                <select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}>
                  <option value="Spark 闪念">Spark 闪念</option>
                  <option value="Draft 草案">Draft 草案</option>
                </select>
              </EditorField>

              <EditorField label="优先级">
                <select value={draft.priority} onChange={(event) => updateDraft("priority", event.target.value)}>
                  {priorityLevels.map((priority) => (
                    <option key={priority.level} value={priority.level}>
                      {priority.level} - {priority.description}
                    </option>
                  ))}
                </select>
              </EditorField>

              <EditorField label="标签" wide>
                <input
                  value={draft.tags}
                  onChange={(event) => updateDraft("tags", event.target.value)}
                  placeholder="用逗号分隔，最多 3 个"
                />
              </EditorField>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function buildImprovePrompt(
  draft: {
    title: string;
    summary: string;
    original_text: string;
    evaluation: string;
    landingWay: string;
    expansionIdeas: string;
    tags: string;
    status: string;
    actionOne: string;
    actionTwo: string;
  },
  instruction: string
) {
  return [
    "请帮我完善下面这张灵感卡片，让它更清晰、更可执行、更适合放在 FlowState 灵感画板中。",
    instruction.trim() ? `我的优化要求：${instruction.trim()}` : "我的优化要求：请自动判断最值得加强的地方。",
    "",
    `当前标题：${draft.title}`,
    `当前总结：${draft.summary}`,
    `当前灵感内容：${draft.original_text}`,
    `当前 AI 评价：${draft.evaluation}`,
    `当前落地方式：${draft.landingWay}`,
    `当前涌现方向：${draft.expansionIdeas}`,
    `当前标签：${draft.tags}`,
    `当前状态：${draft.status}`,
    `当前行动建议：1. ${draft.actionOne} 2. ${draft.actionTwo}`,
    "",
    "请保留核心想法，但可以优化表达，并补充更有判断力的评价、可执行的落地方式、能激发更多想法的涌现方向。"
  ].join("\n");
}

function normalizeExpansionDraft(value: string) {
  const items = value
    .split(/\n|[；;]/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 3);

  while (items.length < 2) {
    items.push(items.length === 0 ? "拆成一个可验证的小实验" : "邀请目标用户给出第一轮反馈");
  }

  return items;
}

function getIdeaEvaluation(idea: IdeaCard) {
  if (idea.evaluation?.trim()) return idea.evaluation.trim();

  const leadTag = idea.tags[0] || "创意";
  return `这个灵感已经有可探索的切口，适合先围绕「${leadTag}」验证真实需求；主要风险是表达有趣但场景还不够聚焦。`;
}

function getIdeaLandingWay(idea: IdeaCard) {
  if (idea.landing_way?.trim()) return idea.landing_way.trim();

  const leadTag = idea.tags[0] || "创意";
  return `先做一个只服务单一场景的 MVP，把「${leadTag}」变成可演示流程，再找 3-5 个目标用户试用反馈。`;
}

function getIdeaExpansionIdeas(idea: IdeaCard) {
  if (idea.expansion_ideas?.length) {
    const savedIdeas = idea.expansion_ideas.map((item) => item.trim()).filter(Boolean).slice(0, 3);
    if (savedIdeas.length) return savedIdeas;
  }

  const leadTag = idea.tags[0] || "创意";
  return [`做成 7 天验证实验`, `寻找「${leadTag}」核心用户`, "增加 AI 自动整理能力"];
}

function EditorField({
  label,
  wide,
  children
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`editor-field ${wide ? "is-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const current = priorityLevels.find((item) => item.level === priority);

  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`}>
      <Tag className="h-3.5 w-3.5" />
      {current?.label || priority}
    </span>
  );
}

function StatLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 flex items-center justify-between text-sm">
      <span className="text-[#ddd5bd]">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function useTimedMessage(active: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % loadingMessages.length);
    }, 520);

    return () => window.clearInterval(interval);
  }, [active]);

  return loadingMessages[index];
}

function relativeTime(isoDate: string) {
  const delta = Date.now() - new Date(isoDate).getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) return "刚刚";
  if (delta < hour) return `${Math.max(1, Math.round(delta / minute))} 分钟前`;
  if (delta < day) return `${Math.round(delta / hour)} 小时前`;
  return "昨天";
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;

  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
}

function getVoiceErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    "not-allowed": "麦克风权限被拒绝，请允许浏览器使用麦克风后再试",
    "service-not-allowed": "当前浏览器阻止了语音识别服务",
    "no-speech": "没有识别到语音，可以再试一次",
    "audio-capture": "没有检测到可用麦克风",
    network: "语音识别网络服务暂时不可用"
  };

  return messages[error || ""] || "语音输入暂时不可用，请稍后再试";
}

async function copyText(text: string) {
  let clipboardWrite: Promise<void> | undefined;

  try {
    clipboardWrite = navigator.clipboard?.writeText?.(text);
  } catch {
    clipboardWrite = undefined;
  }

  if (copyTextWithSelection(text)) {
    clipboardWrite?.catch(() => undefined);
    return;
  }

  if (clipboardWrite) {
    await clipboardWrite;
    return;
  }

  throw new Error("Copy command was rejected");
}

function copyTextWithSelection(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}
