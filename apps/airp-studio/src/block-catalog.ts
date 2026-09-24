/**
 * The 46 official block types, with the Chinese name, one-line description and
 * icon the palette shows. Names and grouping follow README.cn.md.
 *
 * This is presentation data only: which types *exist* comes from the schema
 * (`listBlockTypes`), and a guard test fails if the two ever drift apart.
 */

export interface BlockCatalogItem {
  /** One-line description shown under the name. */
  desc: string;
  /** Remix Icon class, e.g. `ri-text`. */
  icon: string;
  label: string;
  type: string;
}

export interface BlockCatalogCategory {
  category: string;
  id: string;
  items: BlockCatalogItem[];
}

/** Pinned to the top of the palette; always visible, never collapsible. */
export const FREQUENT_BLOCKS: BlockCatalogItem[] = [
  { type: "paragraph", label: "段落", desc: "写一段说明文字", icon: "ri-text" },
  { type: "heading", label: "标题", desc: "标出小节层级", icon: "ri-heading" },
  {
    type: "section",
    label: "章节",
    desc: "按主题分成可跳转的大段",
    icon: "ri-layout-row-line",
  },
  {
    type: "bulletList",
    label: "无序列表",
    desc: "并列列出若干要点",
    icon: "ri-list-unordered",
  },
  {
    type: "callout",
    label: "提示",
    desc: "标出注意、警告或结论",
    icon: "ri-lightbulb-line",
  },
  {
    type: "table",
    label: "表格",
    desc: "多行多列对齐对照",
    icon: "ri-table-2",
  },
];

