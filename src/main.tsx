import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Gauge,
  GripVertical,
  Info,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings2,
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
  updatedAt: string;
  tokens: string[];
  stages: string[];
  timeline: string[];
  insights: string[];
  keywords: string[];
  controls: string[];
  prerequisiteIds?: string[];
};

type Chapter = {
  id: string;
  title: string;
  conceptIds: string[];
};

type Course = {
  id: string;
  title: string;
  summary: string;
  chapters: Chapter[];
};

const concepts: Record<string, Concept> = {
  "token-stream": {
    id: "token-stream",
    courseId: "app-dev",
    title: "Token 逐步输出",
    summary: "观察模型如何把上下文压缩成下一步概率分布，并一次追加一个 token。",
    difficulty: "入门",
    updatedAt: "2026-05-05",
    tokens: ["大", "语", "言", "模", "型", "会", "逐", "个", "预", "测", "下", "一", "个", "token", "。"],
    stages: ["上下文编码", "logits 计算", "采样策略", "追加 token", "刷新上下文"],
    timeline: ["读取上下文", "计算概率", "选择 token", "写入输出", "继续下一步"],
    insights: ["每一步都只确定一个新 token。", "温度和 top-p 改变候选分布形状。", "长输出是多次局部选择累积的结果。"],
    keywords: ["自回归解码", "概率分布", "采样策略", "逐步生成"],
    controls: ["速度", "温度", "top-p"]
  },
  "context-window": {
    id: "context-window",
    courseId: "app-dev",
    title: "上下文窗口",
    summary: "展示 prompt、历史对话和检索片段如何占用上下文预算。",
    difficulty: "入门",
    updatedAt: "2026-05-05",
    tokens: ["系统", "指令", "用户", "问题", "历史", "消息", "检索", "片段", "回答"],
    stages: ["输入拼接", "token 计数", "截断策略", "位置编码", "响应生成"],
    timeline: ["收集消息", "统计 token", "保留关键段", "压缩历史", "生成回答"],
    insights: ["上下文窗口是有限预算。", "越靠后的信息通常更容易影响回答。", "压缩和摘要能换取更多有效空间。"],
    keywords: ["上下文预算", "截断策略", "历史摘要", "位置编码"],
    controls: ["预算", "保留策略", "摘要开关"],
    prerequisiteIds: ["token-stream"]
  },
  "rag-retrieval": {
    id: "rag-retrieval",
    courseId: "app-dev",
    title: "RAG 检索",
    summary: "把问题转成向量，召回相关片段，再把证据注入模型输入。",
    difficulty: "进阶",
    updatedAt: "2026-05-05",
    tokens: ["问题", "向量化", "相似度", "召回", "重排", "拼接", "生成"],
    stages: ["query embedding", "向量检索", "重排序", "上下文注入", "带证据回答"],
    timeline: ["理解问题", "向量召回", "片段重排", "拼接证据", "输出答案"],
    insights: ["RAG 的质量取决于切分、召回和重排。", "检索结果需要和用户问题共同进入上下文。", "引用链可以提升可审计性。"],
    keywords: ["Embedding", "向量库", "重排序", "引用链"],
    controls: ["top-k", "重排", "引用显示"],
    prerequisiteIds: ["context-window", "token-stream"]
  },
  "tool-calling": {
    id: "tool-calling",
    courseId: "app-dev",
    title: "工具调用",
    summary: "观察模型如何决定调用工具、传入参数，并把结果合并回回答。",
    difficulty: "深入",
    updatedAt: "2026-05-05",
    tokens: ["计划", "选择", "工具", "生成", "参数", "执行", "读取", "结果", "回答"],
    stages: ["意图识别", "工具选择", "参数生成", "外部执行", "结果归纳"],
    timeline: ["识别意图", "选择工具", "生成参数", "执行调用", "整合结果"],
    insights: ["工具调用把语言模型和外部系统连接起来。", "参数结构需要严格校验。", "工具结果应回到模型上下文再综合。"],
    keywords: ["函数调用", "参数校验", "工具结果", "代理流程"],
    controls: ["工具白名单", "参数校验", "重试"],
    prerequisiteIds: ["token-stream", "context-window"]
  },
  "attention-flow": {
    id: "attention-flow",
    courseId: "tuning-deploy",
    title: "注意力流",
    summary: "把一个 token 对历史片段的关注权重可视化，帮助解释引用和指代关系。",
    difficulty: "进阶",
    updatedAt: "2026-05-05",
    tokens: ["它", "会", "把", "相关", "上下文", "聚焦", "到", "当前", "位置"],
    stages: ["Q/K/V 投影", "相似度打分", "mask 约束", "softmax 权重", "加权汇聚"],
    timeline: ["生成查询", "匹配键值", "应用 mask", "归一权重", "汇聚信息"],
    insights: ["注意力不是完整解释，但能显示信息路由线索。", "不同层和头会捕获不同类型关系。", "因果 mask 阻止模型查看未来 token。"],
    keywords: ["QKV", "因果 mask", "权重热力图", "信息路由"],
    controls: ["层", "头", "权重阈值"]
  },
  "lora-adapter": {
    id: "lora-adapter",
    courseId: "tuning-deploy",
    title: "LoRA 适配器",
    summary: "展示低秩矩阵如何以较少参数改变模型行为，适合讲解轻量微调。",
    difficulty: "进阶",
    updatedAt: "2026-05-05",
    tokens: ["冻", "结", "基", "座", "训", "练", "低", "秩", "适", "配", "器"],
    stages: ["冻结基座", "插入低秩矩阵", "训练增量参数", "合并或挂载", "部署推理"],
    timeline: ["准备数据", "冻结参数", "训练适配器", "评估效果", "上线版本"],
    insights: ["LoRA 只训练少量增量参数。", "适配器可按任务切换。", "部署时要关注显存、合并策略和版本管理。"],
    keywords: ["低秩分解", "参数高效微调", "适配器", "模型部署"],
    controls: ["rank", "alpha", "dropout"],
    prerequisiteIds: ["attention-flow"]
  }
};

