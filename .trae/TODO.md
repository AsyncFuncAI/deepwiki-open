# TODO:

- [x] 1: 检查src/app/page.tsx中parseRepositoryInput函数，确保cnb.cool被正确识别为cnb类型 (priority: High)
- [x] 4: 修复src/app/page.tsx中handleGenerateWiki函数，确保URL参数中type使用解析出的type而不是selectedPlatform (priority: High)
- [x] 15: 移除src/app/[owner]/[repo]/page.tsx中所有错误的API调用逻辑（GitHub、GitLab、Bitbucket、CNB等平台API） (priority: High)
- [x] 16: 移除api/api.py中不必要的CNB API代理端点 (priority: High)
- [x] 18: 简化前端仓库信息获取逻辑，确保只传递仓库URL和token给后端 (priority: High)
- [x] 20: 移除src/app/page.tsx中CNB类型强制要求token的限制 (priority: High)
- [x] 21: 移除next.config.ts中CNB API代理配置 (priority: High)
- [x] 17: 移除api/requirements.txt中不必要的httpx依赖 (priority: Medium)
- [ ] 22: 检查后端代码中对DASHSCOPE_API_KEY的依赖位置 (**IN PROGRESS**) (priority: High)
- [ ] 23: 在后端添加API密钥缺失时的友好错误处理 (priority: High)
- [ ] 24: 修复前端XML解析错误处理，当后端返回错误信息时显示友好提示 (priority: High)
- [ ] 19: 测试修复后的项目功能，确保所有仓库类型都通过git clone正常工作 (priority: Medium)
