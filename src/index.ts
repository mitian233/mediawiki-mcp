#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { Command } from "commander";

// MediaWiki API 基础配置
const DEFAULT_MEDIAWIKI_API = "https://zh.wikipedia.org/w/api.php";
const USER_AGENT = "MediaWiki-MCP-Server/1.0";

// 创建 MCP 服务器实例
const server = new McpServer({
  name: "mediawiki-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// MediaWiki API 帮助函数
async function makeMediaWikiRequest(
  apiUrl: string,
  params: Record<string, string>
): Promise<any> {
  const url = new URL(apiUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };

  try {
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error making MediaWiki API request:", error);
    throw error;
  }
}

// 解析页面内容
async function parsePage(
  apiUrl: string,
  title: string,
  section?: string
): Promise<any> {
  const params: Record<string, string> = {
    action: "parse",
    page: title,
    format: "json",
    prop: "text|sections|images|externallinks|categories|displaytitle",
    disabletoc: "1",
  };

  if (section) {
    params.section = section;
  }

  return await makeMediaWikiRequest(apiUrl, params);
}

// 搜索页面
async function searchPages(
  apiUrl: string,
  query: string,
  limit: number = 10
): Promise<any> {
  const params = {
    action: "query",
    list: "search",
    srsearch: query,
    format: "json",
    srlimit: limit.toString(),
    srprop: "snippet|titlesnippet|size|timestamp",
  };

  return await makeMediaWikiRequest(apiUrl, params);
}

// 获取页面信息
async function getPageInfo(apiUrl: string, title: string): Promise<any> {
  const params = {
    action: "query",
    titles: title,
    format: "json",
    prop: "info|pageprops|extracts|pageimages",
    inprop:
      "url|talkid|watched|watchers|visitingwatchers|notificationtimestamp|subjectid|associatedpage|contentmodel",
    exintro: "1",
    explaintext: "1",
    piprop: "thumbnail|name",
    pithumbsize: "300",
  };

  return await makeMediaWikiRequest(apiUrl, params);
}

// 工具：解析页面内容
server.tool(
  "parse_page",
  "Parse a MediaWiki page and extract its content, images, and metadata",
  {
    apiUrl: z
      .string()
      .url()
      .default(DEFAULT_MEDIAWIKI_API)
      .describe("MediaWiki API endpoint URL"),
    title: z.string().describe("Page title to parse"),
    section: z
      .string()
      .optional()
      .describe("Specific section number to parse (optional)"),
  },
  async ({ apiUrl, title, section }) => {
    try {
      const result = await parsePage(apiUrl, title, section);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: `Error parsing page: ${
                result.error.info || result.error.code
              }`,
            },
          ],
        };
      }

      const parseData = result.parse;
      if (!parseData) {
        return {
          content: [
            {
              type: "text",
              text: "No parse data found for the specified page",
            },
          ],
        };
      }

      let responseText = `# ${parseData.displaytitle || parseData.title}\n\n`;

      // 添加页面内容
      if (parseData.text && parseData.text["*"]) {
        // 移除HTML标签，获取纯文本
        const htmlContent = parseData.text["*"];
        const textContent = htmlContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        responseText += `## 内容\n${textContent}\n\n`;
      }

      // 添加图片信息
      if (parseData.images && parseData.images.length > 0) {
        responseText += `## 图片引用\n`;
        parseData.images.forEach((image: string) => {
          responseText += `- ${image}\n`;
        });
        responseText += "\n";
      }

      // 添加外部链接
      if (parseData.externallinks && parseData.externallinks.length > 0) {
        responseText += `## 外部链接\n`;
        parseData.externallinks.forEach((link: string) => {
          responseText += `- ${link}\n`;
        });
        responseText += "\n";
      }

      // 添加分类
      if (parseData.categories && parseData.categories.length > 0) {
        responseText += `## 分类\n`;
        parseData.categories.forEach((category: any) => {
          responseText += `- ${category["*"]}\n`;
        });
        responseText += "\n";
      }

      // 添加章节信息
      if (parseData.sections && parseData.sections.length > 0) {
        responseText += `## 章节结构\n`;
        parseData.sections.forEach((sec: any) => {
          const indent = "  ".repeat(sec.level - 1);
          responseText += `${indent}- ${sec.line} (章节 ${sec.number})\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
          },
        ],
      };
    }
  }
);

// 工具：搜索页面
server.tool(
  "search_pages",
  "Search for pages in MediaWiki using the search API",
  {
    apiUrl: z
      .string()
      .url()
      .default(DEFAULT_MEDIAWIKI_API)
      .describe("MediaWiki API endpoint URL"),
    query: z.string().describe("Search query"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of results to return"),
  },
  async ({ apiUrl, query, limit }) => {
    try {
      const result = await searchPages(apiUrl, query, limit);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching pages: ${
                result.error.info || result.error.code
              }`,
            },
          ],
        };
      }

      const searchResults = result.query?.search;
      if (!searchResults || searchResults.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No search results found for query: "${query}"`,
            },
          ],
        };
      }

      let responseText = `# 搜索结果: "${query}"\n\n`;
      responseText += `找到 ${searchResults.length} 个结果:\n\n`;

      searchResults.forEach((result: any, index: number) => {
        responseText += `## ${index + 1}. ${result.title}\n`;
        if (result.snippet) {
          const cleanSnippet = result.snippet
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"');
          responseText += `${cleanSnippet}\n`;
        }
        responseText += `**大小**: ${result.size} 字节`;
        if (result.timestamp) {
          responseText += ` | **最后修改**: ${new Date(
            result.timestamp
          ).toLocaleString("zh-CN")}`;
        }
        responseText += "\n\n";
      });

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
          },
        ],
      };
    }
  }
);

