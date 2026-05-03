"use client";

import {
  Bot,
  Check,
  CheckCircle2,
  Clipboard,
  Crown,
  Edit3,
  Eye,
  Gift,
  LayoutGrid,
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
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IdeaCard,
  InspirationPet,
  PriorityLevel,
  formatIdeaMarkdown,
  generateInspirationPet,
  incubateIdea
} from "@/lib/ideas";

const STORAGE_KEY = "flowstate.idea-canvas.v1";
const MAX_LENGTH = 500;

const loadingMessages = [
  "AI 正在提炼关键词，构建你的创意卡片...",
  "正在压缩想法噪音，寻找最亮的主线...",
  "正在生成 MVP 路线和 AI 可解决的问题...",
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
    mvp_plan: "先做一个专注计时 + 白噪音 + 学习记录的单人版，用 20 名学生测试 7 天完成率和复用意愿。",
    mvp_features: ["番茄钟计时", "白噪音播放", "学习记录保存", "专注报告生成"],
    iteration_directions: ["V1.1：加入 AI 学习计划", "V1.2：做自习室排行榜", "V2.0：生成长期成长报告"],
    ai_impact: ["整理成本：预计减少 60%-75%", "复盘压力：预计减少 40%-55%", "计划制定：预计减少 35%-50%"],
    action_items: ["整理成本：预计减少 60%-75%", "复盘压力：预计减少 40%-55%", "计划制定：预计减少 35%-50%"],
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
    mvp_plan: "先做周末短途旅行生成器，只输入预算、天数和兴趣，输出一页可执行路线并支持保存。",
    mvp_features: ["偏好输入", "路线生成", "预算提示", "行程保存"],
    iteration_directions: ["V1.1：加入多人偏好协调", "V1.2：接入预算提醒", "V2.0：生成可分享旅行卡片"],
    ai_impact: ["攻略整理：预计减少 65%-85%", "路线决策：预计减少 45%-60%", "预算估算：预计减少 30%-45%"],
    action_items: ["攻略整理：预计减少 65%-85%", "路线决策：预计减少 45%-60%", "预算估算：预计减少 30%-45%"],
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
    mvp_plan: "先做匿名情绪记录和 AI 温柔回应，不开放社区互动，重点验证用户是否愿意持续记录。",
    mvp_features: ["匿名记录", "AI 回应", "情绪标签", "隐私提示"],
    iteration_directions: ["V1.1：加入情绪趋势日历", "V1.2：设计危机提示机制", "V2.0：推出每日自我关怀卡片"],
    ai_impact: ["表达整理：预计减少 50%-70%", "情绪命名：预计减少 35%-50%", "自我复盘：预计减少 30%-45%"],
    action_items: ["表达整理：预计减少 50%-70%", "情绪命名：预计减少 35%-50%", "自我复盘：预计减少 30%-45%"],
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
    mvp_plan: "先做人工审核的灵感看板，撮合 10 个想法方和资源方，验证双方是否愿意沟通和成交。",
    mvp_features: ["灵感发布", "人工审核", "资源方报名", "撮合记录"],
    iteration_directions: ["V1.1：增加创意悬赏机制", "V1.2：建立灵感估值模板", "V2.0：做成功案例展示页"],
    ai_impact: ["信息整理：预计减少 55%-75%", "匹配筛选：预计减少 35%-55%", "沟通准备：预计减少 30%-45%"],
    action_items: ["信息整理：预计减少 55%-75%", "匹配筛选：预计减少 35%-55%", "沟通准备：预计减少 30%-45%"],
    created_at: new Date(Date.now() - 86_400_000).toISOString()
  }
];

type ViewMode = "canvas" | "all" | "favorites" | "tags" | "prizes" | "settings";

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
  { id: "prizes", icon: Gift, label: "灵感奖池", sub: "PRIZE POOL" },
  { id: "settings", icon: Settings, label: "设置", sub: "SETTINGS" }
];

