# LLM Mechanisms Visualized

一个用于展示大模型原理的可扩展页面原型。当前版本提供主题/场景导航、逐 token 输出动画、机制流程、右侧参数与解释面板，以及 JSON 内容上传入口。

## 本地运行

```bash
corepack pnpm install
corepack pnpm dev
```

## 上传内容格式

页面支持上传单个 JSON 对象或对象数组。字段如下：

```json
{
  "theme": "自定义上传",
  "title": "提示词路由",
  "summary": "展示系统如何根据用户意图选择不同处理路径。",
  "difficulty": "进阶",
  "tokens": ["识别", "意图", "匹配", "路由", "执行", "汇总"],
  "stages": ["分类", "选择路线", "调用模块", "生成结果"],
  "insights": ["适合展示多代理或工作流编排。", "可把每个阶段连接到真实案例。"],
  "controls": ["阈值", "路线权重"]
}
```

后续可以把 `src/main.tsx` 里的内置场景迁移到独立数据文件或后端 CMS，让主题和场景持续扩展。