// 工具：获取页面基本信息
server.tool(
  "get_page_info",
  "Get basic information about a MediaWiki page including summary and thumbnail",
  {
    apiUrl: z
      .string()
      .url()
      .default(DEFAULT_MEDIAWIKI_API)
      .describe("MediaWiki API endpoint URL"),
    title: z.string().describe("Page title to get information about"),
  },
  async ({ apiUrl, title }) => {
    try {
      const result = await getPageInfo(apiUrl, title);

      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting page info: ${
                result.error.info || result.error.code
              }`,
            },
          ],
        };
      }

      const pages = result.query?.pages;
      if (!pages) {
        return {
          content: [
            {
              type: "text",
              text: "No page information found",
            },
          ],
        };
      }

      const page = Object.values(pages)[0] as any;
      if (page.missing) {
        return {
          content: [
            {
              type: "text",
              text: `Page "${title}" does not exist`,
            },
          ],
        };
      }

      let responseText = `# ${page.title}\n\n`;

      // 页面摘要
      if (page.extract) {
        responseText += `## 摘要\n${page.extract}\n\n`;
      }

      // 页面信息
      responseText += `## 页面信息\n`;
      responseText += `- **页面ID**: ${page.pageid}\n`;
      responseText += `- **命名空间**: ${page.ns}\n`;
      if (page.contentmodel) {
        responseText += `- **内容模型**: ${page.contentmodel}\n`;
      }
      if (page.fullurl) {
        responseText += `- **完整URL**: ${page.fullurl}\n`;
      }
      if (page.editurl) {
        responseText += `- **编辑URL**: ${page.editurl}\n`;
      }

      // 缩略图信息
      if (page.thumbnail) {
        responseText += `\n## 缩略图\n`;
        responseText += `- **图片**: ${page.thumbnail.source}\n`;
        responseText += `- **尺寸**: ${page.thumbnail.width} x ${page.thumbnail.height}\n`;
      }

      // 页面属性
      if (page.pageprops && Object.keys(page.pageprops).length > 0) {
        responseText += `\n## 页面属性\n`;
        Object.entries(page.pageprops).forEach(([key, value]) => {
          responseText += `- **${key}**: ${value}\n`;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
          },
        ],
      };
    }
  }
);

// CLI 参数配置
const program = new Command();
program
  .name("mediawiki-mcp")
  .description(
    "MediaWiki MCP Server - Model Context Protocol server for MediaWiki Parse API integration"
  )
  .version("1.0.0")
  .option("-t, --transport <type>", "Transport type: stdio or sse", "stdio")
  .option(
    "-p, --port <number>",
    "Port for SSE transport (default: 3000)",
    "3000"
  )
  .option(
    "--host <host>",
    "Host for SSE transport (default: localhost)",
    "localhost"
  )
  .parse();

const options = program.opts();

// 启动服务器
async function main() {
  const transportType = options.transport.toLowerCase();

  if (transportType === "sse") {
    // SSE transport needs an HTTP server
    const express = await import("express");
    const http = await import("http");

    const app = express.default();
    app.use(express.default.json());

    // Store transports by session ID
    const transports: Record<string, SSEServerTransport> = {};

    // SSE endpoint for establishing the stream
    app.get("/sse", async (req: any, res: any) => {
      console.error("Establishing SSE connection...");

      // Create SSE transport with the correct parameters
      const transport = new SSEServerTransport("/messages", res);

      // Store the transport by session ID
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      // Set up onclose handler
      transport.onclose = () => {
        console.error(`SSE transport closed for session ${sessionId}`);
        delete transports[sessionId];
      };

      // Connect to server
      await server.connect(transport);
      console.error(`SSE session established: ${sessionId}`);
    });

    // Messages endpoint for POST requests
    app.post("/messages", async (req: any, res: any) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];

      if (!transport) {
        res.status(404).send("Session not found");
        return;
      }

      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        console.error("Error handling message:", error);
        if (!res.headersSent) {
          res.status(500).send("Internal server error");
        }
      }
    });

    const httpServer = http.createServer(app);
    const port = parseInt(options.port);

    httpServer.listen(port, () => {
      console.error(`MediaWiki MCP server running on http://localhost:${port}`);
      console.error(`SSE endpoint: http://localhost:${port}/sse`);
      console.error(`Messages endpoint: http://localhost:${port}/messages`);
    });
  } else if (transportType === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MediaWiki MCP Server running on stdio");
  } else {
    console.error(`Unsupported transport type: ${transportType}`);
    console.error("Supported types: stdio, sse");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
