/* Run: node tests/browser.cjs
   Requires Playwright and Chrome/Chromium. Optional: INJ_PLAYWRIGHT, INJ_CHROME. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let pw;
try { pw = require(process.env.INJ_PLAYWRIGHT || 'playwright'); }
catch (_) { pw = require(path.join(process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core')); }
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mainSource = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const hook = `window.__test={...window.INJ,get W(){return window.INJ.world.width;},
  settle(){const {game,resetRound,dummy}=window.INJ;game.round=0;resetRound();game.state='fight';game.paused=true;game.msg=null;dummy.aiT=999;}};`;
const instrumented = mainSource+'\n'+hook;
async function instrumentPage(page){
  await page.route('**/js/main.js',route=>route.fulfill({contentType:'text/javascript',body:instrumented}));
  page.on('requestfailed',request=>{if(request.url().startsWith('http://127.0.0.1:8879/')&&/\.(?:js|css)(?:$|\?)/.test(request.url()))resourceErrors.push(request.url()+': '+request.failure()?.errorText);});
}
const server = require('./server.cjs')(root,8879);
const resourceErrors=[];
let browser;
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks++; console.log('PASS', message); }

(async () => {
  await server.ready;
  const chrome = process.env.INJ_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await pw.chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  check(!/<style\b|<script(?![^>]*\bsrc=)[^>]*>/i.test(source),'HTML contains markup and external source links, without an inline game or stylesheet');
  const production=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const actual=await production.newPage(),productionErrors=[];
  actual.on('pageerror',e=>productionErrors.push(e.message));
  actual.on('requestfailed',request=>{if(/(?:127\.0\.0\.1|^file:)/.test(request.url())&&/\.(?:js|css)(?:$|\?)/.test(request.url()))productionErrors.push(request.url()+': '+request.failure()?.errorText);});
  for(const url of ['http://127.0.0.1:8879/index.html',pathToFileURL(path.join(root,'index.html')).href]){
    await actual.goto(url);
    await actual.waitForFunction(()=>window.InjAudio&&window.INJ&&INJ.r8Sheet.ready&&Object.values(INJ.teddySheets).every(s=>s.ready)&&Object.values(INJ.spriteSheets).every(s=>s.ready)&&Object.values(INJ.walkSheets).every(s=>s.ready)&&INJ.arenaStages.every(s=>s.image.naturalWidth>0));
    check(await actual.evaluate(()=>!window.__test&&INJ.game.paused&&InjAudio.ctx===null&&document.styleSheets.length>=7&&document.querySelector('#screen').clientHeight>100),`Uninstrumented ${url.startsWith('file:')?'direct file':'HTTP'} launch loads modules, art and styles without test hooks`);
    await actual.locator('#btnStartFight').tap();await actual.locator('#btnArenaMenu').tap();
    await actual.evaluate(()=>{INJ.game.round=4;INJ.player.hp=1;});
    await actual.locator('#btnRestart').tap();
    check(await actual.evaluate(()=>INJ.game.round===1&&INJ.player.hp===INJ.player.maxHp&&!INJ.game.paused),`Uninstrumented ${url.startsWith('file:')?'direct file':'HTTP'} controls and restart work through the module bootstrap`);
    check(await actual.evaluate(()=>{INJ.game.round=4;INJ.resetRound();INJ.stepGiantIntro(4.8);INJ.game.paused=true;INJ.render(0);
      return INJ.isGiant(INJ.dummy)&&INJ.arenaStage().id==='giants'&&INJ.teddySheets.giant.ready&&INJ.game.roundTime===null;}),
      `Uninstrumented ${url.startsWith('file:')?'direct file':'HTTP'} boss stage loads and renders its local art`);
  }
  check(productionErrors.length===0,`Production module startup has no runtime errors (${productionErrors.join('; ')})`);
  await production.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await mobile.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await instrumentPage(page);
  async function viewport(size){
    await page.setViewportSize(size);
    await page.waitForFunction(()=>{
      const wrap=document.querySelector('.wrap'),style=getComputedStyle(wrap);
      return Math.abs(document.querySelector('#screen').getBoundingClientRect().width-(wrap.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)))<.5;
    });
  }
  await page.goto('http://127.0.0.1:8879/index.html');
  await page.bringToFront();
  await page.waitForTimeout(500);
  await page.waitForFunction(()=>__test.arenaStages.every(s=>s.image.complete&&s.image.naturalWidth>0)&&[...Object.values(__test.spriteSheets),...Object.values(__test.walkSheets)].every(s=>s.ready));
  check(await page.evaluate(()=>!document.querySelector('.notes')&&!document.body.textContent.includes('/html/body/')), 'Bottom prose panels and selector-like text are absent');
  check(await page.evaluate(()=>__test.hurtbox(__test.player).h>=225*.4), 'Fighter hurtboxes grow with the larger on-screen proportions');
  check(await page.evaluate(() => __test.game.t === 0 && InjAudio.ctx === null), 'Initial profile freezes combat and does not autoplay');
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'artifacts/phone-intro.png') });
  await page.locator('#btnStartFight').click();
  await page.waitForTimeout(300);
  check(await page.evaluate(() => InjAudio.ctx.state === 'running' && InjAudio.step > 0), 'First tap unlocks audio and advances the music clock');
  await page.evaluate(() => { __test.game.t = 1.79; });
  await page.waitForFunction(()=>__test.game.state==='fight');
  check(await page.evaluate(() => __test.game.state === 'fight'), 'Entering starts a fresh round');

  // Verify native widescreen geometry and in-arena touch controls in both orientations.
  for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[667,375],[844,390]]) {
    await viewport({ width, height });
    const layout = await page.evaluate(() => {
      const visible = el => el.getClientRects().length > 0;
      const rect = el => el.getBoundingClientRect();
      const controls = [...document.querySelectorAll('.abtn')].filter(visible);
      const missingControls = controls.length < 6;
      const offscreen = controls.some(el => { const r = rect(el); return r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1; });
      const arena = rect(document.querySelector('#screen'));
      const outsideArena = controls.some(el => {const r=rect(el);return r.left<arena.left||r.right>arena.right||r.top<arena.top||r.bottom>arena.bottom;});
      const near = (a,b) => Math.abs(a-b)<.01;
      const canvas = document.querySelector('#game');
      const content=canvas.getBoundingClientRect();
      const expected=innerWidth>innerHeight?innerWidth/innerHeight:2;
      const wrongRatio=!near(content.width/content.height,canvas.width/canvas.height)||Math.abs(canvas.width/canvas.height-expected)>.01;
      const undersized = controls.some(el=>rect(el).width<44||rect(el).height<44);
      const fullscreen=rect(document.querySelector('#btnArenaMenu'));
      const menu=document.querySelector('#btnArenaMenu'),icon=rect(menu.querySelector('svg'));
      const overlap=r=>fullscreen.left<r.right&&fullscreen.right>r.left&&fullscreen.top<r.bottom&&fullscreen.bottom>r.top;
      const utilityOverlap=[...controls,document.querySelector('#stickZone')].some(el=>visible(el)&&overlap(rect(el)));
      const utilityHeavy=icon.width>20||icon.height>20||getComputedStyle(menu).borderTopWidth!=='0px'||document.querySelector('.arena-tools');
      const landscapeGap=innerWidth>innerHeight&&Math.abs(arena.height-innerHeight)>2;
      const fullscreenMissing=fullscreen.height<44||fullscreen.top<arena.top||fullscreen.bottom>arena.bottom||fullscreen.left<arena.left||fullscreen.right>arena.right||!!document.querySelector('.phone-tools');
      const menuOverlap = controls.some(el=>rect(el).top<arena.top+arena.height*.18);
      return { missingControls, overflow: document.documentElement.scrollWidth > innerWidth, offscreen, outsideArena, wrongRatio, undersized, landscapeGap, menuOverlap, fullscreenMissing,utilityOverlap,utilityHeavy:!!utilityHeavy };
    });
    check(!Object.values(layout).some(Boolean), `Phone ${width}×${height}: dynamic aspect, on-screen targets ≥44px, fullscreen embedded and landscape fills height (${JSON.stringify(layout)})`);
    await page.locator('#btnArenaMenu').click();
    const menuLayout=await page.evaluate(()=>{
      const r=document.querySelector('#screen').getBoundingClientRect(),p=document.querySelector('.pause-panel').getBoundingClientRect();
      const controls=[...document.querySelectorAll('.pause-grid button')].map(el=>({rect:el.getBoundingClientRect(),overflow:el.scrollWidth>el.clientWidth+1}));
      return p.top>=r.top&&p.bottom<=r.bottom&&p.left>=r.left&&p.right<=r.right&&controls.every(({rect:b,overflow})=>b.width>=44&&b.height>=44&&b.top>=p.top&&b.bottom<=p.bottom&&!overflow);
    });
    check(menuLayout,`Phone ${width}×${height}: compact settings menu fits, readable targets ≥44px`);
    if(width===390||width===844)await page.screenshot({path:path.join(root,width===390?'artifacts/menu-portrait.png':'artifacts/menu-landscape.png')});
    await page.locator('#btnResume').click();
    if(width===844)await page.screenshot({path:path.join(root,'artifacts/phone-landscape.png')});
  }
  // A changing aspect changes world width without stretching or resetting combat.
  await page.evaluate(()=>{__test.settle();__test.player.hp=93;__test.dummy.hp=107;__test.startAttack(__test.player,'jab');__test.player.atk.t=.04;});
  const resizeBefore=await page.evaluate(()=>({width:__test.W,gap:__test.dummy.x-__test.player.x}));
  for(const [width,height] of [[956,440],[1024,500],[667,375]]){
    await viewport({width,height});
    await page.waitForFunction(()=>Math.abs(__test.W/225-innerWidth/innerHeight)<.01);
    const sizing=await page.evaluate(()=>{
      const t=__test,r=document.querySelector('#game').getBoundingClientRect();
      return {ratio:r.width/r.height,backing:document.querySelector('#game').width/450,width:t.W,hp:[t.player.hp,t.dummy.hp],attack:t.player.atk?.t,gap:t.dummy.x-t.player.x,bounded:[t.player,t.dummy].every(f=>f.x>=26&&f.x<=t.W-26)};
    });
    check(Math.abs(sizing.ratio-width/height)<.01&&Math.abs(sizing.backing-sizing.ratio)<.01&&sizing.width!==resizeBefore.width,`Dynamic ${width}×${height}: canvas fills available space with uniform scaling`);
    check(sizing.hp[0]===93&&sizing.hp[1]===107&&sizing.attack===.04&&Math.abs(sizing.gap-resizeBefore.gap)<.001&&sizing.bounded,`Dynamic ${width}×${height}: resize preserves health, attack progress and fighter spacing`);
  }
  await viewport({width:390,height:844});
  await page.waitForFunction(()=>__test.W===450);
  await page.evaluate(()=>{__test.settle();__test.game.paused=false;});
  await page.locator('#btnPause').click();
  const stopped = await page.evaluate(() => __test.game.roundTime);
  await page.waitForTimeout(150);
  check(await page.evaluate(t => __test.game.roundTime === t, stopped), 'Pause freezes the round timer');
  await page.locator('#btnResume').click();
  await page.locator('#btnShowIntro').click();
  const profileTime = await page.evaluate(() => __test.game.roundTime);
  await page.waitForTimeout(150);
  check(await page.evaluate(t => __test.game.roundTime === t, profileTime), 'Profile freezes an active fight');
  await page.locator('#btnStartFight').click();
  await page.evaluate(() => { __test.settle(); __test.game.paused = false; });

  // Use genuine simultaneous Chromium touch contacts, not independent click events.
  const cdp = await mobile.newCDPSession(page);
  const zone = await page.locator('#stickZone').boundingBox();
  const guard = await page.locator('#pad [data-act="block"]').boundingBox();
  const point = (id,x,y) => ({ id, x, y, radiusX: 5, radiusY: 5, force: 1 });
  let left = point(1, zone.x + zone.width/2 - 20, zone.y + zone.height/2);
  const right = point(2, guard.x + guard.width/2, guard.y + guard.height/2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left] });
  left={...left,x:left.x+35};
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
  const knob = await page.locator('#stickKnob').boundingBox();
  check(Math.abs(knob.x+knob.width/2-left.x)<1 && Math.abs(knob.y+knob.height/2-left.y)<1, 'Floating joystick knob follows the thumb in viewport coordinates');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left,right] });
  check(await page.evaluate(() => __test.input.right === 1 && __test.input.block === 1), 'Both thumbs: hold movement and guard together');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [right] });
  check(await page.evaluate(() => __test.input.right === 1 && __test.input.block === 0), 'Releasing guard preserves the movement thumb');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  check(await page.evaluate(() => !Object.values(__test.input).some(Boolean)), 'Touch cancellation releases every held input');

  // Observe state in the pointer event itself, before release or the next animation frame.
  await page.evaluate(()=>{
    __test.settle();__test.game.paused=false;
    document.querySelector('#pad [data-act="punch"]').addEventListener('pointerdown',()=>{window.pressSnapshot={key:__test.player.atk?.key,time:__test.player.atk?.t,pose:__test.sampleFighterAnimation(__test.player).frame};},{once:true});
  });
  const punch=await page.locator('#pad [data-act="punch"]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(3,punch.x+punch.width/2,punch.y+punch.height/2)]});
  check(await page.evaluate(()=>pressSnapshot.key==='jab'&&pressSnapshot.time===0&&pressSnapshot.pose!==0),'Touch-down begins and paints attack anticipation before release or the next frame');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  for(const [width,height] of [[390,844],[844,390]]){
    await viewport({width,height});
    await page.evaluate(()=>{__test.settle();__test.game.paused=false;});
    const arrows=await page.locator('.stick-directions').boundingBox();
    const up=point(8,arrows.x+arrows.width/2,arrows.y+9);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[up]});
    check(await page.evaluate(()=>!__test.player.grounded&&__test.player.vy<0&&__test.input.up===1),`Phone ${width}×${height}: pressing joystick up jumps immediately`);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    check(await page.evaluate(()=>__test.input.up===0),`Phone ${width}×${height}: releasing joystick clears jump`);
    await page.evaluate(()=>{__test.settle();__test.game.paused=false;});
    const center=point(9,arrows.x+arrows.width/2,arrows.y+arrows.height/2);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...center,x:center.x+26,y:center.y-28}]});
    check(await page.evaluate(()=>!__test.player.grounded&&__test.player.vy<0&&__test.input.right===1&&__test.player.vx>0),`Phone ${width}×${height}: joystick diagonal-up launches a forward jump`);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    for(const [clock,dx,dy,jump] of [['10:00',-36,-24,false],['10:30',-26,-26,true],['12:00',0,-32,true],['1:30',26,-26,true],['2:00',36,-24,false]]){
      await page.evaluate(()=>{__test.settle();__test.game.paused=false;});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...center,x:center.x+dx,y:center.y+dy}]});
      const result=await page.evaluate(()=>({up:__test.input.up,grounded:__test.player.grounded,left:__test.input.left,right:__test.input.right}));
      check(result.up===Number(jump)&&result.grounded===!jump&&(dx===0||(dx<0?result.left:result.right)===1),`Phone ${width}×${height}: ${clock} ${jump?'jumps':'moves sideways without jumping'} within the 10:30–1:30 cone`);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
  }
  await page.locator('#btnArenaMenu').click();
  await page.locator('#pauseOverlay [data-audio="music"]').focus();
  await page.keyboard.press('Tab');
  check(await page.evaluate(()=>document.activeElement.id==='btnResume'),'Game menu traps Tab at the last action');
  await page.keyboard.press('Shift+Tab');
  check(await page.evaluate(()=>document.activeElement.dataset.audio==='music'),'Game menu traps Shift+Tab at the first action');
  const mutedBefore=await page.evaluate(()=>InjAudio.muted);
  await page.locator('#pauseOverlay [data-audio="sound"]').click();
  check(await page.evaluate(before=>InjAudio.muted!==before&&document.querySelector('#pauseOverlay [data-audio="sound"]').textContent.includes(InjAudio.muted?'off':'on'),mutedBefore),'Compact menu audio action updates sound state and label');
  await page.locator('#pauseOverlay [data-audio="sound"]').click();
  await page.locator('#pauseOverlay [data-fullscreen]').click();
  await page.waitForFunction(()=>!!document.fullscreenElement);
  check(await page.evaluate(()=>document.fullscreenElement===document.documentElement&&document.body.classList.contains('native-fullscreen')&&Math.abs(__test.W/225-innerWidth/innerHeight)<.01),'Compact game menu enters native fullscreen with all dialogs included and fills the display');
  async function gestureDefaults(targetPage){
    return targetPage.evaluate(()=>{
      const target=document.querySelector('#game'),out={};
      for(const type of ['gesturestart','gesturechange','gestureend','dblclick','contextmenu','touchmove']){
        const e=new Event(type,{bubbles:true,cancelable:true});
        if(type==='touchmove')Object.defineProperty(e,'touches',{value:[{}]});
        target.dispatchEvent(e);out[type]=e.defaultPrevented;
      }
      const pinch=new Event('touchstart',{bubbles:true,cancelable:true});Object.defineProperty(pinch,'touches',{value:[{},{}]});target.dispatchEvent(pinch);out.pinch=pinch.defaultPrevented;
      const tap=new Event('touchstart',{bubbles:true,cancelable:true});Object.defineProperty(tap,'touches',{value:[{}]});document.querySelector('#btnResume').dispatchEvent(tap);out.singleTap=tap.defaultPrevented;
      return out;
    });
  }
  const locked=await gestureDefaults(page);
  check(Object.entries(locked).every(([key,value])=>key==='singleTap'?!value:value),'Native fullscreen cancels browser zoom, gestures, long press and page movement while preserving menu taps');
  async function zoomGestures(targetPage,session,mode){
    const before=await targetPage.evaluate(()=>({scale:visualViewport.scale,x:scrollX,y:scrollY}));
    const arena=await targetPage.locator('#screen').boundingBox(),x=arena.x+arena.width*.2,y=arena.y+arena.height*.18;
    await session.send('Input.synthesizeTapGesture',{x,y,tapCount:2,gestureSourceType:'touch'});
    check(await targetPage.evaluate(before=>visualViewport.scale===before.scale&&scrollX===before.x&&scrollY===before.y,before),`${mode}: actual double-tap leaves zoom and page position unchanged`);
    await session.send('Input.synthesizePinchGesture',{x,y,scaleFactor:1.6,relativeSpeed:800,gestureSourceType:'touch'});
    check(await targetPage.evaluate(before=>visualViewport.scale===before.scale&&scrollX===before.x&&scrollY===before.y,before),`${mode}: actual pinch leaves zoom and page position unchanged`);
  }
  await zoomGestures(page,cdp,'Native fullscreen');
  await page.locator('#btnResume').tap();
  await page.evaluate(()=>{__test.settle();__test.game.paused=false;});
  const immersiveStick=await page.locator('.stick-directions').boundingBox(),immersiveGuard=await page.locator('#pad [data-act="block"]').boundingBox();
  const finger1=point(21,immersiveStick.x+immersiveStick.width-5,immersiveStick.y+immersiveStick.height/2),finger2=point(22,immersiveGuard.x+immersiveGuard.width/2,immersiveGuard.y+immersiveGuard.height/2);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger1]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger1,finger2]});
  check(await page.evaluate(()=>__test.input.right===1&&__test.input.block===1),'Gesture lock preserves genuine simultaneous movement and guard in fullscreen');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await page.locator('#btnArenaMenu').tap();
  await page.locator('#pauseOverlay [data-profile]').tap();
  check(await page.locator('#introModal').isVisible(),'Profile remains visible in the native fullscreen top layer');
  await page.locator('#btnStartFight').tap();
  await page.locator('#btnArenaMenu').tap();
  await page.evaluate(()=>{
    const t=__test;t.game.round=7;t.game.roundTime=12;t.game.elapsed=99;t.game.hits=8;t.game.roastCount=4;
    t.player.hp=9;t.dummy.hp=17;t.player.charge=3;t.startAttack(t.player,'jab');
    t.input.right=1;t.pressBuf.kick=performance.now()+220;
  });
  const restartPrefs=await page.evaluate(()=>({muted:InjAudio.muted,music:InjAudio.musicEnabled}));
  await page.locator('#btnRestart').tap();
  check(await page.evaluate(()=>{
    const t=__test;
    return t.game.round===1&&t.game.state==='intro'&&!t.game.paused&&t.game.roundTime===99&&t.game.elapsed<.5&&t.game.hits===0&&t.game.roastCount===0&&t.player.hp===t.player.maxHp&&t.dummy.hp===t.dummy.maxHp&&t.player.charge===0&&!t.player.atk&&!t.dummy.atk&&!Object.values(t.input).some(Boolean)&&!Object.values(t.pressBuf).some(Boolean)&&t.projectiles.length===0&&t.particles.length===0&&t.afterimages.length===0;
  }),'Restart game returns a damaged later-round fight to a clean, active round-one introduction');
  check(await page.evaluate(prefs=>!!document.fullscreenElement&&document.querySelector('#pauseOverlay').hidden&&document.activeElement.id==='btnArenaMenu'&&InjAudio.muted===prefs.muted&&InjAudio.musicEnabled===prefs.music,restartPrefs),'Restart closes the menu, restores focus and preserves fullscreen and audio preferences');
  await page.locator('#btnArenaMenu').tap();
  await page.locator('#pauseOverlay [data-fullscreen]').click();
  await page.waitForFunction(()=>!document.fullscreenElement);
  check(await page.locator('#pauseOverlay [data-fullscreen]').isVisible(),'Fullscreen can be exited from the phone pause menu');
  await page.locator('#btnResume').click();
  check(await page.evaluate(()=>document.activeElement.id==='btnArenaMenu'&&document.querySelector('#btnArenaMenu').getAttribute('aria-expanded')==='false'),'Closing game menu restores focus to the quiet trigger');
  const unlocked=await gestureDefaults(page);
  check(Object.values(unlocked).every(value=>!value)&&await page.evaluate(()=>!document.documentElement.classList.contains('immersive-view')),'Leaving fullscreen restores ordinary browser gesture defaults');
  await page.evaluate(()=>{document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined;});
  await page.locator('#btnArenaMenu').click();
  await page.locator('#pauseOverlay [data-fullscreen]').click();
  check(await page.evaluate(()=>document.body.classList.contains('expanded-view')&&document.querySelector('#fullscreenStatus').textContent.includes('Add to Home Screen')),'Unsupported phone fullscreen shows an expanded view with an honest Home Screen hint');
  const expandedLock=await gestureDefaults(page);
  check(Object.entries(expandedLock).every(([key,value])=>key==='singleTap'?!value:value),'Expanded-view fallback also locks browser gestures');
  await zoomGestures(page,cdp,'Expanded view');
  await page.locator('#pauseOverlay [data-fullscreen]').click();
  check(await page.evaluate(()=>!document.body.classList.contains('expanded-view')),'Expanded-view fallback can be exited');
  await page.locator('#btnResume').click();
  await page.evaluate(()=>{delete document.documentElement.requestFullscreen;delete document.documentElement.webkitRequestFullscreen;__test.settle();});
  await viewport({width:390,height:844});

  const manifest=await (await fetch('http://127.0.0.1:8879/manifest.webmanifest')).json();
  check(manifest.display==='fullscreen'&&manifest.start_url==='./'&&manifest.scope==='./'&&await page.locator('link[rel="manifest"]').count()===1,'Home Screen manifest requests fullscreen with deployment-relative launch and scope');
  for(const size of [180,192,512]){
    const icon=await fetch(`http://127.0.0.1:8879/assets/app-icon-${size}.png`),bytes=Buffer.from(await icon.arrayBuffer());
    check(icon.ok&&bytes.readUInt32BE(16)===size&&bytes.readUInt32BE(20)===size,`Home Screen icon ${size}×${size} is served at its declared size`);
  }
  // Emulate launch signals; this verifies our app response, not actual iPhone chrome.
  for(const mode of ['navigator','display-mode']){
    const installed=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
    await installed.addInitScript(mode=>{
      if(mode==='navigator')Object.defineProperty(navigator,'standalone',{value:true});
      else {const original=window.matchMedia.bind(window);window.matchMedia=query=>query.includes('display-mode:')?{matches:true,addEventListener(){}}:original(query);}
    },mode);
    const app=await installed.newPage();app.on('pageerror',e=>errors.push(e.message));
    await instrumentPage(app);
    await app.goto('http://127.0.0.1:8879/index.html');await app.locator('#btnStartFight').tap();
    check(await app.evaluate(()=>document.body.classList.contains('standalone-view')&&document.documentElement.classList.contains('immersive-view')&&getComputedStyle(document.querySelector('.plaque')).display==='none'&&Math.abs(document.querySelector('#screen').getBoundingClientRect().height-innerHeight)<2),`Home Screen ${mode}: immersive layout and gesture lock activate on launch`);
    const appLock=await gestureDefaults(app);
    check(Object.entries(appLock).every(([key,value])=>key==='singleTap'?!value:value),`Home Screen ${mode}: browser gesture defaults are cancelled`);
    if(mode==='navigator')await zoomGestures(app,await installed.newCDPSession(app),'Home Screen app');
    await app.locator('#btnArenaMenu').tap();
    check(await app.locator('[data-fullscreen]').isDisabled()&&await app.locator('[data-fullscreen]').textContent()==='App mode',`Home Screen ${mode}: menu reports app mode instead of offering a false fullscreen exit`);
    if(mode==='navigator')await app.screenshot({path:path.join(root,'artifacts/home-screen-menu.png')});
    await installed.close();
  }
  const safari=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const iphone=await safari.newPage();iphone.on('pageerror',e=>errors.push(e.message));
  await instrumentPage(iphone);
  await iphone.goto('http://127.0.0.1:8879/index.html');await iphone.locator('#btnStartFight').tap();
  await iphone.evaluate(()=>{document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined;});
  await iphone.locator('#btnArenaMenu').tap();await iphone.locator('[data-fullscreen]').tap();
  check(await iphone.evaluate(()=>document.body.classList.contains('expanded-view')&&document.querySelector('#fullscreenStatus').textContent.includes('Safari bars stay visible')&&document.querySelector('#fullscreenStatus').textContent.includes('Open as Web App')),'iPhone fallback explains the exact Home Screen route instead of promising to hide Safari bars');
  check(await iphone.evaluate(()=>{
    const panel=document.querySelector('.pause-panel'),box=panel.getBoundingClientRect(),hint=document.querySelector('#fullscreenStatus').getBoundingClientRect();
    return panel.scrollHeight===panel.clientHeight&&box.top>=0&&box.bottom<=innerHeight&&hint.bottom<=box.bottom&&scrollY===0;
  }),'Small iPhone menu shows all fullscreen instructions and actions without clipping or page scrolling');
  await iphone.screenshot({path:path.join(root,'artifacts/iphone-fullscreen-help.png')});
  await safari.close();

  const animationChecks=await page.evaluate(()=>{
    const t=__test,out={};t.settle();
    out.atlases=Object.values(t.spriteSheets).every(s=>s.ready&&s.meta.frames.length===12&&s.meta.frames.every(f=>f.x>=0&&f.y>=0&&f.x+f.w<=s.image.naturalWidth&&f.y+f.h<=s.image.naturalHeight));
    out.detail=document.querySelector('#game').width===t.W*t.RENDER_SCALE&&document.querySelector('#game').height===450;
    t.dummy.x=t.player.x+60;t.startAttack(t.player,'jab');const a=t.player.atk,d=a.def,hp=t.dummy.hp;
    const start=t.sampleAttackAnimation(t.player);a.t=d.startup*.5;const early=t.sampleAttackAnimation(t.player);
    a.t=d.startup+d.active*.5;const strike=t.sampleAttackAnimation(t.player);
    out.fastStart=d.startup<=.04&&start.frame!==early.frame&&early.frame===strike.frame&&!Object.hasOwn(strike,'blend');
    a.t=d.startup+d.active+d.recovery*.5;const middle=t.sampleAttackAnimation(t.player);
    a.t=d.startup+d.active+d.recovery*.95;const end=t.sampleAttackAnimation(t.player);
    out.softEnd=end.frame===0&&end.offset<middle.offset&&middle.frame!==strike.frame;
    a.t=0;t.stepAttack(t.player,d.startup*.5,t.dummy);out.startupNoDamage=t.dummy.hp===hp;
    t.stepAttack(t.player,d.startup*.6,t.dummy);out.activeDamage=t.dummy.hp<hp;
    t.settle();t.player.state='idle';t.player.anim=0;const idle=t.sampleFighterAnimation(t.player);t.player.anim=123;
    out.stableIdle=JSON.stringify(idle)===JSON.stringify(t.sampleFighterAnimation(t.player));
    out.noCrossfades=Object.keys(t.MOVES).every(key=>{
      t.player.atk={key,def:t.MOVES[key],t:0};
      const d=t.MOVES[key],total=d.startup+d.active+d.recovery;
      return Array.from({length:30},(_,i)=>{t.player.atk.t=i*total/30;return t.sampleAttackAnimation(t.player);}).every(p=>!Object.hasOwn(p,'blend')&&!Object.hasOwn(p,'next'));
    });
    t.settle();t.player.state='walk';
    out.walkFrames=Object.values(t.walkSheets).every(s=>s.ready&&s.meta.frames.length===4&&s.meta.frames[0].w>s.meta.frames[1].w*1.3&&s.meta.frames[2].w>s.meta.frames[3].w*1.3);
    out.fullCycle=['inj','dummy'].every(kind=>{
      const f={...t.player,kind,state:'walk'};
      return [0,1,2,3,4].map(i=>{f.walkPhase=i*t.WALK_FRAME_DISTANCE;const p=t.sampleFighterAnimation(f);return p.atlas==='walk'?p.frame:-1;}).join(',')==='0,1,2,3,0';
    });
    t.settle();t.input.right=1;const from=t.player.x;
    t.controlPlayer(t.player,t.dummy,.15);const phase=t.player.walkPhase;
    out.travelDriven=Math.abs(phase-(t.player.x-from))<.00001&&t.sampleFighterAnimation(t.player).frame===1;
    t.input.right=0;t.controlPlayer(t.player,t.dummy,.8);t.player.anim+=123;
    out.stopPreservesPhase=t.player.state==='idle'&&t.player.walkPhase===phase;
    t.input.left=1;t.controlPlayer(t.player,t.dummy,.15);
    out.reverseWalk=Math.abs(t.player.walkPhase)<.00001&&t.player.facing===1;
    t.settle();t.player.x=t.W-26;t.input.right=1;const wallPhase=t.player.walkPhase;
    t.controlPlayer(t.player,t.dummy,.5);
    out.wallStopsFeet=t.player.x===t.W-26&&t.player.state==='idle'&&t.player.walkPhase===wallPhase;
    t.settle();t.dummy.state='walk';const dummyFrom=t.dummy.x;
    t.controlDummy(t.dummy,t.player,.3);
    out.dummyWalk=t.dummy.x<dummyFrom&&t.dummy.walkPhase>0&&t.sampleFighterAnimation(t.dummy).atlas==='walk';
    t.settle();t.game.paused=false;t.queueAction('jump');
    out.zeroDeltaJump=!t.player.grounded&&t.player.vy<0;
    t.physics(t.player,1/60);out.jumpRises=t.player.y<198;
    t.settle();t.input.up=1;t.player.hitstun=.1;t.controlPlayer(t.player,t.dummy,.11);t.controlPlayer(t.player,t.dummy,.01);
    out.heldUpAfterStun=!t.player.grounded&&t.player.vy<0;
    t.settle();return out;
  });
  for(const [name,passed] of Object.entries(animationChecks))check(passed,`Fighter animation: ${name}`);

  const stageChecks=await page.evaluate(()=>{
    const t=__test,out={};t.settle();t.resetRound();t.game.state='fight';
    const phases=[2,4.2,6,8.4,10,11.8,13,15.2].map(time=>t.stageDuelAt(time,false).phase);
    out.choreography=phases.join(',')==='guard,dodge,counter,aerial,shadow,finisher,launch,victory';
    const win=t.stageDuelAt(15.2,false);
    out.injWins=win.winner==='INJ'&&win.inj.state==='victory'&&win.dummy.state==='ko'&&win.dummy.hp===0;
    const a=t.stageDuelAt(6.25,false),b=t.stageDuelAt(24.25,false);
    out.loop=a.time===b.time&&a.inj.x===b.inj.x&&a.dummy.x===b.dummy.x&&a.phase===b.phase;
    const stillA=t.stageDuelAt(6,true),stillB=t.stageDuelAt(15,true);
    out.reducedMotion=JSON.stringify(stillA)===JSON.stringify(stillB);
    out.cadence=JSON.stringify(t.stageDuelAt(6.01,false))===JSON.stringify(t.stageDuelAt(6.04,false));
    out.dodgeHold=t.stageDuelAt(4.05,false).inj.x===143&&t.stageDuelAt(4.4,false).inj.x===143;
    const before=JSON.stringify({player:t.player,dummy:t.dummy,game:t.game,projectiles:t.projectiles,afterimages:t.afterimages});
    for(let i=0;i<180;i++)t.drawStageDuel(i*100);
    out.isolated=before===JSON.stringify({player:t.player,dummy:t.dummy,game:t.game,projectiles:t.projectiles,afterimages:t.afterimages});
    out.finite=Array.from({length:180},(_,i)=>t.stageDuelAt(i/10,false)).every(s=>[s.inj,s.dummy].every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&f.backstage&&f.awakenedLook));
    t.render(6000);const first=t.ctx.getImageData(138*t.W/400*t.RENDER_SCALE,(198+(66-198)*t.W/400)*t.RENDER_SCALE,126*t.W/400*t.RENDER_SCALE,46*t.W/400*t.RENDER_SCALE).data;
    t.render(15200);const second=t.ctx.getImageData(138*t.W/400*t.RENDER_SCALE,(198+(66-198)*t.W/400)*t.RENDER_SCALE,126*t.W/400*t.RENDER_SCALE,46*t.W/400*t.RENDER_SCALE).data;
    out.renderedMotion=first.some((value,i)=>value!==second[i]);
    return out;
  });
  for(const [name,passed] of Object.entries(stageChecks))check(passed,`Background duel: ${name}`);
  const artHash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'assets/hollow-courtyard.png'))).digest('hex');
  check(artHash==='b0f5adf45a4046e196dce5c34c79177d1217967d32b6ec967c9b8be8cc9ee83e','Existing arena image remains byte-for-byte unchanged');

  const mechanics = await page.evaluate(() => {
    const t=__test, result={};
    t.settle();
    // A touch queued in the last part of recovery survives until the attack finishes.
    t.game.paused=false;t.startAttack(t.player,'jab');t.player.atk.t=.23;t.queueAction('kick');
    t.game.paused=true;t.controlPlayer(t.player,t.dummy,.04);t.controlPlayer(t.player,t.dummy,.001);
    result.buffer=t.player.atk?.key==='roundhouse';
    t.settle();t.game.paused=false;t.input.down=1;t.queueAction('kick');t.game.paused=true;
    t.controlPlayer(t.player,t.dummy,.001);result.crouch=t.player.atk?.key==='sweep';
    t.settle();t.startAttack(t.dummy,'haymaker');
    t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);
    result.interrupt=t.dummy.atk===null&&t.dummy.state==='hurt';
    t.settle();t.dummy.invuln=.5;const hp=t.dummy.hp;
    t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);result.invuln=t.dummy.hp===hp;
    t.settle();t.dummy.state='block';
    t.projectiles.push({x:t.dummy.x-1,y:t.dummy.y-46,vx:0,life:1,owner:t.player,charged:false});
    t.updateProjectiles(.01);result.projectileBlock=t.dummy.hp===t.dummy.maxHp-2&&t.dummy.state==='block';
    t.settle();t.dummy.hp=1;t.dummy.state='block';
    t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);result.chipKO=t.game.state==='ko';
    t.settle();
    for(let i=0;i<3;i++)t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);
    result.charge=t.player.charge===3&&document.querySelector('[data-act="special"]').classList.contains('ready');
    t.startAttack(t.player,'toss');t.stepAttack(t.player,.19,t.dummy);
    result.chargedToss=t.player.charge===0&&t.projectiles[0]?.charged===true;
    t.settle();t.dummy.x=t.player.x+40;
    t.projectiles.push({x:t.dummy.x,y:t.dummy.y-46,vx:0,life:1,owner:t.player,charged:true});
    t.updateProjectiles(.01);result.chargedDamage=t.dummy.hp===112&&t.dummy.state==='knockdown';
    t.settle();t.dummy.hp=1;
    t.projectiles.push({x:t.dummy.x,y:t.dummy.y-46,vx:0,life:1,owner:t.player,charged:false});
    t.projectiles.push({x:0,y:0,vx:0,life:1,owner:t.player,charged:false});
    t.updateProjectiles(.01);result.projectileKO=t.game.state==='ko'&&t.projectiles.length===0;
    t.player.invuln=.4;t.player.charge=3;t.player.comboStep=1;t.resetRound();
    result.reset=t.player.invuln===0&&t.player.charge===0&&t.player.comboStep===0&&t.player.facing===1;
    const x=t.dummy.x;t.controlDummy(t.dummy,t.player,1);result.introAI=t.dummy.x===x&&t.dummy.atk===null;
    t.settle();t.dummy.x=t.player.x+82;t.startAttack(t.player,'jab');t.tryHit(t.player,t.dummy);
    result.scaledReach=t.dummy.hp===125;
    t.settle();t.startAttack(t.player,'toss');t.stepAttack(t.player,.19,t.dummy);
    result.scaledProjectile=t.projectiles[0].y===t.player.y-46*t.FIGHTER_SCALE;
    t.settle();return result;
  });
  for (const [name, passed] of Object.entries(mechanics)) check(passed, `Combat: ${name}`);

  await require('./abilities.cjs')(page,check,root);
  await require('./victory.cjs')(page,check,root);
  await require('./stages.cjs')(page,check,root);
  const teddyBenchmark=await require('./teddy-teleport.cjs')(page,check,root);
  const giantBenchmark=await require('./giant.cjs')(page,check,root);

  const difficulty=await page.evaluate(()=>{
    const t=__test,out={};
    function roundTwo(){t.settle();t.resetRound();t.game.state='fight';t.game.paused=true;t.game.msg=null;t.dummy.aiT=0;}
    t.settle();t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);const warmDamage=130-t.dummy.hp;
    roundTwo();t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);
    const damaged=t.dummy.hp;t.controlDummy(t.dummy,t.player,.016);
    out.armoredButDamageable=damaged<130&&130-damaged<warmDamage&&t.dummy.hp===damaged;
    roundTwo();t.dummy.state='block';t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);out.chipDamage=t.dummy.hp===129;
    roundTwo();t.dummy.x=t.player.x+40;
    t.projectiles.push({x:t.dummy.x,y:t.dummy.y-46,vx:0,life:1,owner:t.player,charged:true});t.updateProjectiles(.01);
    out.chargedHit=t.dummy.hp===118&&t.dummy.state==='knockdown';
    roundTwo();t.startAttack(t.dummy,'roundhouse');
    out.readableHeavyAttack=t.dummy.atk.def.startup>=.07&&t.dummy.atk.def.recovery>=.18&&t.dummy.atk.def.dmg>t.MOVES.roundhouse.dmg&&t.dummy.atk.def.dmg<18;
    const committed=t.dummy.atk;committed.t=committed.def.startup+.01;t.startAttack(t.player,'jab');t.controlDummy(t.dummy,t.player,.01);
    out.activeStrikeCommits=t.dummy.atk===committed&&t.dummy.dodgeT===0;
    roundTwo();t.dummy.x=t.player.x+200;const before=t.dummy.x;t.controlDummy(t.dummy,t.player,.1);
    out.agilePursuit=before-t.dummy.x>=15&&before-t.dummy.x<20;
    roundTwo();t.dummy.x=t.player.x+45;t.dodgeDummy(t.dummy,t.player);
    out.quickDodge=t.dummy.dodgeCooldown>=.6&&t.dummy.invuln>0&&t.dummy.invuln<t.dummy.dodgeT&&t.dummy.dodgeT<=.18;
    t.controlDummy(t.dummy,t.player,.2);
    out.dodgeHasOpening=t.dummy.dodgeT===0&&t.dummy.invuln===0&&t.dummy.restT>=.28&&!t.dummy.atk;
    roundTwo();t.dummy.x=t.player.x+55;t.dummy.restT=.7;t.dummy.openingT=.32;t.startAttack(t.player,'jab');t.controlDummy(t.dummy,t.player,.1);
    const restHp=t.dummy.hp;t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);
    out.restIsPunishable=t.dummy.restT>0&&!t.dummy.atk&&t.dummy.dodgeT===0&&t.dummy.hp<restHp;
    roundTwo();t.dummy.x=t.player.x+55;t.dummy.burstLeft=0;t.startAttack(t.dummy,'jab');
    const move=t.dummy.atk.def;t.controlDummy(t.dummy,t.player,move.startup+move.active+move.recovery+.001);
    out.burstHasPause=!t.dummy.atk&&t.dummy.restT>=.65&&t.dummy.openingT>=.32;
    t.controlDummy(t.dummy,t.player,.3);out.pauseDoesNotAttack=!t.dummy.atk&&t.dummy.restT>0;
    roundTwo();t.dummy.grounded=false;t.dummy.y=t.player.y-1;t.dummy.vy=60;t.dummy.burstLeft=0;t.startAttack(t.dummy,'jkick');t.controlDummy(t.dummy,t.player,.016);
    out.aerialLandingHasPause=t.dummy.grounded&&!t.dummy.atk&&t.dummy.restT>=.65&&t.dummy.openingT>=.32;
    roundTwo();t.dummy.hp=1;t.applyHit(t.dummy,t.player,t.MOVES.jab,200,140);
    out.stillBeatable=t.game.state==='ko'&&t.game.msg.text==='INJ WINS'&&!t.game.lost;
    roundTwo();t.game.roundTime=.001;t.player.hp=120;t.dummy.hp=1;t.updateFlow(.01);
    out.noForcedOutcome=t.game.msg.text==='INJ WINS';
    roundTwo();t.dummy.x=t.player.x+55;
    for(let i=0;i<7200&&t.game.state==='fight';i++){t.controlPlayer(t.player,t.dummy,1/120);t.controlDummy(t.dummy,t.player,1/120);}
    out.idlePlayerLoses=t.player.hp===0&&t.game.lost;
    roundTwo();t.game.round=20;t.startAttack(t.dummy,'jab');out.laterRoundsHard=t.dummy.atk.def.dmg>t.MOVES.jab.dmg&&t.dummy.atk.def.recovery>=.18;
    const play=InjAudio.play, random=INJ.rnd;InjAudio.play=()=>{};
    let dummyWins=0,playerWins=0,attacks=0,dodges=0,restFrames=0,frames=0;
    const policyResults=['idle','punch spam','mixed attacks','Shadow kiting','jumping kicks','guard/counter','crouch/sweep'].map(policy=>({policy,trials:0,dummyWins:0,playerWins:0}));
    try{
      for(let trial=0;trial<100;trial++){
        INJ.rnd=INJ.mulberry32(1993+trial);
        roundTwo();t.game.paused=false;t.game.roundTime=99;
        const policy=trial%7;
        // Hit-stop pauses the round clock, so allow enough simulation time for
        // the actual 99-second timer to expire instead of judging HP early.
        for(let frame=0;frame<18000&&t.game.state==='fight';frame++){
          const p=t.player,op=t.dummy,dir=Math.sign(op.x-p.x),gap=Math.abs(op.x-p.x);
          t.input.left=0;t.input.right=0;t.input.down=+(policy===6);t.input.up=+(policy===4);t.input.block=+(policy===5);
          if(policy&&policy!==5&&policy!==6){
            const move=policy===3?-dir:gap>56?dir:0;t.input.left=+(move<0);t.input.right=+(move>0);
          }
          if(policy&&!p.atk&&p.hitstun<=0){
            const act=policy===1?'punch':policy===2?['punch','kick','upper'][Math.floor(frame/24)%3]:policy===3?'special':policy===4?(p.grounded?null:'kick'):policy===5?(frame%80<8?'punch':null):'kick';
            if(act)t.pressBuf[act]=performance.now()+220;
          }
          const attack=op.atk,dodge=op.dodgeT;
          t.update(1/60);frames++;if(op.restT>0)restFrames++;
          if(op.atk&&op.atk!==attack)attacks++;if(op.dodgeT>dodge)dodges++;
        }
        if(t.game.state==='fight')throw new Error('Awakened benchmark exceeded its five-minute simulation cap');
        policyResults[policy].trials++;
        if(t.game.lost){dummyWins++;policyResults[policy].dummyWins++;}else{playerWins++;policyResults[policy].playerWins++;}
      }
    }finally{InjAudio.play=play;INJ.rnd=random;t.settle();}
    return {checks:out,benchmark:{seedBase:1993,trials:100,roundSeconds:99,policies:7,dummyWins,playerWins,policyResults,attacks,dodges,restFraction:restFrames/frames}};
  });
  for(const [name,passed] of Object.entries(difficulty.checks))check(passed,`Awakened opponent: ${name}`);
  check(difficulty.benchmark.dummyWins>difficulty.benchmark.playerWins&&difficulty.benchmark.playerWins>=5,`Awakened benchmark: dummy wins ${difficulty.benchmark.dummyWins}/100 against seven scripted play styles (not a human win-rate estimate)`);
  check(difficulty.benchmark.dodges>difficulty.benchmark.attacks&&difficulty.benchmark.restFraction>.25,'Awakened fighting style favours evasions over attacks and spends substantial time in recovery windows');
  const r8Benchmarks=await require('./r8.cjs')(page,check,root);
  const halos=await page.evaluate(()=>{
    const t=__test;t.settle();const f={...t.player,charge:0};
    // Stabilize Chrome's GPU-to-CPU readback switch before comparing alpha edges.
    for(let i=0;i<4;i++)t.ctx.getImageData(0,0,1,1);
    t.ctx.clearRect(0,0,t.W,225);t.drawFighter(f);const before=t.ctx.getImageData(0,0,t.W*2,450).data;
    t.ctx.clearRect(0,0,t.W,225);t.drawFighter({...f,charge:3});const after=t.ctx.getImageData(0,0,t.W*2,450).data;
    const noChargeHalo=before.every((value,i)=>value===after[i]);
    document.querySelector('#btnPause').focus();const noFocusRing=getComputedStyle(document.querySelector('#btnPause')).outlineStyle==='none';
    t.render(0);return {noChargeHalo,noFocusRing};
  });
  check(halos.noChargeHalo,'INJ charged sprite has no hand or floor halo');
  check(halos.noFocusRing,'Focused buttons have no outline halo');
  await viewport({width:844,height:390});
  await page.evaluate(()=>{__test.settle();__test.resetRound();__test.game.state='fight';__test.game.msg=null;__test.game.paused=false;__test.dummy.x=__test.player.x+55;__test.dummy.aiT=0;});
  await page.waitForFunction(()=>__test.player.hp<120,null,{timeout:6000});
  check(await page.evaluate(()=>__test.game.round===2),'Live round two still threatens an idle player');
  await page.screenshot({path:path.join(root,'artifacts/round-two-nightmare.png')});
  await page.evaluate(()=>{__test.settle();});await viewport({width:390,height:844});

  // Loss-only, player-paced cat exchange; the game waits for reading and input.
  await page.evaluate(()=>{const t=__test;t.settle();t.endRound(t.dummy);t.updateFlow(3.1);});
  check(await page.locator('#roastModal').isVisible()&&await page.evaluate(()=>__test.game.paused&&__test.game.state==='roast'), 'Losing opens the cat dialogue and freezes combat');
  check(await page.locator('#catPortrait img').evaluate(img=>img.complete&&img.naturalWidth>0), 'The stylized cat portrait loads from a local asset');
  const line=await page.locator('#roastConversation').innerText();
  await page.waitForTimeout(200);
  check(await page.locator('#roastConversation').innerText()===line, 'Dialogue waits for a tap rather than skipping itself');
  for(let i=0;i<4;i++)await page.locator('#btnNextRoast').tap();
  check(await page.locator('#roastConversation .speech').last().locator('.speaker').innerText()==='THE CAT'&&await page.locator('#btnNextRoast').innerText()==='FIGHT AGAIN', 'Cat and INJ trade five lines, with the cat delivering the final roast');
  check(await page.evaluate(()=>document.querySelector('.cat-portrait').getBoundingClientRect().right+10<=document.querySelector('.roast-conversation').getBoundingClientRect().left), 'Phone speech bubbles remain separate from the cat portrait');
  await page.screenshot({path:path.join(root,'artifacts/cat-roast-phone.png'),animations:'disabled'});
  await viewport({width:844,height:390});
  await page.waitForTimeout(250);
  check(await page.locator('.roast-card').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}), 'Cat dialogue fits a landscape phone without clipping');
  await page.screenshot({path:path.join(root,'artifacts/cat-roast-landscape.png'),animations:'disabled'});
  await page.locator('#btnNextRoast').click();
  check(await page.locator('#roastModal').isHidden()&&await page.evaluate(()=>__test.game.round===1&&!__test.game.paused&&__test.game.state==='intro'), 'Fight Again retries the same round exactly once');
  await page.evaluate(()=>{__test.endRound(__test.dummy);__test.updateFlow(3.1);});
  check(await page.locator('#roastConversation').innerText()!==line, 'Repeated losses rotate through different roast exchanges');
  await page.locator('#btnSkipRoast').click();
  check(await page.locator('#roastModal').isHidden()&&await page.evaluate(()=>__test.game.round===1), 'Skip immediately retries the same round');
  await page.evaluate(()=>{__test.settle();__test.endRound(__test.player);__test.updateFlow(3.1);});
  check(await page.locator('#roastModal').isHidden()&&await page.evaluate(()=>__test.game.state==='victory'), 'Winning a round opens the victory scene and bypasses the cat roast');
  await page.evaluate(()=>{__test.settle();__test.startRoast();});
  await page.keyboard.press('Enter');
  check(await page.evaluate(()=>__test.game.roastStep===1), 'Keyboard Enter advances the dialogue');
  await page.keyboard.press('Escape');
  check(await page.locator('#roastModal').isHidden(), 'Keyboard Escape skips the dialogue');
  await viewport({width:390,height:844});
  await page.evaluate(()=>__test.settle());

  await page.evaluate(()=>{__test.settle();__test.game.roastCount=2;__test.startRoast();});
  for(let i=0;i<3;i++)await page.locator('#btnNextRoast').tap();
  check((await page.locator('#roastConversation .speech').last().innerText()).includes('MiMi, please stop.'),'Easter egg: INJ calls her cat MiMi');
  await page.screenshot({path:path.join(root,'artifacts/mimi-easter-egg.png'),animations:'disabled'});
  await page.locator('#btnNextRoast').tap();
  check((await page.locator('#roastConversation .speech').last().innerText()).includes('You feed me every day.'),'MiMi roasts her own owner in the final comeback');
  await page.locator('#btnSkipRoast').click();await page.evaluate(()=>__test.settle());

  // Music continues through menus; independent controls persist across reloads.
  const stepBefore = await page.evaluate(() => InjAudio.step);
  await page.waitForTimeout(180);
  check(await page.evaluate(step => InjAudio.step !== step, stepBefore), 'Music clock continues while combat is paused');
  await page.locator('.plaque [data-audio="music"]').click();
  check(await page.evaluate(() => !InjAudio.musicEnabled && !InjAudio.muted), 'Music can be disabled while effects remain enabled');
  await page.locator('.plaque [data-audio="sound"]').click();
  await page.reload();
  check(await page.evaluate(() => InjAudio.muted && !InjAudio.musicEnabled), 'Audio preferences survive reload');
  await page.locator('#introModal [data-audio="sound"]').click();
  await page.locator('#introModal [data-audio="music"]').click();
  await page.locator('#btnStartFight').click();
  await page.evaluate(() => { __test.settle(); __test.game.paused=false; });
  await page.screenshot({ path: path.join(root, 'artifacts/phone-fight.png') });
  await page.evaluate(() => { window.dispatchEvent(new Event('blur')); });
  check(await page.evaluate(() => __test.game.paused && !document.querySelector('#pauseOverlay').hidden), 'Losing focus pauses safely');

  // Render an entire 16-bar arrangement, plus every effect, in a real Web Audio graph.
  const audio = await page.evaluate(async () => {
    const engine=InjAudio;
    engine.suspend();
    const live=engine.ctx, offline=new OfflineAudioContext(1,Math.ceil(36*22050),22050);
    const LiveAC=window.AudioContext;
    window.AudioContext=function(){return offline;};engine.ctx=null;engine.voices=new Set();engine.muted=false;engine.musicEnabled=true;engine.init();window.AudioContext=LiveAC;
    engine.master.gain.value=.72;engine.music.gain.value=.58;
    const step=60/112/4;
    for(let i=0;i<256;i++)engine.sequence(i,.1+i*step);
    const effects=['teleport','shrink','victory','swing','jump','punch','kick','uppercut','jumpkick','block','toss','shadow','charge','gong','finish','fall','ui','catlaugh','engine','boost','rim','transform','enlarge','bossWindup','bossSmash','summon'];
    // Effects are recorded in a separate offline pass below to preserve the score preview.
    const buffer=await offline.startRendering(), data=buffer.getChannelData(0);
    let peak=0,sum=0,invalid=0,clipped=0;
    for(const x of data){peak=Math.max(peak,Math.abs(x));sum+=x*x;if(!Number.isFinite(x))invalid++;if(Math.abs(x)>=.999)clipped++;}
    const chunks=[];
    for(let start=0;start<data.length;start+=22050){let power=0;for(let i=start;i<Math.min(start+22050,data.length);i++)power+=data[i]*data[i];chunks.push(Math.sqrt(power/22050));}
    engine.ctx=live;
    return {peak,rms:Math.sqrt(sum/data.length),invalid,clipped,chunks,samples:Array.from(data),effects};
  });
  check(audio.invalid===0&&audio.clipped===0&&audio.peak>.05&&audio.peak<.99, 'Full procedural score renders finite, audible samples without clipping');
  check(audio.chunks.slice(1,34).every(rms=>rms>.005), 'Full arrangement has no silent gaps');
  const pcm = Buffer.alloc(audio.samples.length*2);
  audio.samples.forEach((sample,i)=>pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),i*2));
  const header=Buffer.alloc(44);
  header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(22050,24);header.writeUInt32LE(44100,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
  fs.writeFileSync(path.join(root,'artifacts/arcade-score-preview.wav'),Buffer.concat([header,pcm]));
  // Fresh page isolates the real-time effect graph from the offline preview engine.
  await page.reload();await page.locator('#btnStartFight').click();
  for(const effect of audio.effects)await page.evaluate(effect=>InjAudio.play(effect),effect);
  await page.waitForTimeout(1200);
  check(await page.evaluate(()=>InjAudio.voices.size<35), 'All effect voices finish and release their audio nodes');

  const desktop=await browser.newContext({viewport:{width:1366,height:900}});
  const pc=await desktop.newPage();pc.on('pageerror',e=>errors.push(e.message));
  await instrumentPage(pc);
  await pc.goto('http://127.0.0.1:8879/index.html');await pc.locator('#btnStartFight').click();
  check(await pc.locator('#pad').isHidden()&&await pc.locator('#stickZone').isHidden(), 'Desktop uses the keyboard layout');
  check(await pc.evaluate(()=>{const r=document.querySelector('#game').getBoundingClientRect();return Math.abs(r.width/r.height-2)<.01;}), 'Desktop defaults to the widescreen 18:9 arena');
  await pc.keyboard.press('Escape');check(await pc.locator('#pauseOverlay').isVisible(),'Escape pauses on desktop');
  await pc.keyboard.press('Escape');check(await pc.locator('#pauseOverlay').isHidden(),'Escape resumes on desktop');
  await pc.screenshot({path:path.join(root,'artifacts/desktop.png')});
  await pc.evaluate(()=>{__test.settle();__test.resetRound();__test.game.state='fight';__test.game.msg=null;__test.game.elapsed=6.25;});
  await pc.waitForTimeout(100);
  await pc.screenshot({path:path.join(root,'artifacts/background-duel-fight.png')});
  await pc.evaluate(()=>{__test.game.elapsed=15.2;});
  await pc.waitForTimeout(100);
  await pc.screenshot({path:path.join(root,'artifacts/background-duel-victory.png')});
  check(errors.length===0, `No browser runtime errors (${errors.join('; ')})`);
  check(resourceErrors.length===0, `All local split-script and stylesheet requests complete (${resourceErrors.join('; ')})`);
  const report={checks,awakenedBenchmark:difficulty.benchmark,r8Benchmarks,teddyBenchmark,giantBenchmark,engine:'Chrome / Chromium',viewports:9,audio:{peak:audio.peak,rms:audio.rms,clippedSamples:audio.clipped},limitations:['No physical phone or mobile Safari test','No subjective speaker or headphone listening review','Scripted benchmarks do not measure human win rates. Dummy/R8 use seven basic policies without Nitro, Blink or aerial Shadow; Teddy uses four full-encounter policies including Nitro and Blink, plus twenty isolated tiny-phase repeated-kick trials. Colossus uses thirty full fights across idle, reckless and prepared guard/Blink policies.']};
  fs.writeFileSync(path.join(root,'artifacts/validation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();await server.close();});