const priorityLevels: Array<{
  level: PriorityLevel;
  label: string;
  description: string;
}> = [
  { level: "P0", label: "P0", description: "当前主线" },
  { level: "P1", label: "P1", description: "值得推进" },
  { level: "P2", label: "P2", description: "观察" },
  { level: "P3", label: "P3", description: "存档" }
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
  const [focusedIdeaId, setFocusedIdeaId] = useState<string | null>(null);
  const [newRewardPet, setNewRewardPet] = useState<InspirationPet | null>(null);
  const [selectedView, setSelectedView] = useState<ViewMode>("canvas");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const libraryRef = useRef<HTMLElement | null>(null);

  const loadingText = useTimedMessage(isIncubating);
  const allTags = useMemo(() => new Set(ideas.flatMap((idea) => idea.tags)), [ideas]);
  const focusedIdea = useMemo(
    () => ideas.find((idea) => idea.id === focusedIdeaId) || null,
    [focusedIdeaId, ideas]
  );
  const rewardedIdeas = useMemo(
    () =>
      ideas
        .filter((idea) => idea.reward_pet)
        .sort(
          (a, b) =>
            new Date(b.reward_pet?.awarded_at || b.completed_at || b.created_at).getTime() -
            new Date(a.reward_pet?.awarded_at || a.completed_at || a.created_at).getTime()
        ),
    [ideas]
  );
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
    setFocusedIdeaId(null);
    setNewRewardPet(null);
    setError("");
  }

  function updateIdeaPriority(id: string, priority: PriorityLevel) {
    setIdeas((current) => current.map((idea) => (idea.id === id ? { ...idea, priority } : idea)));
  }

  function saveIdeaEdits(updatedIdea: IdeaCard) {
    setIdeas((current) => current.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea)));
    setEditingIdea(null);
  }

  function completeIdea(id: string) {
    const target = ideas.find((idea) => idea.id === id);
    if (!target) return;

    const reward = target.reward_pet || generateInspirationPet(target);
    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              completed_at: idea.completed_at || new Date().toISOString(),
              reward_pet: reward
            }
          : idea
      )
    );
    setNewRewardPet(reward);
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
              <StatLine label="奖池数" value={rewardedIdeas.length} />
            </div>

            <div className="pixel-chart">
              <p className="font-mono text-xs uppercase text-[#e8c75d]">Focus. Finish. Hatch.</p>
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

              <div className="canvas-meter-row">
                <span>
                  <Crown className="h-4 w-4" />
                  重点 {favoriteIdeas.length}
                </span>
                <span>
                  <Gift className="h-4 w-4" />
                  奖池 {rewardedIdeas.length}
                </span>
              </div>
            </div>

            {selectedView === "tags" ? (
              <TagLibrary
                tagStats={tagStats}
                copiedId={copiedId}
                onCopy={handleCopy}
                onEdit={setEditingIdea}
                onOpen={(idea) => setFocusedIdeaId(idea.id)}
                onSetPriority={updateIdeaPriority}
              />
            ) : selectedView === "prizes" ? (
              <PrizePool rewardedIdeas={rewardedIdeas} onOpen={(idea) => setFocusedIdeaId(idea.id)} />
            ) : selectedView === "settings" ? (
              <SettingsLibrary
                ideas={ideas}
                tagCount={allTags.size}
                favoriteCount={favoriteIdeas.length}
                rewardCount={rewardedIdeas.length}
              />
            ) : visibleIdeas.length ? (
              <div className="idea-grid-compact">
                {visibleIdeas.map((idea) => (
                  <IdeaCardView
                    key={idea.id}
                    idea={idea}
                    copied={copiedId === idea.id}
                    onCopy={() => handleCopy(idea)}
                    onEdit={() => setEditingIdea(idea)}
                    onOpen={() => setFocusedIdeaId(idea.id)}
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

      {focusedIdea ? (
        <IdeaDetail
          idea={focusedIdea}
          copied={copiedId === focusedIdea.id}
          onClose={() => setFocusedIdeaId(null)}
          onCopy={() => handleCopy(focusedIdea)}
          onEdit={() => {
            setEditingIdea(focusedIdea);
            setFocusedIdeaId(null);
          }}
          onComplete={() => completeIdea(focusedIdea.id)}
          onSetPriority={(priority) => updateIdeaPriority(focusedIdea.id, priority)}
        />
      ) : null}

      {newRewardPet ? (
        <RewardReveal pet={newRewardPet} onClose={() => setNewRewardPet(null)} />
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
    prizes: {
      title: "灵感奖池",
      sub: "Prize Pool",
      emptyTitle: "奖池还没有小宠物",
      emptyCopy: "进入某个灵感并完成项目，就能孵化一个随机奖励。"
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
  onOpen,
  onSetPriority
}: {
  tagStats: Array<{ tag: string; count: number; ideas: IdeaCard[] }>;
  copiedId: string | null;
  onCopy: (idea: IdeaCard) => void;
  onEdit: (idea: IdeaCard) => void;
  onOpen: (idea: IdeaCard) => void;
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
          <div className="idea-grid-compact">
            {item.ideas.map((idea) => (
              <IdeaCardView
                key={`${item.tag}-${idea.id}`}
                idea={idea}
                copied={copiedId === idea.id}
                onCopy={() => onCopy(idea)}
                onEdit={() => onEdit(idea)}
                onOpen={() => onOpen(idea)}
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
  favoriteCount,
  rewardCount
}: {
  ideas: IdeaCard[];
  tagCount: number;
  favoriteCount: number;
  rewardCount: number;
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
        <StatLine label="灵感奖池" value={rewardCount} />
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

function PrizePool({
  rewardedIdeas,
  onOpen
}: {
  rewardedIdeas: IdeaCard[];
  onOpen: (idea: IdeaCard) => void;
}) {
  if (!rewardedIdeas.length) {
    return (
      <div className="pixel-empty prize-empty grid min-h-72 place-items-center p-8 text-center">
        <div>
          <Gift className="mx-auto mb-4 h-10 w-10 text-[#ffd95a]" />
          <p className="text-xl text-white">奖池等待第一次孵化</p>
          <p className="mt-2 text-sm text-[#aaa391]">打开一张灵感卡片，完成项目后会获得随机灵感小宠物。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prize-grid">
      {rewardedIdeas.map((idea) => {
        const pet = idea.reward_pet;
        if (!pet) return null;

        return (
          <button key={pet.id} type="button" className="pet-card" onClick={() => onOpen(idea)}>
            <PetSprite pet={pet} />
            <div className="min-w-0">
              <p className="pet-card-name">{pet.name}</p>
              <p className="pet-card-species">{pet.species}</p>
              <p className="pet-card-source">来自：{idea.title}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function IdeaCardView({
  idea,
  copied,
  onCopy,
  onEdit,
  onOpen,
  onSetPriority
}: {
  idea: IdeaCard;
  copied: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onOpen: () => void;
  onSetPriority: (priority: PriorityLevel) => void;
}) {
  const [priorityOpen, setPriorityOpen] = useState(false);
  const mvpPlan = getIdeaMvpPlan(idea);

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article
      className={`idea-card compact-card group ${idea.completed_at ? "is-completed" : ""} ${
        idea.priority === "P0" ? "is-focus" : ""
      }`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleCardKeyDown}
      aria-label={`查看灵感：${idea.title}`}
    >
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="status-badge">
              <Sparkles className="h-3.5 w-3.5" />
              {idea.status}
            </span>
            {idea.priority ? <PriorityBadge priority={idea.priority} /> : null}
          </div>
          <span className="text-sm text-[#9c9583]">{relativeTime(idea.created_at)}</span>
        </div>

        <h3 className="compact-card-title">{idea.title}</h3>
        <p className="compact-card-summary">{idea.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>

        <div className="compact-insight">
          <Milestone className="h-3.5 w-3.5" />
          <span>{mvpPlan}</span>
        </div>
      </div>

      <div className="compact-card-footer">
        {idea.reward_pet ? (
          <span className="reward-mini">
            <Gift className="h-3.5 w-3.5" />
            {idea.reward_pet.name}
          </span>
        ) : (
          <span className="open-hint">
            <Eye className="h-3.5 w-3.5" />
            聚焦
          </span>
        )}

        <div className="compact-actions">
          <button
            className="card-action icon-only"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            aria-label="编辑灵感"
            title="编辑灵感"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            className="card-action icon-only"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCopy();
            }}
            aria-label="复制分享"
            title="复制分享"
          >
            {copied ? <Check className="h-4 w-4 text-[#ffd95a]" /> : <Clipboard className="h-4 w-4" />}
          </button>
          <div className="priority-picker">
            <button
              className={`card-action priority-trigger compact-priority ${idea.priority ? `priority-${idea.priority.toLowerCase()}` : ""}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setPriorityOpen((open) => !open);
              }}
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
                    onClick={(event) => {
                      event.stopPropagation();
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

function IdeaDetail({
  idea,
  copied,
  onClose,
  onCopy,
  onEdit,
  onComplete,
  onSetPriority
}: {
  idea: IdeaCard;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onSetPriority: (priority: PriorityLevel) => void;
}) {
  const mvpPlan = getIdeaMvpPlan(idea);
  const mvpFeatures = getIdeaMvpFeatures(idea);
  const iterationDirections = getIdeaIterationDirections(idea);
  const aiImpact = getIdeaAiImpact(idea);

  return (
    <div className="focus-backdrop" role="dialog" aria-modal="true" aria-label="灵感专注舱">
      <section className={`focus-panel ${idea.priority === "P0" ? "is-p0" : ""}`}>
        <button className="focus-close" type="button" onClick={onClose} aria-label="关闭详情" title="关闭详情">
          <X className="h-5 w-5" />
        </button>

        <div className="focus-header">
          <div className="min-w-0">
            <p className="pixel-kicker">Focus Chamber</p>
            <h2>{idea.title}</h2>
            <p>{idea.summary}</p>
          </div>
          <div className="focus-header-actions">
            <button className="card-action gap-2" type="button" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
              编辑
            </button>
            <button className="card-action gap-2" type="button" onClick={onCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        </div>

        <div className="focus-layout">
          <div className="focus-main">
            <section className="focus-section">
              <p className="focus-section-title">
                <Milestone className="h-4 w-4" />
                最小 MVP 怎么搭建
              </p>
              <p>{mvpPlan}</p>
            </section>

            <section className="focus-section">
              <p className="focus-section-title">
                <LayoutGrid className="h-4 w-4" />
                MVP 必备功能
              </p>
              <div className="focus-chip-list">
                {mvpFeatures.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </section>

            <section className="focus-section">
              <p className="focus-section-title">
                <Sparkles className="h-4 w-4" />
                后续版本迭代方向
              </p>
              <div className="focus-chip-list">
                {iterationDirections.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </section>

            <section className="focus-section">
              <p className="focus-section-title">
                <CheckCircle2 className="h-4 w-4" />
                AI 预计能解决的问题
              </p>
              <ul className="focus-action-list">
                {aiImpact.map((item, index) => (
                  <li key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="focus-section">
              <p className="focus-section-title">原始想法</p>
              <p>{idea.original_text}</p>
            </section>
          </div>

          <aside className="focus-sidebar">
            <section className="focus-console">
              <p className="pixel-kicker">Priority Tag</p>
              <p className="focus-console-copy">优先级只作为项目标签使用，用来判断当前推进节奏。</p>
              <div className="priority-command-grid">
                {priorityLevels.map((priority) => (
                  <button
                    key={priority.level}
                    type="button"
                    className={`priority-option priority-${priority.level.toLowerCase()} ${
                      idea.priority === priority.level ? "is-selected" : ""
                    }`}
                    onClick={() => onSetPriority(priority.level)}
                  >
                    <span>{priority.label}</span>
                    <small>{priority.description}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="focus-console">
              <p className="pixel-kicker">Prize Hatch</p>
              {idea.reward_pet ? (
                <div className="focus-pet">
                  <PetSprite pet={idea.reward_pet} />
                  <strong>{idea.reward_pet.name}</strong>
                  <span>{idea.reward_pet.motto}</span>
                </div>
              ) : (
                <>
                  <p className="focus-console-copy">完成这个灵感项目，抽取一个随机灵感小宠物放入奖池。</p>
                  <button className="complete-button" type="button" onClick={onComplete}>
                    <Gift className="h-4 w-4" />
                    完成项目并开奖
                  </button>
                </>
              )}
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function PetSprite({ pet }: { pet: InspirationPet }) {
  const spriteStyle = {
    "--pet-main": pet.palette[0],
    "--pet-accent": pet.palette[1],
    "--pet-glow": pet.palette[2]
  } as React.CSSProperties;

  return (
    <div className={`pet-sprite pet-sprite-${pet.sprite}`} style={spriteStyle} aria-hidden="true">
      <span className="pet-aura" />
      <span className="pet-body" />
      <span className="pet-face">
        <span className="pet-eye pet-eye-left" />
        <span className="pet-eye pet-eye-right" />
        <span className="pet-mouth" />
      </span>
      <span className="pet-spark pet-spark-one" />
      <span className="pet-spark pet-spark-two" />
    </div>
  );
}

function RewardReveal({ pet, onClose }: { pet: InspirationPet; onClose: () => void }) {
  return (
    <div className="reward-backdrop" role="dialog" aria-modal="true" aria-label="灵感奖励">
      <section className="reward-panel">
        <p className="pixel-kicker">Prize Unlocked</p>
        <PetSprite pet={pet} />
        <h2>{pet.name}</h2>
        <p>{pet.species}</p>
        <span>{pet.motto}</span>
        <button className="complete-button" type="button" onClick={onClose}>
          收进奖池
        </button>
      </section>
    </div>
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
    mvpPlan: getIdeaMvpPlan(idea),
    mvpFeatures: getIdeaMvpFeatures(idea).join("\n"),
    iterationDirections: getIdeaIterationDirections(idea).join("\n"),
    aiImpact: getIdeaAiImpact(idea).join("\n"),
    tags: idea.tags.join("，"),
    status: idea.status,
    priority: idea.priority || "P2",
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
      mvp_plan: draft.mvpPlan.trim() || getIdeaMvpPlan(idea),
      mvp_features: normalizeListDraft(draft.mvpFeatures, ["灵感输入", "AI 结构化生成", "本地保存"]),
      iteration_directions: normalizeListDraft(draft.iterationDirections, [
        "V1.1：补充模板化流程",
        "V1.2：加入数据反馈"
      ]),
      ai_impact: normalizeListDraft(draft.aiImpact, ["整理成本：预计减少 60%-80%", "决策压力：预计减少 35%-55%"]),
      action_items: normalizeListDraft(draft.aiImpact, ["整理成本：预计减少 60%-80%", "决策压力：预计减少 35%-55%"])
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
        mvpPlan: getIdeaMvpPlan(improvedIdea),
        mvpFeatures: getIdeaMvpFeatures(improvedIdea).join("\n"),
        iterationDirections: getIdeaIterationDirections(improvedIdea).join("\n"),
        aiImpact: getIdeaAiImpact(improvedIdea).join("\n"),
        tags: improvedIdea.tags.join("，"),
        status: improvedIdea.status
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
            placeholder="例如：把 MVP 缩小到一周内能做完；补充 AI 能解决的问题；让迭代路线更清楚..."
            rows={3}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{assistError || "AI 会基于当前卡片内容，补强 MVP 方案、必备功能、迭代路线和 AI 影响范围。"}</p>
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

          <EditorField label="最小 MVP 怎么搭建" wide>
            <textarea
              value={draft.mvpPlan}
              onChange={(event) => updateDraft("mvpPlan", event.target.value)}
              rows={3}
            />
          </EditorField>

          <EditorField label="MVP 必备功能（每行一条）" wide>
            <textarea
              value={draft.mvpFeatures}
              onChange={(event) => updateDraft("mvpFeatures", event.target.value)}
              rows={4}
            />
          </EditorField>

          <EditorField label="后续版本迭代方向（每行一条）" wide>
            <textarea
              value={draft.iterationDirections}
              onChange={(event) => updateDraft("iterationDirections", event.target.value)}
              rows={4}
            />
          </EditorField>

          <EditorField label="AI 预计能解决的问题（每行一条）" wide>
            <textarea
              value={draft.aiImpact}
              onChange={(event) => updateDraft("aiImpact", event.target.value)}
              rows={4}
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
    mvpPlan: string;
    mvpFeatures: string;
    iterationDirections: string;
    aiImpact: string;
    tags: string;
    status: string;
  },
  instruction: string
) {
  return [
    "请帮我完善下面这张灵感卡片，让它更像一份清晰的项目孵化说明书。",
    instruction.trim() ? `我的优化要求：${instruction.trim()}` : "我的优化要求：请自动判断最值得加强的地方。",
    "",
    `当前标题：${draft.title}`,
    `当前总结：${draft.summary}`,
    `当前灵感内容：${draft.original_text}`,
    `当前最小 MVP：${draft.mvpPlan}`,
    `当前 MVP 功能：${draft.mvpFeatures}`,
    `当前后续迭代：${draft.iterationDirections}`,
    `当前 AI 可解决的问题：${draft.aiImpact}`,
    `当前标签：${draft.tags}`,
    `当前状态：${draft.status}`,
    "",
    "请保留核心想法，但把输出重写为：最小 MVP 怎么搭建、MVP 必备功能、后续版本迭代方向、AI 预计能解决的问题。AI 影响只能用预估范围，不要做绝对评分。"
  ].join("\n");
}

function normalizeListDraft(value: string, fallback: string[]) {
  const items = value
    .split(/\n|[；;]/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 5);

  while (items.length < Math.min(2, fallback.length)) {
    items.push(fallback[items.length] || fallback[0]);
  }

  return items.length ? items : fallback;
}

function getIdeaMvpPlan(idea: IdeaCard) {
  if (idea.mvp_plan?.trim()) return idea.mvp_plan.trim();
  if (idea.landing_way?.trim()) return idea.landing_way.trim();

  const leadTag = idea.tags[0] || "创意";
  return `先围绕「${leadTag}」搭建一个单场景 MVP，只保留输入、AI 处理、结果保存和反馈闭环。`;
}

function getIdeaMvpFeatures(idea: IdeaCard) {
  const features = idea.mvp_features?.map((item) => item.trim()).filter(Boolean).slice(0, 5);
  if (features?.length) return features;

  return ["灵感输入", "AI 结构化生成", "本地保存", "复制分享"];
}

function getIdeaIterationDirections(idea: IdeaCard) {
  const directions = idea.iteration_directions?.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (directions?.length) return directions;

  const legacyDirections = idea.expansion_ideas?.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (legacyDirections?.length) return legacyDirections;

  const leadTag = idea.tags[0] || "创意";
  return [`V1.1：补充模板化流程`, `V1.2：围绕「${leadTag}」加入反馈分析`, "V2.0：支持团队协作和知识库"];
}

function getIdeaAiImpact(idea: IdeaCard) {
  const impact = idea.ai_impact?.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (impact?.length) return impact;

  const legacyActions = idea.action_items?.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  if (legacyActions?.length) return legacyActions;

  return ["整理成本：预计减少 60%-80%", "决策压力：预计减少 35%-55%", "执行阻力：预计减少 30%-45%"];
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
