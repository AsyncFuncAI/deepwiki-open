# 启动步骤

## 后端启动

1. 激活 conda 环境
   ```bash
   conda activate D:\my_code\python_code\deepwiki-open\conda_envs\deepwiki-open
   ```

2. 进入项目目录
   ```bash
   cd D:\my_code\python_code\deepwiki-open
   ```

3. 启动后端
   ```bash
   python -m api.main
   ```

后端地址：`http://localhost:8001`

---

## 前端启动

### 开发模式

```bash
npm run dev
```

前端地址：`http://localhost:3000`

### 生产模式（推荐长期使用）

```bash
npm run build && npm start
npm start
set PORT=3005&& npm start

```

> 注意：每次修改代码后需要重新 `npm run build`

---

## 启动顺序

先启动后端，等看到 `Uvicorn running` 后再启动前端。
