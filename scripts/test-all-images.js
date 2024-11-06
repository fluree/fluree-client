#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadConfig() {
  const configPath = join(
    __dirname,
    '..',
    '__tests__/config/fluree-images.json',
  );
  const configContent = await readFile(configPath, 'utf8');
  return JSON.parse(configContent);
}

async function runTestsForImage(imageTag) {
  console.log(`\n=== Testing Fluree image: fluree/server:${imageTag} ===\n`);

  return new Promise((resolve, reject) => {
    const env = { ...process.env, FLUREE_TEST_IMAGE: imageTag };
    const test = spawn('npm', ['test'], {
      env,
      stdio: 'inherit',
      shell: true,
    });

    test.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed for image: ${imageTag}`));
      }
    });
  });
}

async function main() {
  try {
    const config = await loadConfig();
    const results = [];

    for (const image of config.images) {
      console.log(`\nTesting image: ${image.tag} (${image.description})`);
      try {
        await runTestsForImage(image.tag);
        results.push({
          tag: image.tag,
          description: image.description,
          success: true,
        });
      } catch (error) {
        results.push({
          tag: image.tag,
          description: image.description,
          success: false,
          error: error.message,
        });
        // Continue testing other images even if one fails
        continue;
      }
    }

    // Print summary
    console.log('\n=== Test Results Summary ===\n');
    results.forEach((result) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(
        `${status} - fluree/server:${result.tag} (${result.description})`,
      );
      if (!result.success) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Exit with error if any tests failed
    if (results.some((r) => !r.success)) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main();