const defaultCourses: Course[] = [
  {
    id: "app-dev",
    title: "大模型应用开发",
    summary: "面向应用构建、检索增强、工具调用和交互体验的核心概念。",
    chapters: [
      {
        id: "generation-basics",
        title: "基础生成机制",
        conceptIds: ["token-stream"]
      },
      {
        id: "context-and-retrieval",
        title: "上下文与检索增强",
        conceptIds: ["context-window", "rag-retrieval"]
      },
      {
        id: "agents-and-tools",
        title: "工具与代理流程",
        conceptIds: ["tool-calling"]
      }
    ]
  },
  {
    id: "tuning-deploy",
    title: "大模型调优与部署",
    summary: "面向模型理解、微调、压缩、推理服务和上线运维的核心概念。",
    chapters: [
      {
        id: "model-internals",
        title: "模型结构理解",
        conceptIds: ["attention-flow"]
      },
      {
        id: "efficient-tuning",
        title: "轻量微调方法",
        conceptIds: ["lora-adapter"]
      }
    ]
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
  const saved = localStorage.getItem("llm-chapter-order");
  if (!saved) return defaultCourses;

  try {
    const parsed = JSON.parse(saved) as Record<string, Record<string, string[]>>;
    return defaultCourses.map((course) => {
      const savedCourse = parsed[course.id] || {};
      return {
        ...course,
        chapters: course.chapters.map((chapter) => {
          const validIds = (savedCourse[chapter.id] || []).filter((id) => chapter.conceptIds.includes(id));
          const missingIds = chapter.conceptIds.filter((id) => !validIds.includes(id));
          return { ...chapter, conceptIds: [...validIds, ...missingIds] };
        })
      };
    });
  } catch {
    return defaultCourses;
  }
}

const countCourseConcepts = (course: Course) => course.chapters.reduce((total, chapter) => total + chapter.conceptIds.length, 0);

const firstConceptId = defaultCourses[0].chapters[0].conceptIds[0];

function App() {
  const [courses, setCourses] = useState<Course[]>(loadCourseOrder);
  const [expandedCourseIds, setExpandedCourseIds] = useState<string[]>(defaultCourses.map((course) => course.id));
  const [expandedChapterIds, setExpandedChapterIds] = useState<string[]>(
    defaultCourses.flatMap((course) => course.chapters.map((chapter) => chapter.id))
  );
  const [selectedId, setSelectedId] = useState(firstConceptId);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detailVisible, setDetailVisible] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState("");

  const selected = concepts[selectedId] || concepts[firstConceptId];
  const selectedCourse = courses.find((course) => course.id === selected.courseId) || courses[0];
  const selectedChapter =
    selectedCourse.chapters.find((chapter) => chapter.conceptIds.includes(selected.id)) || selectedCourse.chapters[0];
  const prerequisiteIds = selected.prerequisiteIds || [];

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return courses;
    return courses
      .map((course) => ({
        ...course,
        chapters: course.chapters
          .map((chapter) => ({
            ...chapter,
            conceptIds: chapter.conceptIds.filter((id) => {
              const concept = concepts[id];
              return `${course.title} ${chapter.title} ${concept.title} ${concept.summary}`.toLowerCase().includes(normalizedQuery);
            })
          }))
          .filter((chapter) => chapter.conceptIds.length > 0)
      }))
      .filter((course) => course.chapters.length > 0);
  }, [courses, query]);

  useEffect(() => {
    const payload = courses.reduce<Record<string, Record<string, string[]>>>((acc, course) => {
      acc[course.id] = course.chapters.reduce<Record<string, string[]>>((chapterAcc, chapter) => {
        chapterAcc[chapter.id] = chapter.conceptIds;
        return chapterAcc;
      }, {});
      return acc;
    }, {});
    localStorage.setItem("llm-chapter-order", JSON.stringify(payload));
  }, [courses]);

  useEffect(() => {
    setCursor(0);
    setIsPlaying(false);
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

  const toggleChapter = (chapterId: string) => {
    setExpandedChapterIds((current) =>
      current.includes(chapterId) ? current.filter((id) => id !== chapterId) : [...current, chapterId]
    );
  };

  const moveConcept = (courseId: string, chapterId: string, targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setCourses((currentCourses) =>
      currentCourses.map((course) => {
        if (course.id !== courseId) return course;

        return {
          ...course,
          chapters: course.chapters.map((chapter) => {
            if (chapter.id !== chapterId || !chapter.conceptIds.includes(draggedId)) return chapter;

            const nextIds = chapter.conceptIds.filter((id) => id !== draggedId);
            const targetIndex = nextIds.indexOf(targetId);
            nextIds.splice(targetIndex, 0, draggedId);
            return { ...chapter, conceptIds: nextIds };
          })
        };
      })
    );
  };

  const resetPlayback = () => {
    setCursor(0);
    setIsPlaying(false);
  };

  const goToStep = (index: number) => {
    setCursor(index);
    setIsPlaying(false);
  };

  const stepBackward = () => {
    setCursor((current) => (current - 1 + selected.timeline.length) % selected.timeline.length);
    setIsPlaying(false);
  };

  const stepForward = () => {
    setCursor((current) => (current + 1) % selected.timeline.length);
    setIsPlaying(false);
  };

  return (
    <main className={`app-shell ${detailVisible ? "detail-open" : "detail-closed"}`}>
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
                  <small>{countCourseConcepts(course)}</small>
                </button>

                {isExpanded && (
                  <div className="chapter-list">
                    {course.chapters.map((chapter) => {
                      const isChapterExpanded = expandedChapterIds.includes(chapter.id) || query.trim().length > 0;
                      return (
                        <section className="chapter-group" key={chapter.id}>
                          <button className="chapter-toggle" onClick={() => toggleChapter(chapter.id)}>
                            {isChapterExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            <span>{chapter.title}</span>
                            <small>{chapter.conceptIds.length}</small>
                          </button>

                          {isChapterExpanded && (
                            <div className="concept-list">
                              {chapter.conceptIds.map((conceptId) => {
                                const concept = concepts[conceptId];
                                const Icon = iconByConcept[concept.id] || Sparkles;
                                return (
                                  <button
                                    className={`concept-link ${concept.id === selected.id ? "active" : ""}`}
                                    data-concept-id={concept.id}
                                    draggable
                                    key={concept.id}
                                    onClick={() => setSelectedId(concept.id)}
                                    onDragStart={() => setDraggedId(concept.id)}
                                    onDragEnd={() => setDraggedId(null)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={() => moveConcept(course.id, chapter.id, concept.id)}
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
            <p>
              {selectedChapter.title} · {selected.summary}
            </p>
            <div className="knowledge-links" aria-label="知识点关系">
              {prerequisiteIds.length > 0 && (
                <div className="prerequisite-row" aria-label="前置知识点">
                <span>前置知识点</span>
                {prerequisiteIds.map((id) => (
                  <button key={id} onClick={() => setSelectedId(id)}>
                    {concepts[id].title}
                  </button>
                ))}
              </div>
              )}
              <div className="post-menu">
                <button className="post-trigger">
                  后置知识点
                  <ChevronDown size={15} />
                </button>
                <div className="post-course-list">
                  {courses.map((course) => (
                    <div className="post-course-item" key={course.id}>
                      <span>{course.title}</span>
                      <ChevronRight size={14} />
                      <div className="post-chapter-list">
                        {course.chapters.map((chapter) => (
                          <div className="post-chapter-item" key={chapter.id}>
                            <span>{chapter.title}</span>
                            <ChevronRight size={14} />
                            <div className="post-concept-list">
                              {chapter.conceptIds
                                .filter((conceptId) => conceptId !== selected.id)
                                .map((conceptId) => (
                                  <button key={conceptId} onClick={() => setSelectedId(conceptId)}>
                                    {concepts[conceptId].title}
                                  </button>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="primary-button" onClick={() => setIsPlaying(true)}>
              <Play size={17} />
              播放演示
            </button>
            <button className="ghost-button" onClick={() => setDetailVisible((visible) => !visible)}>
              <Settings2 size={17} />
              {detailVisible ? "隐藏详情" : "设置"}
            </button>
          </div>
        </header>

        <div className="concept-grid">
          <section className="demo-panel" aria-label={`${selected.title} 演示`}>
            <div className="panel-head">
              <div>
                <span className="caption">当前概念</span>
                <h2>{selected.title}</h2>
              </div>
              <span className={isPlaying ? "status running" : "status"}>{isPlaying ? "播放中" : "待播放"}</span>
            </div>

            <div className="token-stream">
              {selected.tokens.map((token, index) => (
                <span key={`${token}-${index}`} className={index <= cursor ? "token visible" : "token"}>
                  {token}
                </span>
              ))}
              {isPlaying && <span className="caret" />}
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

        <section className="timeline-panel" aria-label={`${selected.title} 时间线`}>
          <div className="panel-head">
            <div>
              <span className="caption">生成时间线</span>
              <h2>老师点击播放后逐步推进</h2>
            </div>
          </div>
          <div className="timeline-track">
            {selected.timeline.map((item, index) => {
              const isDone = index < cursor % selected.timeline.length;
              const isCurrent = index === cursor % selected.timeline.length;
              return (
                <button
                  className={`timeline-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}
                  key={item}
                  onClick={() => goToStep(index)}
                >
                  <span>{index + 1}</span>
                  <strong>{item}</strong>
                </button>
              );
            })}
          </div>
        </section>
      </section>

      {detailVisible && <aside className="inspector" aria-label="场景详情">
        <section className="scene-detail">
          <span className="caption">场景详情</span>
          <h2>{selected.title}</h2>
          <dl>
            <div>
              <dt>名称</dt>
              <dd>{selected.title}</dd>
            </div>
            <div>
              <dt>所属课程</dt>
              <dd>{selectedCourse.title}</dd>
            </div>
            <div>
              <dt>所属章节</dt>
              <dd>{selectedChapter.title}</dd>
            </div>
            <div>
              <dt>难度</dt>
              <dd>
                <span className="difficulty compact">{selected.difficulty}</span>
              </dd>
            </div>
            <div>
              <dt>描述</dt>
              <dd>{selected.summary}</dd>
            </div>
            <div>
              <dt>关键概念</dt>
              <dd className="keyword-list">
                {selected.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{selected.updatedAt}</dd>
            </div>
          </dl>
        </section>

        <section className="playback-card">
          <h3>播放控制</h3>
          <div className="playback-actions">
            <button onClick={stepBackward}>
              <ChevronLeft size={16} />
              上一步
            </button>
            <button onClick={stepForward}>
              <ChevronRight size={16} />
              下一步
            </button>
            <button onClick={() => setIsPlaying(false)}>
              <Pause size={16} />
              暂停
            </button>
            <button onClick={resetPlayback}>
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </section>

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

        <section className="hint-box">
          <Info size={17} />
          <p>进入概念页面后默认停止。老师点击播放后，token、流程和时间线会同步推进。</p>
        </section>
      </aside>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
