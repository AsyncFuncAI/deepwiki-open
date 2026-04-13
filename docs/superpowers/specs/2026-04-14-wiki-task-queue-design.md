# Wiki 后台任务队列系统设计

## 背景

用户需求：生成 Wiki 页面时，不阻塞页面交互；页面关闭后任务继续运行；左上角悬浮框显示任务进度；支持多任务排队；支持暂停和恢复；关闭浏览器后任务不中断；再次打开页面能恢复进度。

## 技术栈

- 后端：Python FastAPI + SQLite
- 前端：Next.js 15 + React
- 存储：SQLite（任务状态）+ 文件系统（Wiki 内容）

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (Next.js)                       │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ TaskQueuePanel    │  │ [owner]/[repo]/  │                 │
│  │ (悬浮框)          │  │ page.tsx          │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                     │                            │
│           └──────────┬──────────┘                            │
│                      │ 轮询 /api/tasks                         │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ /api/tasks   │  │ TaskWorker   │  │ simple_chat  │       │
│  │ (REST API)   │──│ (后台线程)    │──│ (AI 生成)    │       │
│  └──────────────┘  └──────┬───────┘  └──────────────┘       │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │   SQLite (任务状态)     │
               └────────────────────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │ ~/.adalflow/wikicache/  │
               │   tasks/{task_id}/      │
               │   - status.json         │
               │   - wiki_structure.json │
               │   - pages/              │
               └────────────────────────┘
```

## 数据模型

### SQLite 表结构

```sql
-- 任务主表
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,           -- UUID
    status TEXT DEFAULT 'queued',  -- queued | running | paused | completed | failed | cancelled

    -- 仓库信息
    owner TEXT,
    repo TEXT,
    repo_type TEXT,                -- github | gitlab | bitbucket | local
    repo_url TEXT,
    token TEXT,
    local_path TEXT,

    -- 生成参数
    language TEXT DEFAULT 'en',
    is_comprehensive INTEGER DEFAULT 1,
    provider TEXT,
    model TEXT,
    excluded_dirs TEXT,
    excluded_files TEXT,
    included_dirs TEXT,
    included_files TEXT,

    -- 时间戳
    created_at INTEGER,            -- 毫秒时间戳
    started_at INTEGER,
    completed_at INTEGER,

    -- 进度
    current_step TEXT,             -- fetching | structure | generating | saving | done
    total_pages INTEGER DEFAULT 0,
    completed_pages INTEGER DEFAULT 0,
    current_page_title TEXT,

    -- 错误处理
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- 元数据
    worker_id TEXT                 -- 当前处理这个任务的 worker ID
);

-- 任务页面状态表
CREATE TABLE task_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,
    page_id TEXT,
    title TEXT,
    status TEXT,                   -- pending | generating | completed | failed
    created_at INTEGER,
    completed_at INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created ON tasks(created_at);
```

### 文件系统结构

```
~/.adalflow/wikicache/tasks/
└── {task_id}/
    ├── status.json           -- 完整任务状态快照（用于断点续传）
    ├── wiki_structure.json   -- Wiki 结构定义
    ├── repo_info.json        -- 仓库信息
    └── pages/
        ├── {page_id}.json    -- 各页面内容
        └── ...
```

## API 设计

### REST API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tasks` | GET | 列出所有任务 |
| `/api/tasks` | POST | 提交新任务 |
| `/api/tasks/{task_id}` | GET | 获取任务详情 |
| `/api/tasks/{task_id}` | DELETE | 取消/删除任务 |
| `/api/tasks/{task_id}/pause` | POST | 暂停任务 |
| `/api/tasks/{task_id}/resume` | POST | 恢复任务 |
| `/api/tasks/{task_id}/progress` | GET | 获取任务进度（轻量端点） |

### 请求/响应示例

**POST /api/tasks** (提交新任务)
```json
{
  "owner": "owner",
  "repo": "my-repo",
  "repo_type": "github",
  "repo_url": "https://github.com/owner/my-repo",
  "token": null,
  "language": "zh",
  "is_comprehensive": true,
  "provider": "google",
  "model": "gemini-2.0-flash",
  "excluded_dirs": "node_modules,dist",
  "excluded_files": null,
  "included_dirs": null,
  "included_files": null
}
```

**响应**:
```json
{
  "id": "uuid-string",
  "status": "queued",
  "created_at": 1704067200000
}
```

**GET /api/tasks/{task_id}** (获取任务详情)
```json
{
  "id": "uuid-string",
  "status": "running",
  "owner": "owner",
  "repo": "my-repo",
  "repo_type": "github",
  "language": "zh",
  "current_step": "generating",
  "total_pages": 6,
  "completed_pages": 3,
  "current_page_title": "API Reference",
  "progress": 50,
  "created_at": 1704067200000,
  "started_at": 1704067205000,
  "completed_at": null,
  "error_message": null
}
```

