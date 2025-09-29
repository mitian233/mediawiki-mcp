# MediaWiki MCP Server

这是一个模型上下文协议（MCP）服务器，用于与 MediaWiki 的 Parse API 集成，为大语言模型提供 MediaWiki 网站内容的访问能力。

## 功能特性

- 🔍 **页面搜索** - 在 MediaWiki 网站中搜索页面
- 📄 **页面解析** - 获取页面完整内容，包括文本、图片引用和元数据
- ℹ️ **页面信息** - 获取页面基本信息、摘要和缩略图
- 🖼️ **图片引用** - 提取页面中使用的所有图片
- 🔗 **外部链接** - 获取页面中的外部链接
- 📂 **分类信息** - 显示页面所属的分类
- 📑 **章节结构** - 解析页面的章节层次结构

## 支持的 MediaWiki 站点

本服务器可以与任何启用了 API 的 MediaWiki 站点配合使用，包括但不限于：

- Wikipedia（中文、英文、其他语言版本）
- MediaWiki.org
- 各种企业和组织的 MediaWiki 实例

## 工具列表

### 1. `parse_page`

解析指定的 MediaWiki 页面并提取内容

**参数：**

- `apiUrl` (可选): MediaWiki API 端点 URL（默认为中文维基百科）
- `title`: 要解析的页面标题
- `section` (可选): 特定章节号

### 2. `search_pages`

在 MediaWiki 中搜索页面

**参数：**

- `apiUrl` (可选): MediaWiki API 端点 URL（默认为中文维基百科）
- `query`: 搜索查询
- `limit` (可选): 返回结果的最大数量（1-50，默认 10）

### 3. `get_page_info`

获取页面的基本信息

**参数：**

- `apiUrl` (可选): MediaWiki API 端点 URL（默认为中文维基百科）
- `title`: 页面标题

## 安装和使用

### 前提条件

- Node.js 18 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

### 运行服务器

#### STDIO Transport (默认)

```bash
npm start
# 或
node build/index.js
```

#### SSE Transport

```bash
node build/index.js --transport sse --port 3000
```

**命令行选项：**

- `--transport <type>`: 传输方式，可选 `stdio` (默认) 或 `sse`
- `--port <number>`: SSE 传输的端口号，默认 3000
- `--host <host>`: SSE 传输的主机地址，默认 localhost

### 开发模式

```bash
npm run dev
```

## 与 Claude Desktop 集成

要在 Claude Desktop 中使用此 MCP 服务器，请将以下配置添加到您的`claude_desktop_config.json`文件中：

#### STDIO Transport 配置：

```json
{
  "mcpServers": {
    "mediawiki": {
      "command": "node",
      "args": ["/path/to/mediawiki-mcp/build/index.js"]
    }
  }
}
```

#### SSE Transport 配置：

```json
{
  "mcpServers": {
    "mediawiki": {
      "command": "node",
      "args": [
        "/path/to/mediawiki-mcp/build/index.js",
        "--transport",
        "sse",
        "--port",
        "3000"
      ]
    }
  }
}
```

或者，如果您将项目安装为全局包：

```json
{
  "mcpServers": {
    "mediawiki": {
      "command": "npx",
      "args": ["mediawiki-mcp"]
    }
  }
}
```

## 使用示例

1. **搜索维基百科页面**：

   ```
   使用search_pages工具搜索"人工智能"相关的页面
   ```

2. **解析特定页面**：

   ```
   使用parse_page工具解析"机器学习"页面的内容
   ```

3. **获取页面摘要**：

   ```
   使用get_page_info工具获取"深度学习"页面的基本信息和摘要
   ```

4. **解析特定章节**：
   ```
   使用parse_page工具解析"神经网络"页面的第2章节
   ```

## API 说明

### MediaWiki Parse API

本服务器主要使用以下 MediaWiki API 端点：

- `action=parse` - 解析页面内容
- `action=query&list=search` - 搜索页面
- `action=query&prop=info|extracts|pageimages` - 获取页面信息

### 默认配置

- 默认 API 端点：`https://zh.wikipedia.org/w/api.php`（中文维基百科）
- User-Agent: `MediaWiki-MCP-Server/1.0`
- 默认搜索结果数量：10

## 开发

### 项目结构

```
mediawiki-mcp/
├── src/
│   └── index.ts          # 主服务器文件
├── build/                # 编译输出目录
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript配置
└── README.md            # 项目文档
```

### 可用脚本

- `npm run build` - 编译 TypeScript 代码
- `npm run start` - 运行编译后的服务器
- `npm run dev` - 开发模式（编译并运行）
- `npm run clean` - 清理构建目录

## 故障排除

### 常见问题

1. **连接超时**：检查网络连接和 MediaWiki 站点的可用性
2. **页面不存在**：确认页面标题的正确性（区分大小写）
3. **API 限制**：某些 MediaWiki 站点可能有 API 调用频率限制

### 错误处理

服务器包含完善的错误处理机制，会在发生错误时返回详细的错误信息，包括：

- HTTP 错误
- API 错误响应
- 网络连接问题
- 页面不存在等情况

## 许可证

MIT License

## 贡献

欢迎提交问题报告和功能请求！

## 更新日志

### v1.0.0

- 初始版本
- 支持页面解析、搜索和信息获取
- 集成图片引用和元数据提取
- 支持自定义 MediaWiki API 端点
