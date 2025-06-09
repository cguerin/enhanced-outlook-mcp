#!/usr/bin/env node

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

// Token storage path
const TOKEN_STORAGE_PATH = path.join(os.homedir(), '.enhanced-outlook-mcp-tokens.json');

async function migrateTokens() {
  try {
    // Read existing tokens
    const data = await fs.readFile(TOKEN_STORAGE_PATH, 'utf8');
    const tokens = JSON.parse(data);
    
    // Check if we need to migrate
    const users = Object.keys(tokens);
    if (users.length === 1 && !tokens['default']) {
      const userId = users[0];
      console.log(`Migrating single user token from '${userId}' to 'default'...`);
      
      // Create new token storage with 'default' key
      const newTokens = {
        'default': tokens[userId],
        [userId]: tokens[userId] // Keep original too for compatibility
      };
      
      // Save migrated tokens
      await fs.writeFile(
        TOKEN_STORAGE_PATH, 
        JSON.stringify(newTokens, null, 2),
        { encoding: 'utf8', mode: 0o600 }
      );
      
      console.log('Token migration completed successfully!');
    } else {
      console.log('No migration needed.');
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No token file found. Nothing to migrate.');
    } else {
      console.error('Migration error:', error);
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTokens();
}

export default migrateTokens;