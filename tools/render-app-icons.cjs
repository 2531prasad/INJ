// Rasterize the code-native SVG app mark; no source photography is edited.
const fs=require('node:fs');
const path=require('node:path');
const pw=require(process.env.INJ_PLAYWRIGHT||path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'));
(async()=>{
  const root=path.resolve(__dirname,'..');
  const browser=await pw.chromium.launch({headless:true,executablePath:process.env.INJ_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try{
    const page=await browser.newPage({deviceScaleFactor:1});
    for(const size of [180,192,512]){
      await page.setViewportSize({width:size,height:size});
      await page.setContent('<style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>'+fs.readFileSync(path.join(root,'assets/app-icon.svg'),'utf8'));
      await page.screenshot({path:path.join(root,`assets/app-icon-${size}.png`)});
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
