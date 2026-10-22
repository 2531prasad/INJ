/* One entry point: fast by default; --suite menus,giant; --all; --full. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const suites = {
  smoke: ['smoke.cjs'],
  menus: ['menus.cjs'],
  targeting: ['giant-targeting.cjs'],
  combat: ['abilities.cjs', 'victory.cjs'],
  giant: ['giant.cjs', 'giant-targeting.cjs'],
  teddy: ['teddy-teleport.cjs'],
  r8: ['r8.cjs'],
  stages: ['stages.cjs']
};
const args = process.argv.slice(2);
let selected = ['smoke', 'menus', 'targeting'];
let full = false, list = false, artifacts = false, verbose = false;
try {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--suite') selected = args[++i]?.split(',') || [];
    else if (args[i] === '--full') full = true;
    else if (args[i] === '--all') selected = Object.keys(suites);
    else if (args[i] === '--list' || args[i] === '--help') list = true;
    else if (args[i] === '--artifacts') artifacts = true;
    else if (args[i] === '--verbose') verbose = true;
    else throw Error('Unknown option: ' + args[i]);
  }
  assert.ok(!full || !args.some(arg => ['--suite', '--all', '--artifacts'].includes(arg)),
    'Use --full on its own; use --suite/--all for functional checks.');
  assert.ok(selected.length && selected.every(s => suites[s]), 'Choose suites: ' + Object.keys(suites).join(', '));
} catch (error) { console.error(error.message); process.exitCode = 1; }
if (list) {
  console.log('Default: smoke, menus, targeting.\n--suite ' + Object.keys(suites).join(',') +
    '\n--all: all functional suites, no balance simulations/audio renders/replays.\n--full: legacy exhaustive suite, balance simulations, audio renders and captures.\n--artifacts: capture previews in supported functional suites.\n--verbose: print every assertion.');
} else if (!process.exitCode) {
  const started = performance.now();
  const structure = spawnSync(process.execPath, [path.join(__dirname, 'structure.cjs')], { stdio: 'inherit' });
  if (structure.status !== 0) process.exitCode = structure.status ?? 1;
  else if (full) {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'full.cjs')], { stdio: 'inherit' });
    process.exitCode = result.status ?? 1;
  } else {
    (async () => {
      const { createHarness } = require('./harness.cjs');
      const harness = await createHarness();
      const results = [];
      let checks = 0;
      const check = (condition, message) => {
        assert.ok(condition, message);
        checks++;
        if (verbose) console.log('PASS', message);
      };
      try {
        // Deduplicate overlapping suite modules; each gets fresh browser state.
        const modules = [...new Set(['smoke', ...selected].flatMap(s => suites[s]))];
        for (const module of modules) {
          const before = checks, start = performance.now();
          const session = await harness.page({ instrument: true });
          try {
            if (!['smoke.cjs', 'menus.cjs'].includes(module)) {
              await session.page.locator('#btnStartFight').tap();
              await session.page.evaluate(() => { INJ.game.paused = true; });
            }
            await require('./' + module)(session.page, check, root, { fast: true, artifacts, harness });
            check(session.errors.length === 0, module + ': no runtime/resource errors: ' + session.errors.join('; '));
          } finally { await session.close(); }
          const result = { suite: module, checks: checks - before, seconds: +( (performance.now() - start) / 1000).toFixed(2) };
          results.push(result);
          console.log(`PASS ${module}: ${result.checks} checks · ${result.seconds}s`);
        }
      } finally { await harness.close(); }
      const report = { mode: 'functional', recordedAt: new Date().toISOString(), selected, checks, seconds: +((performance.now() - started) / 1000).toFixed(2),
        suites: results, artifacts, skipped: ['balance simulations', 'offline audio renders', 'slow reveal replay', 'legacy full suite',
          ...(!artifacts ? ['preview screenshots'] : [])],
        limitations: ['Chromium emulation; no physical iPhone/Safari validation', 'No human balance estimate'] };
      fs.writeFileSync(path.join(root, 'artifacts/validation-quick.json'), JSON.stringify(report, null, 2) + '\n');
      console.log(`Passed ${checks} checks in ${report.seconds}s. Full suite, simulations and audio renders skipped.`);
    })().catch((error) => { console.error(error); process.exitCode = 1; });
  }
}
