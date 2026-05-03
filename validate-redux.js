// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, 'src');

const SLICES = {
  auth: path.join(ROOT_DIR, 'authSlice.js'),
  wallet: path.join(ROOT_DIR, 'walletSlice.js'),
};

/**
 * Extracts action names from a Redux Slice file.
 */
function getExportedActions(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  const content = fs.readFileSync(filePath, 'utf-8');
  const actions = new Set();

  // Pattern 1: Matches standard slice actions: export const { action1, action2 } = slice.actions;
  const sliceActionsRegex = /export\s+const\s+\{([\s\S]+?)\}\s*=\s*\w+Slice\.actions/g;
  let match;
  while ((match = sliceActionsRegex.exec(content)) !== null) {
    match[1].split(',').forEach(name => {
      const trimmed = name.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        actions.add(trimmed);
      }
    });
  }

  // Pattern 2: Matches standalone createAction exports: export const ACTION_NAME = createAction(...);
  const createActionRegex = /export\s+const\s+(\w+)\s*=\s*createAction/g;
  while ((match = createActionRegex.exec(content)) !== null) {
    actions.add(match[1].trim());
  }

  // Pattern 3: Matches createAsyncThunk exports: export const ACTION_NAME = createAsyncThunk(...);
  const createAsyncThunkRegex = /export\s+const\s+(\w+)\s*=\s*createAsyncThunk/g;
  while ((match = createAsyncThunkRegex.exec(content)) !== null) {
    actions.add(match[1].trim());
  }

  return actions;
}

/**
 * Recursively finds all JS/JSX files in a directory.
 */
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else if (name.endsWith('.js') || name.endsWith('.jsx')) {
      fileList.push(name);
    }
  });
  return fileList;
}

function validate() {
  console.log("🔍 Starting Redux Export Validation...");
  
  const exports = {
    auth: getExportedActions(SLICES.auth),
    wallet: getExportedActions(SLICES.wallet),
  };

  const files = getFiles(ROOT_DIR);
  let errorCount = 0;

  files.forEach(file => {
    // Skip the slice files themselves
    if (Object.values(SLICES).includes(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    
    // Regex to find imports from our specific slices
    // Matches: import { a, b } from "@/authSlice" or "../authSlice"
    const importRegex = /import\s+\{([\s\S]+?)\}\s+from\s+['"](?:@\/|\.\/|\.\.\/)*(authSlice|walletSlice)(?:\.js)?['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importedItems = match[1].split(',').map(i => i.trim()).filter(Boolean);
      const sourceSlice = match[2].toLowerCase().includes('auth') ? 'auth' : 'wallet';
      const availableActions = exports[sourceSlice];

      importedItems.forEach(item => {
        // Handle aliases (e.g., lockWallet as logout)
        const actionName = item.split(/\s+as\s+/)[0].trim();
        
        if (!availableActions.has(actionName)) {
          console.error(`\x1b[31m[ERROR]\x1b[0m In ${path.relative(ROOT_DIR, file)}:`);
          console.error(`  Action "${actionName}" is not exported by ${sourceSlice}Slice.js\n`);
          errorCount++;
        }
      });
    }
  });

  if (errorCount > 0) {
    console.log(`\x1b[31m❌ Validation failed with ${errorCount} errors.\x1b[0m`);
    process.exit(1);
  } else {
    console.log("\x1b[32m✅ All Redux imports are valid!\x1b[0m");
    process.exit(0);
  }
}

validate();