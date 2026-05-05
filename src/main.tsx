import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BrainCircuit,
  Check,
  ChevronRight,
  DatabaseZap,
  FileUp,
  Gauge,
  Layers3,
  Pause,
  Play,
  Plus,
  Route,
  Search,
  Settings2,
  Sparkles,
  Upload,
  Wrench
} from "lucide-react";
import "./styles.css";

type MechanismScene = {
  id: string;
  theme: string;
  title: string;
  summary: string;
  difficulty: "入门" | "进阶" | "深入";
  tokens: string[];
  stages: string[];
  insights: string[];
  controls: string[];
};

const builtInScenes: MechanismScene[] = [
  {
    id: "token-stream",
    theme: "生成机制",
    title: "Token 逐步输出",
    summary: "观察模型如何把上下文压缩成下一步概率分布，并一次追加一个 token。",
    difficulty: "入门",
    tokens: ["大", "语", "言", "模", "型", "会", "逐", "个", "预", "测", "下", "一", "个", "token", "。"],
    stages: ["上下文编码", "logits 计算", "采样策略", "追加 token", "刷新上下文"],
    insights: ["每一步都只确定一个新 token。", "温度和 top-p 改变候选分布形状。", "长输出是多次局部选择累积的结果。"],
    controls: ["速度", "温度", "top-p"]
  },
  {
    id: "attention-flow",
    theme: "表示与注意力",
    title: "注意力流",
    summary: "把一个 token 对历史片段的关注权重可视化，帮助解释引用和指代关系。",
    difficulty: "进阶",
    tokens: ["它", "会", "把", "相关", "上下文", "聚焦", "到", "当前", "位置"],
    stages: ["Q/K/V 投影", "相似度打分", "mask 约束", "softmax 权重", "加权汇聚"],
    insights: ["注意力不是完整解释，但能显示信息路由线索。", "不同层和头会捕获不同类型关系。", "因果 mask 阻止模型查看未来 token。"],
    controls: ["层", "头", "权重阈值"]
  },
  {
    id: "context-window",
    theme: "上下文管理",
    title: "上下文窗口",
    summary: "展示 prompt、历史对话和检索片段如何占用上下文预算。",
    difficulty: "入门",
    tokens: ["系统", "指令", "用户", "问题", "历史", "消息", "检索", "片段", "回答"],
    stages: ["输入拼接", "token 计数", "截断策略", "位置编码", "响应生成"],
    insights: ["上下文窗口是有限预算。", "越靠后的信息通常更容易影响回答。", "压缩和摘要能换取更多有效空间。"],
    controls: ["预算", "保留策略", "摘要开关"]
  },
  {
    id: "rag-retrieval",
    theme: "增强流程",
    title: "RAG 检索",
    summary: "把问题转成向量，召回相关片段，再把证据注入模型输入。",
    difficulty: "进阶",
    tokens: ["问题", "向量化", "相似度", "召回", "重排", "拼接", "生成"],
    stages: ["query embedding", "向量检索", "重排序", "上下文注入", "带证据回答"],
    insights: ["RAG 的质量取决于切分、召回和重排。", "检索结果需要和用户问题共同进入上下文。", "引用链可以提升可审计性。"],
    controls: ["top-k", "重排", "引用显示"]
  },
  {
    id: "tool-calling",
    theme: "代理与工具",
    title: "工具调用",
    summary: "观察模型如何决定调用工具、传入参数，并把结果合并回回答。",
    difficulty: "深入",
    tokens: ["计划", "选择", "工具", "生成", "参数", "执行", "读取", "结果", "回答"],
    stages: ["意图识别", "工具选择", "参数生成", "外部执行", "结果归纳"],
    insights: ["工具调用把语言模型和外部系统连接起来。", "参数结构需要严格校验。", "工具结果应回到模型上下文再综合。"],
    controls: ["工具白名单", "参数校验", "重试"]
  }
];