## 前端组件

### TaskQueuePanel 悬浮框

**位置和外观**：
- 左下角固定定位
- 可最小化为小图标
- 可完全关闭，关闭后有新任务时自动弹出
- 毛玻璃效果，圆角设计

**任务卡片**：
```
┌─────────────────────────────────────────────────┐
│ 🔄 MyProject Wiki                    [−] [×]   │
│    github / owner / my-project                 │
│    [████████████░░░░░░░] 67% · 第 4/6 页       │
│    生成中：API Reference                        │
└─────────────────────────────────────────────────┘
```

**状态图标**：
- 🔄（旋转动画）= running
- ⏸ = paused
- ⏳ = queued
- ✅ = completed
- ❌ = failed

### TaskQueueContext

```typescript
interface TaskInfo {
  id: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  owner: string;
  repo: string;
  repoType: string;
  language: string;
  currentStep: string;
  totalPages: number;
  completedPages: number;
  currentPageTitle: string;
  progress: number;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  errorMessage: string | null;
}

interface TaskQueueContextValue {
  tasks: TaskInfo[];
  submitTask: (taskData: TaskSubmission) => Promise<string>;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}
```

## 后端 Worker

### TaskWorker 工作流程

```
1. 启动时初始化
   ├── 连接 SQLite
   ├── 恢复未完成的任务（status = running 或 paused）
   └── 启动主循环

2. 主循环（每 5 秒检查一次）
   ├── 检查是否有 paused 的任务 → 恢复执行
   ├── 检查是否有 queued 的任务 → 按创建时间取最早的一个
   └── 锁定任务，开始处理

3. 任务处理流程
   ├── 更新状态为 running
   ├── 读取/创建任务目录
   ├── 阶段1：获取仓库结构（fetchRepositoryStructure）
   ├── 阶段2：确定 Wiki 结构（determineWikiStructure）
   ├── 阶段3：逐页生成内容
   │   ├── 页面完成 → 写入 pages/{page_id}.json
   │   ├── 更新 SQLite 进度
   │   └── 检查是否需要暂停
   ├── 阶段4：保存完整缓存
   └── 更新状态为 completed

4. 暂停处理
   ├── 收到暂停信号（数据库标记）
   ├── 保存当前进度到 status.json
   ├── 更新状态为 paused
   └── 释放锁，允许其他任务
```

### 断点续传机制

**暂停时保存的内容** (status.json):
```json
{
  "task_id": "uuid",
  "current_page_index": 4,
  "current_page_title": "API Reference",
  "generated_pages": ["page-1", "page-2", "page-3", "page-4"],
  "last_checkpoint": "2024-01-15T10:30:00Z"
}
```

**恢复时**：
1. 读取 `status.json` 中的 `generated_pages`
2. 跳过已完成的页面
3. 从 `current_page_index + 1` 继续生成

### 并发控制

- 一个 Worker 线程，一次只处理一个任务
- 通过 `worker_id` 字段实现锁机制
- 超过 30 秒没有更新，锁自动释放（防止崩溃导致死锁）

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `api/task_queue.py` | 新建 | 任务队列核心模块（SQLite 操作） |
| `api/task_worker.py` | 新建 | 后台 Worker 线程 |
| `api/api.py` | 修改 | 添加任务队列 API 端点 |
| `api/main.py` | 修改 | 启动时初始化 Worker |
| `src/contexts/TaskQueueContext.tsx` | 新建 | 前端任务状态管理 |
| `src/components/TaskQueuePanel.tsx` | 新建 | 悬浮框组件 |
| `src/app/layout.tsx` | 修改 | 添加 TaskQueueProvider |
| `src/app/page.tsx` | 修改 | 改为提交任务模式 |
| `src/app/[owner]/[repo]/page.tsx` | 修改 | 监听任务进度 |
| `src/app/api/tasks/route.ts` | 新建 | 前端 API 代理 |
| `src/app/api/tasks/[task_id]/route.ts` | 新建 | 前端 API 代理 |

## 验证方式

1. 启动后端：`python -m api.main`
2. 启动前端：`npm run dev`
3. 在首页输入仓库信息，点击生成 → 立即跳转到 Wiki 页面
4. 关闭浏览器标签页 → 任务继续在后台运行
5. 再次打开页面 → 看到之前的进度
6. 提交多个任务 → 确认按顺序排队
7. 最小化悬浮框 → 确认悬浮图标显示
8. 关闭悬浮框 → 确认不再弹出（有新任务时才弹出）
9. 点击暂停 → 任务暂停，进度保存
10. 刷新页面后点击恢复 → 任务从暂停位置继续