// index.ts (or index.js if not using TypeScript)
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import config from './config.js';
import logger from './utils/logger.js';

// Import tools (each should export an array of valid MCP tools)
import authTools from './auth/index.js';
import emailTools from './email/index.js';
import calendarTools from './calendar/index.js';
import folderTools from './folder/index.js';
import rulesTools from './rules/index.js';

// Combine all tools
const TOOLS = [
  ...authTools,
  ...emailTools,
  ...calendarTools,
  ...folderTools,
  ...rulesTools,
];

// Create MCP server
const server = new McpServer({
  name: config.server.name,
  version: config.server.version,
});

// Helper function to convert JSON Schema to Zod RawShape (not z.object)
function jsonSchemaToZodShape(jsonSchema) {
  if (!jsonSchema || !jsonSchema.properties) {
    return {};
  }
  
  const zodShape = {};
  for (const [key, value] of Object.entries(jsonSchema.properties)) {
    let zodType;
    
    // Handle array of types (e.g., ['string', 'array'])
    if (Array.isArray(value.type)) {
      // Create a union type for multi-type fields
      const types = value.type.map(t => {
        if (t === 'string') return z.string();
        if (t === 'number') return z.number();
        if (t === 'boolean') return z.boolean();
        if (t === 'array') return z.array(z.any());
        if (t === 'object') return z.object({});
        return z.any();
      });
      
      // Use z.union for multiple types
      if (types.length === 2) {
        zodType = z.union([types[0], types[1]]);
      } else if (types.length === 3) {
        zodType = z.union([types[0], types[1], types[2]]);
      } else {
        // Fallback to z.any() for edge cases
        zodType = z.any();
      }
    } else if (value.type === 'string') {
      // Handle enum values
      if (value.enum) {
        zodType = z.enum(value.enum);
      } else {
        zodType = z.string();
      }
    } else if (value.type === 'number') {
      zodType = z.number();
    } else if (value.type === 'boolean') {
      zodType = z.boolean();
    } else if (value.type === 'array') {
      zodType = z.array(z.any());
    } else if (value.type === 'object') {
      zodType = z.object({});
    } else {
      zodType = z.any();
    }
    
    // Apply optional unless field is required
    if (jsonSchema.required && jsonSchema.required.includes(key)) {
      zodShape[key] = zodType.describe(value.description || '');
    } else {
      zodShape[key] = zodType.optional().describe(value.description || '');
    }
  }
  
  return zodShape;
}

// Register all tools with the MCP server
for (const tool of TOOLS) {
  const zodShape = jsonSchemaToZodShape(tool.parameters);
  
  // Wrap the handler to transform the result
  const wrappedHandler = async (args) => {
    try {
      logger.info(`Tool ${tool.name} called with args:`, JSON.stringify(args));
      const result = await tool.handler(args || {});
      
      // Transform the result to MCP-expected format
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      logger.error(`Error in tool ${tool.name}:`, error);
      throw error;
    }
  };
  
  // Register the tool with description and Zod shape (not z.object)
  server.tool(tool.name, tool.description || '', zodShape, wrappedHandler);
}

// Note: McpServer handles errors internally. We'll incorporate rate limiting and error handling
// into the tool handlers themselves rather than using middleware.

// Start the server using Stdio transport
const transport = new StdioServerTransport();

server.connect(transport).then(() => {
  logger.info(`${config.server.name} v${config.server.version} connected via stdio`);

  if (config.testing.enabled) {
    logger.info('Server running in TEST MODE with mock data');
  }
}).catch(error => {
  logger.error('Failed to start MCP server via stdio:', error);
  process.exit(1);
});