/* Dependency-free source checks. Run: node tests/structure.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)><\/script>/g)].map(([, attributes]) => {
  assert.match(attributes, /\bdefer\b/, 'Local scripts execute in explicit deferred order');
  assert.doesNotMatch(attributes, /\basync\b/, 'Registration must not race startup');
  const source = attributes.match(/\bsrc="([^"]+)"/)?.[1];
  assert.ok(source, 'No inline script blocks');
  return source;
});
const styles = [...html.matchAll(/href="(styles\/[^\"]+)"/g)].map(([, href]) => href);
assert.doesNotMatch(html, /<style\b|<script(?![^>]*\bsrc=)[^>]*>/i);
assert.equal(scripts.at(-1), 'js/main.js', 'Bootstrap loads after all registrations');
assert.ok(scripts.indexOf('audio.js') < scripts.indexOf('js/core.js'));
assert.ok(scripts.indexOf('js/core.js') < scripts.indexOf('js/state.js'));
assert.ok(scripts.indexOf('js/content.js') < scripts.indexOf('js/state.js'));
assert.equal(new Set([...scripts, ...styles]).size, scripts.length + styles.length, 'Each source loads once');
for (const file of [...scripts, ...styles]) {
  assert.ok(!path.isAbsolute(file) && !file.includes('..'), `Relative local source: ${file}`);
  assert.ok(fs.statSync(path.join(root, file)).isFile(), `Source exists: ${file}`);
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file.endsWith('.js')) {
    new vm.Script(source, { filename: file });
    assert.ok(!source.includes('__test'), `Production source has no test hooks: ${file}`);
  }
}
console.log(`PASS ${scripts.length} classic scripts and ${styles.length} stylesheets: syntax, links and startup order`);
