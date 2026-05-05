import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = dirname(fileURLToPath(import.meta.url));
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "content.db"));

const seedCourses = [
  {
    id: "app-dev",
    title: "大模型应用开发",
    summary: "面向应用构建、检索增强、工具调用和交互体验的核心概念。",
    chapters: [
      { id: "generation-basics", title: "基础生成机制", conceptIds: ["token-stream"] },
      { id: "context-and-retrieval", title: "上下文与检索增强", conceptIds: ["context-window", "rag-retrieval"] },
      { id: "agents-and-tools", title: "工具与代理流程", conceptIds: ["tool-calling"] },
      { id: "gradio-app-dev", title: "Gradio 应用开发", conceptIds: ["frontend-backend-basics"] }
    ]
  },
  {
    id: "tuning-deploy",
    title: "大模型调优与部署",
    summary: "面向模型理解、微调、压缩、推理服务和上线运维的核心概念。",
    chapters: [
      { id: "model-internals", title: "模型结构理解", conceptIds: ["attention-flow"] },
      { id: "efficient-tuning", title: "轻量微调方法", conceptIds: ["lora-adapter"] }
    ]
  }
];

const seedConcepts = [
  {
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
    controls: ["速度", "温度", "top-p"],
    prerequisiteIds: []
  },
  {
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
  {
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
  {
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
  {
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
    controls: ["层", "头", "权重阈值"],
    prerequisiteIds: []
  },
  {
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
  },
  {
    id: "frontend-backend-basics",
    courseId: "app-dev",
    title: "什么是前端和后端",
    summary: "用 Gradio 应用作为例子，区分浏览器界面、用户交互、Python 函数和服务端执行逻辑。",
    difficulty: "入门",
    updatedAt: "2026-05-05",
    tokens: ["浏览器", "点击", "请求", "后端", "函数", "处理", "返回", "结果"],
    stages: ["前端界面", "事件触发", "请求后端", "执行业务逻辑", "返回结果"],
    timeline: ["用户操作界面", "组件收集输入", "发送请求", "Python 函数处理", "界面展示输出"],
    insights: [
      "前端负责让用户看见和操作界面。",
      "后端负责执行模型、工具、文件读写等真正的计算逻辑。",
      "Gradio 把前后端连接封装起来，但讲解时仍然可以拆开理解。"
    ],
    keywords: ["前端", "后端", "请求响应", "Gradio"],
    controls: ["输入组件", "事件绑定", "函数输出"],
    prerequisiteIds: []
  }
];

db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );
  CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    tokens TEXT NOT NULL,
    stages TEXT NOT NULL,
    timeline TEXT NOT NULL,
    insights TEXT NOT NULL,
    keywords TEXT NOT NULL,
    controls TEXT NOT NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );
  CREATE TABLE IF NOT EXISTS chapter_concepts (
    chapter_id TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY(chapter_id, concept_id),
    FOREIGN KEY(chapter_id) REFERENCES chapters(id),
    FOREIGN KEY(concept_id) REFERENCES concepts(id)
  );
  CREATE TABLE IF NOT EXISTS concept_relations (
    from_concept_id TEXT NOT NULL,
    to_concept_id TEXT NOT NULL,
    relation_type TEXT NOT NULL CHECK(relation_type IN ('prerequisite', 'next')),
    PRIMARY KEY(from_concept_id, to_concept_id, relation_type),
    FOREIGN KEY(from_concept_id) REFERENCES concepts(id),
    FOREIGN KEY(to_concept_id) REFERENCES concepts(id)
  );
`);

const count = db.prepare("SELECT COUNT(*) AS total FROM courses").get().total;
if (count === 0) {
  const insertCourse = db.prepare("INSERT INTO courses VALUES (?, ?, ?, ?)");
  const insertChapter = db.prepare("INSERT INTO chapters VALUES (?, ?, ?, ?)");
  const insertConcept = db.prepare("INSERT INTO concepts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const insertChapterConcept = db.prepare("INSERT INTO chapter_concepts VALUES (?, ?, ?)");
  const insertRelation = db.prepare("INSERT INTO concept_relations VALUES (?, ?, ?)");

  db.exec("BEGIN");
  try {
    seedCourses.forEach((course, courseIndex) => {
      insertCourse.run(course.id, course.title, course.summary, courseIndex);
      course.chapters.forEach((chapter, chapterIndex) => {
        insertChapter.run(chapter.id, course.id, chapter.title, chapterIndex);
      });
    });

    seedConcepts.forEach((concept) => {
      insertConcept.run(
        concept.id,
        concept.courseId,
        concept.title,
        concept.summary,
        concept.difficulty,
        concept.updatedAt,
        JSON.stringify(concept.tokens),
        JSON.stringify(concept.stages),
        JSON.stringify(concept.timeline),
        JSON.stringify(concept.insights),
        JSON.stringify(concept.keywords),
        JSON.stringify(concept.controls)
      );
    });

    seedConcepts.forEach((concept) => {
      concept.prerequisiteIds.forEach((id) => insertRelation.run(concept.id, id, "prerequisite"));
    });

    seedCourses.forEach((course) => {
      course.chapters.forEach((chapter) => {
        chapter.conceptIds.forEach((conceptId, conceptIndex) => {
          insertChapterConcept.run(chapter.id, conceptId, conceptIndex);
        });
      });
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

db.prepare("DELETE FROM concept_relations WHERE relation_type = 'next'").run();

const gradioChapter = seedCourses
  .find((course) => course.id === "app-dev")
  ?.chapters.find((chapter) => chapter.id === "gradio-app-dev");
const frontendBackendConcept = seedConcepts.find((concept) => concept.id === "frontend-backend-basics");

if (gradioChapter && frontendBackendConcept) {
  db.prepare("INSERT OR IGNORE INTO chapters VALUES (?, ?, ?, ?)").run(
    gradioChapter.id,
    "app-dev",
    gradioChapter.title,
    3
  );
  db.prepare("INSERT OR IGNORE INTO concepts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    frontendBackendConcept.id,
    frontendBackendConcept.courseId,
    frontendBackendConcept.title,
    frontendBackendConcept.summary,
    frontendBackendConcept.difficulty,
    frontendBackendConcept.updatedAt,
    JSON.stringify(frontendBackendConcept.tokens),
    JSON.stringify(frontendBackendConcept.stages),
    JSON.stringify(frontendBackendConcept.timeline),
    JSON.stringify(frontendBackendConcept.insights),
    JSON.stringify(frontendBackendConcept.keywords),
    JSON.stringify(frontendBackendConcept.controls)
  );
  db.prepare("INSERT OR IGNORE INTO chapter_concepts VALUES (?, ?, ?)").run(
    gradioChapter.id,
    frontendBackendConcept.id,
    0
  );
}

function json(value) {
  return JSON.parse(value);
}

function getContent() {
  const courseRows = db.prepare("SELECT * FROM courses ORDER BY sort_order").all();
  const chapterRows = db.prepare("SELECT * FROM chapters ORDER BY sort_order").all();
  const chapterConceptRows = db.prepare("SELECT * FROM chapter_concepts ORDER BY sort_order").all();
  const conceptRows = db.prepare("SELECT * FROM concepts").all();
  const relationRows = db.prepare("SELECT * FROM concept_relations").all();

  const concepts = Object.fromEntries(
    conceptRows.map((row) => [
      row.id,
      {
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        summary: row.summary,
        difficulty: row.difficulty,
        updatedAt: row.updated_at,
        tokens: json(row.tokens),
        stages: json(row.stages),
        timeline: json(row.timeline),
        insights: json(row.insights),
        keywords: json(row.keywords),
        controls: json(row.controls),
        prerequisiteIds: relationRows
          .filter((relation) => relation.from_concept_id === row.id && relation.relation_type === "prerequisite")
          .map((relation) => relation.to_concept_id)
      }
    ])
  );

  const courses = courseRows.map((course) => ({
    id: course.id,
    title: course.title,
    summary: course.summary,
    chapters: chapterRows
      .filter((chapter) => chapter.course_id === course.id)
      .map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        conceptIds: chapterConceptRows
          .filter((link) => link.chapter_id === chapter.id)
          .map((link) => link.concept_id)
      }))
  }));

  return { courses, concepts };
}

const server = createServer((request, response) => {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/api/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.url === "/api/content") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(getContent()));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(4177, "127.0.0.1", () => {
  console.log("SQLite content API listening on http://127.0.0.1:4177");
});
