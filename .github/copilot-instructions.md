<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
<!-- 项目类型：MediaWiki MCP服务器，语言：Node.js/TypeScript，框架：@modelcontextprotocol/sdk -->

- [x] Scaffold the Project
<!--
已完成：
- 创建了package.json配置文件
- 创建了tsconfig.json TypeScript配置
- 创建了主要的MCP服务器文件src/index.ts
- 创建了README.md文档
- 安装了所需依赖包
-->

- [x] Customize the Project
<!--
已完成定制化开发：
- 实现了MediaWiki Parse API集成
- 创建了三个主要工具：parse_page, search_pages, get_page_info
- 支持获取文本内容、图片引用、外部链接、分类和章节信息
- 包含完善的错误处理和输入验证
- 支持自定义MediaWiki API端点
-->

- [x] Install Required Extensions
<!-- 无需安装额外扩展 -->

- [x] Compile the Project
<!--
验证所有前续步骤已完成。
安装所需依赖包完成。
运行诊断并解决问题完成。
检查项目文件夹中的相关说明完成。
-->

- [ ] Create and Run Task
<!--
Verify that all previous steps have been completed.
Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.
Skip this step otherwise.
 -->

- [ ] Launch the Project
<!--
Verify that all previous steps have been completed.
Prompt user for debug mode, launch only if confirmed.
 -->

- [ ] Ensure Documentation is Complete
<!--
Verify that all previous steps have been completed.
Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.
Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.
 -->
