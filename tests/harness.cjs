/* Shared local browser lifecycle. Production pages remain uninstrumented by default. */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
async function createHarness() {
  let pw;
  try { pw = require(process.env.INJ_PLAYWRIGHT || 'playwright'); }
  catch (_) { pw = require(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')); }
  const server = require('./server.cjs')(root, 0);
  let browser;
  try {
    await server.ready;
    const chrome = process.env.INJ_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    browser = await pw.chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
    return {
      root,
      url: server.url + '/index.html',
      fileUrl: pathToFileURL(path.join(root, 'index.html')).href,
      async page({ instrument = false, width = 390, height = 844, url = server.url + '/index.html' } = {}) {
        const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        page.setDefaultNavigationTimeout(15000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('requestfailed', (request) => {
          if (request.url().startsWith(server.url) && /\.(?:js|css|png)(?:$|\?)/.test(request.url()))
            errors.push(request.url() + ': ' + request.failure()?.errorText);
        });
        if (instrument) {
          const main = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
          await page.route('**/js/main.js', (route) => route.fulfill({ contentType: 'text/javascript', body: main + `
window.__test = { ...INJ, get W() { return INJ.world.width; },
  settle() { INJ.game.round = 0; INJ.resetRound(); INJ.game.state = 'fight';
    INJ.game.paused = true; INJ.game.msg = null; INJ.dummy.aiT = 999; } };` }));
        }
        await page.goto(url);
        await page.waitForFunction(() => window.INJ && INJ.arenaStages.every(s => s.image.naturalWidth) &&
          Object.values(INJ.teddySheets).every(s => s.ready) && Object.values(INJ.spriteSheets).every(s => s.ready) &&
          Object.values(INJ.walkSheets).every(s => s.ready) && INJ.r8Sheet.ready);
        return { page, errors, close: () => context.close() };
      },
      async close() { try { await browser.close(); } finally { await server.close(); } }
    };
  } catch (error) {
    if (browser) await browser.close();
    await server.close();
    throw error;
  }
}
module.exports = { createHarness };