const iconByScene: Record<string, React.ElementType> = {
  "token-stream": Sparkles,
  "attention-flow": BrainCircuit,
  "context-window": Layers3,
  "rag-retrieval": DatabaseZap,
  "tool-calling": Wrench
};

function normalizeUploadedScene(input: Partial<MechanismScene>, index: number): MechanismScene {
  return {
    id: input.id || `custom-${Date.now()}-${index}`,
    theme: input.theme || "自定义上传",
    title: input.title || `上传场景 ${index + 1}`,
    summary: input.summary || "从上传内容生成的原理展示场景。",
    difficulty: input.difficulty || "入门",
    tokens: Array.isArray(input.tokens) && input.tokens.length > 0 ? input.tokens.map(String) : ["自", "定", "义", "内", "容"],
    stages: Array.isArray(input.stages) && input.stages.length > 0 ? input.stages.map(String) : ["导入", "解析", "展示"],
    insights: Array.isArray(input.insights) && input.insights.length > 0 ? input.insights.map(String) : ["可以继续补充关键解释点。"],
    controls: Array.isArray(input.controls) && input.controls.length > 0 ? input.controls.map(String) : ["播放"]
  };
}

function App() {
  const [customScenes, setCustomScenes] = useState<MechanismScene[]>(() => {
    const saved = localStorage.getItem("llm-mechanism-scenes");
    return saved ? JSON.parse(saved) : [];
  });
  const scenes = useMemo(() => [...builtInScenes, ...customScenes], [customScenes]);
  const [selectedId, setSelectedId] = useState(scenes[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [draft, setDraft] = useState(exampleJson);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = scenes.find((scene) => scene.id === selectedId) || scenes[0];
  const filteredScenes = scenes.filter((scene) => {
    const text = `${scene.theme} ${scene.title} ${scene.summary}`;
    return text.toLowerCase().includes(query.trim().toLowerCase());
  });
  const themes = Array.from(new Set(filteredScenes.map((scene) => scene.theme)));

  useEffect(() => {
    localStorage.setItem("llm-mechanism-scenes", JSON.stringify(customScenes));
  }, [customScenes]);

  useEffect(() => {
    setCursor(0);
    setIsPlaying(true);
  }, [selectedId]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setCursor((current) => (current + 1) % selected.tokens.length);
    }, 720);
    return () => window.clearInterval(timer);
  }, [isPlaying, selected.tokens.length]);

  const importScenes = (raw: string) => {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const nextScenes = items.map((item, index) => normalizeUploadedScene(item, index));
    setCustomScenes((current) => [...nextScenes, ...current]);
    setSelectedId(nextScenes[0].id);
    setUploadOpen(false);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setDraft(text);
    importScenes(text);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="主题导航">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={22} />
          </div>
          <div>
            <strong>LLM Mechanisms Visualized</strong>
            <span>可扩展原理展示库</span>
          </div>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索主题或场景" />
        </label>

        <nav className="theme-list">
          {themes.map((theme) => (
            <section key={theme}>
              <h2>{theme}</h2>
              {filteredScenes
                .filter((scene) => scene.theme === theme)
                .map((scene) => {
                  const Icon = iconByScene[scene.id] || Route;
                  return (
                    <button
                      key={scene.id}
                      className={`scene-link ${scene.id === selected.id ? "active" : ""}`}
                      onClick={() => setSelectedId(scene.id)}
                    >
                      <Icon size={17} />
                      <span>{scene.title}</span>
                      <ChevronRight size={15} />
                    </button>
                  );
                })}
            </section>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="caption">场景</span>
            <h1>{selected.title}</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button">
              <Settings2 size={17} />
              设置
            </button>
            <button className="primary-button" onClick={() => setUploadOpen(true)}>
              <Upload size={17} />
              上传内容
            </button>
          </div>
        </header>

        <div className="stage-grid">
          <section className="demo-panel" aria-label="Token 逐步输出演示">
            <div className="panel-head">
              <div>
                <span className="caption">逐 token</span>
                <h2>Token 逐步输出</h2>
              </div>
              <button className="icon-button" onClick={() => setIsPlaying((value) => !value)} aria-label={isPlaying ? "暂停" : "播放"}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>

            <div className="token-stream">
              {selected.tokens.map((token, index) => (
                <span key={`${token}-${index}`} className={index <= cursor ? "token visible" : "token"}>
                  {token}
                </span>
              ))}
              <span className="caret" />
            </div>

            <div className="probability-lanes">
              {selected.tokens.slice(0, 7).map((token, index) => (
                <div className={`lane ${index === cursor % 7 ? "hot" : ""}`} key={`${token}-lane-${index}`}>
                  <span>{token}</span>
                  <div style={{ width: `${44 + ((index + cursor) % 5) * 10}%` }} />
                </div>
              ))}
            </div>
          </section>

          <section className="flow-panel" aria-label="机制流程">
            <div className="panel-head">
              <div>
                <span className="caption">场景流程</span>
                <h2>{selected.title}</h2>
              </div>
              <span className="difficulty">{selected.difficulty}</span>
            </div>

            <div className="mechanism-flow">
              {selected.stages.map((stage, index) => (
                <article className={index <= cursor % selected.stages.length ? "flow-step active" : "flow-step"} key={stage}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{stage}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="library-panel" aria-label="场景库">
            <div className="panel-head">
              <div>
                <span className="caption">可拓展内容</span>
                <h2>主题与场景</h2>
              </div>
              <button className="text-button" onClick={() => setUploadOpen(true)}>
                <Plus size={16} />
                新增
              </button>
            </div>
            <div className="scene-rail">
              {scenes.map((scene) => (
                <button key={scene.id} className={scene.id === selected.id ? "scene-card active" : "scene-card"} onClick={() => setSelectedId(scene.id)}>
                  <span>{scene.theme}</span>
                  <strong>{scene.title}</strong>
                  <small>{scene.summary}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <aside className="inspector" aria-label="场景详情">
        <div className="inspector-head">
          <span className="caption">详情</span>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
        </div>

        <section className="meter-block">
          <div className="meter-title">
            <Gauge size={17} />
            播放进度
          </div>
          <div className="progress">
            <div style={{ width: `${((cursor + 1) / selected.tokens.length) * 100}%` }} />
          </div>
        </section>

        <section className="insight-list">
          <h3>关键解释</h3>
          {selected.insights.map((insight) => (
            <div className="insight-item" key={insight}>
              <Check size={16} />
              <span>{insight}</span>
            </div>
          ))}
        </section>

        <section className="control-list">
          <h3>可调参数</h3>
          {selected.controls.map((control) => (
            <label className="control-row" key={control}>
              <span>{control}</span>
              <input type="range" min="0" max="100" defaultValue="58" />
            </label>
          ))}
        </section>
      </aside>

      {uploadOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="上传内容">
          <section className="upload-modal">
            <div className="panel-head">
              <div>
                <span className="caption">导入 JSON</span>
                <h2>上传内容</h2>
              </div>
              <button className="ghost-button" onClick={() => setUploadOpen(false)}>
                关闭
              </button>
            </div>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
            <div className="upload-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <button className="ghost-button" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={17} />
                选择文件
              </button>
              <button className="primary-button" onClick={() => importScenes(draft)}>
                导入场景
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

const exampleJson = `{
  "theme": "自定义上传",
  "title": "提示词路由",
  "summary": "展示系统如何根据用户意图选择不同处理路径。",
  "difficulty": "进阶",
  "tokens": ["识别", "意图", "匹配", "路由", "执行", "汇总"],
  "stages": ["分类", "选择路线", "调用模块", "生成结果"],
  "insights": ["适合展示多代理或工作流编排。", "可把每个阶段连接到真实案例。"],
  "controls": ["阈值", "路线权重"]
}`;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