export const BLOCK_CATALOG: BlockCatalogCategory[] = [
  {
    id: "layout",
    category: "版式与正文",
    items: [
      {
        type: "hero",
        label: "指标首屏",
        desc: "开篇放最关键的几项指标",
        icon: "ri-dashboard-horizontal-line",
      },
      {
        type: "lead",
        label: "导语",
        desc: "用一句话点明本节要讲什么",
        icon: "ri-article-line",
      },
      {
        type: "section",
        label: "章节",
        desc: "按主题分成可跳转的大段",
        icon: "ri-layout-row-line",
      },
      {
        type: "heading",
        label: "标题",
        desc: "标出小节层级",
        icon: "ri-heading",
      },
      {
        type: "paragraph",
        label: "段落",
        desc: "写一段说明文字",
        icon: "ri-text",
      },
      {
        type: "group",
        label: "分组",
        desc: "把相邻内容收成一组",
        icon: "ri-stack-line",
      },
      {
        type: "pullQuote",
        label: "醒目引文",
        desc: "把一句关键结论单独拎出来",
        icon: "ri-double-quotes-l",
      },
      {
        type: "blockquote",
        label: "引用",
        desc: "引用一段原文或他人说法",
        icon: "ri-chat-quote-line",
      },
      {
        type: "callout",
        label: "提示",
        desc: "标出注意、警告或结论",
        icon: "ri-lightbulb-line",
      },
      {
        type: "bulletList",
        label: "无序列表",
        desc: "并列列出若干要点",
        icon: "ri-list-unordered",
      },
      {
        type: "numberedList",
        label: "有序列表",
        desc: "按顺序写步骤或条目",
        icon: "ri-list-ordered",
      },
      {
        type: "divider",
        label: "分隔线",
        desc: "在上下内容之间划开",
        icon: "ri-separator",
      },
      {
        type: "spacer",
        label: "留白",
        desc: "在块与块之间留出空隙",
        icon: "ri-space",
      },
      {
        type: "image",
        label: "图片",
        desc: "插入一张图并配说明",
        icon: "ri-image-line",
      },
      {
        type: "embed",
        label: "外链嵌入",
        desc: "嵌一段外部页面或资源",
        icon: "ri-window-line",
      },
      {
        type: "appendix",
        label: "附录",
        desc: "把补充材料放到文末",
        icon: "ri-file-list-3-line",
      },
    ],
  },
  {
    id: "compare",
    category: "对照与清单",
    items: [
      {
        type: "table",
        label: "表格",
        desc: "多行多列对齐对照",
        icon: "ri-table-2",
      },
      {
        type: "comparison",
        label: "对比",
        desc: "左右两栏看改前改后",
        icon: "ri-flip-horizontal-line",
      },
      {
        type: "collection",
        label: "卡片集",
        desc: "用卡片铺开一组条目",
        icon: "ri-gallery-line",
      },
      {
        type: "keyValueList",
        label: "键值列表",
        desc: "成对列出名称和取值",
        icon: "ri-list-settings-line",
      },
      {
        type: "definitionList",
        label: "定义列表",
        desc: "术语和释义成对列出",
        icon: "ri-book-2-line",
      },
      {
        type: "glossary",
        label: "术语表",
        desc: "集中解释文中用词",
        icon: "ri-book-open-line",
      },
      {
        type: "statusBoard",
        label: "状态板",
        desc: "一眼看过、不过或部分通过",
        icon: "ri-kanban-view-2",
      },
      {
        type: "checklist",
        label: "检查清单",
        desc: "勾选事项是否完成",
        icon: "ri-checkbox-line",
      },
      {
        type: "timeline",
        label: "时间线",
        desc: "按时间排出发生过的事",
        icon: "ri-history-line",
      },
      {
        type: "roadmap",
        label: "路线图",
        desc: "按阶段排出目标和进度",
        icon: "ri-road-map-line",
      },
      {
        type: "flowSteps",
        label: "步骤流",
        desc: "把流程拆成先后步骤",
        icon: "ri-timeline-view",
      },
      {
        type: "linkList",
        label: "链接列表",
        desc: "列出相关链接",
        icon: "ri-link",
      },
      {
        type: "citation",
        label: "出处",
        desc: "标明引用的来源",
        icon: "ri-quote-text",
      },
      {
        type: "tabs",
        label: "分页签",
        desc: "同一处切换多种看法",
        icon: "ri-folder-open-line",
      },
      {
        type: "collapsible",
        label: "折叠",
        desc: "把次要的长内容收起来",
        icon: "ri-arrow-down-s-line",
      },
    ],
  },
  {
    id: "engineering",
    category: "工程与决策",
    items: [
      {
        type: "code",
        label: "代码",
        desc: "放一段短代码",
        icon: "ri-code-s-slash-line",
      },
      {
        type: "codeDiff",
        label: "代码差异",
        desc: "标出改了哪些行",
        icon: "ri-git-branch-line",
      },
      {
        type: "fileTree",
        label: "文件树",
        desc: "展示目录结构",
        icon: "ri-node-tree",
      },
      {
        type: "fileChangeList",
        label: "文件变更",
        desc: "列出新增、修改、删除的文件",
        icon: "ri-file-edit-line",
      },
      {
        type: "mermaid",
        label: "Mermaid",
        desc: "画流程、时序、状态等图",
        icon: "ri-flow-chart",
      },
      {
        type: "architectureOverview",
        label: "架构总览",
        desc: "总图加模块卡片看系统",
        icon: "ri-organization-chart",
      },
      {
        type: "apiInventory",
        label: "接口清单",
        desc: "列出接口及其用途",
        icon: "ri-plug-line",
      },
      {
        type: "testResult",
        label: "测试结果",
        desc: "汇总用例通过与失败数",
        icon: "ri-test-tube-line",
      },
      {
        type: "requirementTrace",
        label: "需求追溯",
        desc: "把需求对到状态和证据",
        icon: "ri-links-line",
      },
      {
        type: "decision",
        label: "决策",
        desc: "记下选了什么、为什么",
        icon: "ri-auction-line",
      },
      {
        type: "risk",
        label: "风险",
        desc: "写出风险和处理现状",
        icon: "ri-alarm-warning-line",
      },
      {
        type: "assumption",
        label: "假设",
        desc: "写明当前依赖的前提",
        icon: "ri-question-answer-line",
      },
      {
        type: "constraint",
        label: "约束",
        desc: "标出不能突破的限制",
        icon: "ri-lock-line",
      },
      {
        type: "openQuestion",
        label: "待决问题",
        desc: "记下还没定的问题",
        icon: "ri-question-line",
      },
      {
        type: "agentNote",
        label: "代理备注",
        desc: "留给模型看的备注，默认不展示给人",
        icon: "ri-sticky-note-line",
      },
    ],
  },
];

const LABELS = new Map<string, string>();
for (const item of [
  ...FREQUENT_BLOCKS,
  ...BLOCK_CATALOG.flatMap((category) => category.items),
]) {
  LABELS.set(item.type, item.label);
}

/** The Chinese name of a block type, falling back to the raw type. */
export function blockLabel(type: string): string {
  return LABELS.get(type) ?? type;
}

/** Every catalogued type, in palette order. */
export function cataloguedTypes(): string[] {
  return [
    ...FREQUENT_BLOCKS.map((item) => item.type),
    ...BLOCK_CATALOG.flatMap((category) =>
      category.items.map((item) => item.type)
    ),
  ];
}
