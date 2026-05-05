import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  DatabaseZap,
  Gauge,
  GripVertical,
  Layers3,
  Pause,
  Play,
  Search,
  Sparkles,
  Wrench
} from "lucide-react";
import "./styles.css";

type Difficulty = "入门" | "进阶" | "深入";

type Concept = {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  tokens: string[];
  stages: string[];
  insights: string[];
  controls: string[];
};

type Course = {
  id: string;
  title: string;
  summary: string;
  conceptIds: string[];
};

const concepts: Record<string, Concept> = {
  "token-stream": {
    id: "token-stream",
    courseId: "app-dev",
    title: "Token 逐步输出",
    summary: "观察模型如何把上下文压缩成下一步概率分布，并一次追加一个 token。",
    difficulty: "入门",
    tokens: ["大", "语", "言", "模", "型", "会", "逐", "个", "预", "测", "下", "一", "个", "token", "。"],
    stages: ["上下文编码", "logits 计算", "采样策略", "追加 token", "刷新上下文"],
    insights: ["每一步都只确定一个新 token。", "温度和 top-p 改变候选分布形状。", "长输出是多次局部选择累积的结果。"],
    controls: ["速度", "温度", "top-p"]
  },
  "context-window": {
    id: "context-window",
    courseId: "app-dev",
    title: "上下文窗口",
    summary: "展示 prompt、历史对话和检索片段如何占用上下文预算。",
    difficulty: "入门",
    tokens: ["系统", "指令", "用户", "问题", "历史", "消息", "检索", "片段", "回答"],
    stages: ["输入拼接", "token 计数", "截断策略", "位置编码", "响应生成"],
    insights: ["上下文窗口是有限预算。", "越靠后的信息通常更容易影响回答。", "压缩和摘要能换取更多有效空间。"],
    controls: ["预算", "保留策略", "摘要开关"]
  },
  "rag-retrieval": {
    id: "rag-retrieval",
    courseId: "app-dev",
    title: "RAG 检索",
    summary: "把问题转成向量，召回相关片段，再把证据注入模型输入。",
    difficulty: "进阶",
    tokens: ["问题", "向量化", "相似度", "召回", "重排", "拼接", "生成"],
    stages: ["query embedding", "向量检索", "重排序", "上下文注入", "带证据回答"],
    insights: ["RAG 的质量取决于切分、召回和重排。", "检索结果需要和用户问题共同进入上下文。", "引用链可以提升可审计性。"],
    controls: ["top-k", "重排", "引用显示"]
  },
  "tool-calling": {
    id: "tool-calling",
    courseId: "app-dev",
    title: "工具调用",
    summary: "观察模型如何决定调用工具、传入参数，并把结果合并回回答。",
    difficulty: "深入",
    tokens: ["计划", "选择", "工具", "生成", "参数", "执行", "读取", "结果", "回答"],
    stages: ["意图识别", "工具选择", "参数生成", "外部执行", "结果归纳"],
    insights: ["工具调用把语言模型和外部系统连接起来。", "参数结构需要严格校验。", "工具结果应回到模型上下文再综合。"],
    controls: ["工具白名单", "参数校验", "重试"]
  },
  "attention-flow": {
    id: "attention-flow",
    courseId: "tuning-deploy",
    title: "注意力流",
    summary: "把一个 token 对历史片段的关注权重可视化，帮助解释引用和指代关系。",
    difficulty: "进阶",
    tokens: ["它", "会", "把", "相关", "上下文", "聚焦", "到", "当前", "位置"],
    stages: ["Q/K/V 投影", "相似度打分", "mask 约束", "softmax 权重", "加权汇聚"],
    insights: ["注意力不是完整解释，但能显示信息路由线索。", "不同层和头会捕获不同类型关系。", "因果 mask 阻止模型查看未来 token。"],
    controls: ["层", "头", "权重阈值"]
  },
  "lora-adapter": {
    id: "lora-adapter",
    courseId: "tuning-deploy",
    title: "LoRA 适配器",
    summary: "展示低秩矩阵如何以较少参数改变模型行为，适合讲解轻量微调。",
    difficulty: "进阶",
    tokens: ["冻", "结", "基", "座", "训", "练", "低", "秩", "适", "配", "器"],
    stages: ["冻结基座", "插入低秩矩阵", "训练增量参数", "合并或挂载", "部署推理"],
    insights: ["LoRA 只训练少量增量参数。", "适配器可按任务切换。", "部署时要关注显存、合并策略和版本管理。"],
    controls: ["rank", "alpha", "dropout"]
  }
};

