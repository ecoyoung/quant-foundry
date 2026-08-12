import { expect, test } from "@playwright/test";

test.beforeEach(async ({page})=>{await page.goto("/");await page.evaluate(()=>localStorage.clear());await page.reload();});

test("工作台与可靠性中心可见",async({page})=>{
  await expect(page.getByRole("heading",{name:"把每次运行，沉淀成研究证据。"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"学习成果可备份，也可完整恢复。"})).toBeVisible();
  await expect(page.getByRole("button",{name:"导出完整备份"})).toBeVisible();
});

test("课程实践保持双重门槛并显示专业编辑器",async({page})=>{
  await page.goto("/#lesson");
  await page.getByRole("button",{name:/下一步/}).first().click();
  await expect(page.getByLabel("封装调用代码")).toBeVisible();
  await expect(page.getByText("Python 3",{exact:true})).toBeVisible();
  await expect(page.getByText("两项通过后解锁")).toBeVisible();
  await expect(page.getByRole("button",{name:/下一步/}).last()).toBeDisabled();
});

test("刷新后恢复最近运行输出",async({page})=>{
  await page.evaluate(()=>localStorage.setItem("quant-last-runtime-v1-m1l1",JSON.stringify({phase:"complete",output:'{"restored":true}',result:{restored:true}})));
  await page.goto("/#lesson");await page.getByRole("button",{name:/下一步/}).first().click();
  await expect(page.getByText('{"restored":true}',{exact:true})).toBeVisible();
});

test("备份格式包含版本和校验码",async({page})=>{
  await page.evaluate(()=>localStorage.setItem("quant-research-course-progress-v1","[]"));
  const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"导出完整备份"}).click();const artifact=await downloadPromise;const stream=await artifact.createReadStream();let content="";for await(const chunk of stream)content+=chunk.toString();const backup=JSON.parse(content);
  expect(backup.schema).toBe("quant-research-backup");expect(backup.version).toBe(1);expect(backup.checksum).toMatch(/^[0-9a-f]{8}$/);
});

test("编辑器支持缩进、括号补全与快捷运行",async({page})=>{
  await page.goto("/#lesson");await page.getByRole("button",{name:/下一步/}).first().click();const editor=page.getByLabel("封装调用代码");await editor.fill("def test():");await editor.press("End");await editor.press("Enter");await editor.type("value");await editor.press("Tab");await editor.type("(");await expect(editor).toHaveValue("def test():\n    value    ()");await expect(page.getByText("⌘↵ 运行",{exact:false})).toBeVisible();
});

test("manifest 与离线资源清单完整",async({page})=>{
  const manifest=await page.request.get("/manifest.webmanifest");expect(manifest.ok()).toBeTruthy();expect((await manifest.json()).display).toBe("standalone");
  const assets=await (await page.request.get("/offline-assets.json")).json() as string[];expect(assets.length).toBeGreaterThan(120);expect(assets).toContain("/course-assets/cases.py");expect(assets).toContain("/course-assets/data/daily_ohlcv.csv");
  const sw=await page.request.get("/sw.js");expect(sw.ok()).toBeTruthy();expect(await sw.text()).toContain("CACHE_COURSE");
});

test("备份文件可恢复课程进度",async({page})=>{
  await page.evaluate(()=>localStorage.setItem("quant-research-course-progress-v1",JSON.stringify(["m1l1"])));
  const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"导出完整备份"}).click();const artifact=await downloadPromise;const path=await artifact.path();expect(path).toBeTruthy();
  await page.evaluate(()=>localStorage.removeItem("quant-research-course-progress-v1"));await page.locator('input[type="file"]').setInputFiles(path!);await page.waitForTimeout(1200);expect(await page.evaluate(()=>localStorage.getItem("quant-research-course-progress-v1"))).toBe('["m1l1"]');
});
