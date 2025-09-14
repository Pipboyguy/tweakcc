#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const cliPath = '/Users/marcel/.local/state/fnm_multishells/1474_1757745782086/lib/node_modules/@anthropic-ai/claude-code/cli.js';

// Catppuccin Mocha colors
const colorReplacements = [
  // Main Claude orange colors
  ['rgb(215,119,87)', 'rgb(147,153,178)'],  // claude -> lavender
  ['rgb(245,149,117)', 'rgb(166,173,200)'], // claudeShimmer -> lavender light
  ['rgb(235,159,127)', 'rgb(166,173,200)'], // another shimmer variant
  ['rgb(255,183,101)', 'rgb(166,173,200)'], // another orange variant

  // Orange-ish colors that might be used
  ['rgb(255,153,51)', 'rgb(147,153,178)'],  // bright orange
  ['rgb(255,178,102)', 'rgb(166,173,200)'], // light orange
  ['rgb(250,179,135)', 'rgb(166,173,200)'], // peachy orange

  // Also replace in hex format if present
  ['#d77757', '#9399b2'],  // claude orange in hex
  ['#f59575', '#a6adc8'],  // shimmer in hex
];

console.log('Reading cli.js...');
let content = fs.readFileSync(cliPath, 'utf8');
const originalContent = content;

console.log('\nReplacing colors:');
colorReplacements.forEach(([oldColor, newColor]) => {
  const regex = new RegExp(oldColor.replace(/[()]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    console.log(`  ${oldColor} -> ${newColor} (${matches.length} occurrences)`);
    content = content.replace(regex, newColor);
  }
});

if (content !== originalContent) {
  // Backup
  const backupPath = cliPath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, originalContent);
  console.log(`\nBackup saved to: ${backupPath}`);

  // Write updated file
  fs.writeFileSync(cliPath, content);
  console.log('cli.js updated successfully!');

  // Restore permissions
  fs.chmodSync(cliPath, 0o755);
  console.log('Permissions restored to 755');
} else {
  console.log('\nNo changes needed.');
}