const defaultCourses: Course[] = [
  {
    id: "app-dev",
    title: "大模型应用开发",
    summary: "面向应用构建、检索增强、工具调用和交互体验的核心概念。",
    conceptIds: ["token-stream", "context-window", "rag-retrieval", "tool-calling"]
  },
  {
    id: "tuning-deploy",
    title: "大模型调优与部署",
    summary: "面向模型理解、微调、压缩、推理服务和上线运维的核心概念。",
    conceptIds: ["attention-flow", "lora-adapter"]
  }
];

const iconByConcept: Record<string, React.ElementType> = {
  "token-stream": Sparkles,
  "attention-flow": BrainCircuit,
  "context-window": Layers3,
  "rag-retrieval": DatabaseZap,
  "tool-calling": Wrench,
  "lora-adapter": Activity
};

function loadCourseOrder() {
  const saved = localStorage.getItem("llm-course-order");
  if (!saved) return defaultCourses;

  try {
    const parsed = JSON.parse(saved) as Record<string, string[]>;
    return defaultCourses.map((course) => {
      const validIds = (parsed[course.id] || []).filter((id) => course.conceptIds.includes(id));
      const missingIds = course.conceptIds.filter((id) => !validIds.includes(id));
      return { ...course, conceptIds: [...validIds, ...missingIds] };
    });
  } catch {
    return defaultCourses;
  }
}

function App() {
  const [courses, setCourses] = useState<Course[]>(loadCourseOrder);
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>(defaultCourses.map((course) => course.id));
  const [selectedId, setSelectedId] = useState(defaultCourses[0].conceptIds[0]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState("");

  const selected = concepts[selectedId] || concepts[defaultCourses[0].conceptIds[0]];
  const selectedCourse = courses.find((course) => course.id === selected.courseId) || courses[0];

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return courses;
    return courses
      .map((course) => ({
        ...course,
        conceptIds: course.conceptIds.filter((id) => {
          const concept = concepts[id];
          return `${course.title} ${concept.title} ${concept.summary}`.toLowerCase().includes(normalizedQuery);
        })
      }))
      .filter((course) => course.conceptIds.length > 0);
  }, [courses, query]);

  useEffect(() => {
    const payload = courses.reduce<Record<string, string[]>>((acc, course) => {
      acc[course.id] = course.conceptIds;
      return acc;
    }, {});
    localStorage.setItem("llm-course-order", JSON.stringify(payload));
  }, [courses]);

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

  const toggleCourse = (courseId: string) => {
    setExpandedCourseIds((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId]
    );
  };

  const moveConcept = (courseId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setCourses((currentCourses) =>
      currentCourses.map((course) => {
        if (course.id !== courseId || !course.conceptIds.includes(draggedId)) return course;

        const nextIds = course.conceptIds.filter((id) => id !== draggedId);
        const targetIndex = nextIds.indexOf(targetId);
        nextIds.splice(targetIndex, 0, draggedId);
        return { ...course, conceptIds: nextIds };
      })
    );
  };

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="课程导航">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={22} />
          </div>
          <div>
            <strong>LLM Mechanisms Visualized</strong>
            <span>课程化原理展示库</span>
          </div>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索课程或概念" />
        </label>

        <nav className="course-list">
          {filteredCourses.map((course) => {
            const isExpanded = expandedCourseIds.includes(course.id) || query.trim().length > 0;
            return (
              <section className="course-group" key={course.id}>
                <button className="course-toggle" onClick={() => toggleCourse(course.id)}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>{course.title}</span>
                  <small>{course.conceptIds.length}</small>
                </button>

                {isExpanded && (
                  <div className="concept-list">
                    {course.conceptIds.map((conceptId) => {
                      const concept = concepts[conceptId];
                      const Icon = iconByConcept[concept.id] || Sparkles;
                      return (
                        <button
                          className={`concept-link ${concept.id === selected.id ? "active" : ""}`}
                          draggable
                          key={concept.id}
                          onClick={() => setSelectedId(concept.id)}
                          onDragStart={() => setDraggedId(concept.id)}
                          onDragEnd={() => setDraggedId(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => moveConcept(course.id, concept.id)}
                        >
                          <GripVertical className="drag-handle" size={15} />
                          <Icon size={17} />
                          <span>{concept.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="caption">{selectedCourse.title}</span>
            <h1>{selected.title}</h1>
            <p>{selected.summary}</p>
          </div>
        </header>

        <div className="concept-grid">
          <section className="demo-panel" aria-label={`${selected.title} 演示`}>
            <div className="panel-head">
              <div>
                <span className="caption">当前概念</span>
                <h2>{selected.title}</h2>
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

          <section className="flow-panel" aria-label={`${selected.title} 流程`}>
            <div className="panel-head">
              <div>
                <span className="caption">概念流程</span>
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
        </div>
      </section>

      <aside className="inspector" aria-label="概念详情">
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
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
