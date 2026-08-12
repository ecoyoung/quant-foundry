import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root=join(process.cwd(),"public");const result=["/","/offline.html","/manifest.webmanifest","/app-icon.svg","/python-worker.mjs"];
async function walk(dir){for(const name of await readdir(dir)){const path=join(dir,name);const info=await stat(path);if(info.isDirectory())await walk(path);else result.push("/"+relative(root,path).split("\\").join("/"));}}
await walk(join(root,"course-assets"));
await writeFile(join(root,"offline-assets.json"),JSON.stringify([...new Set(result)].sort(),null,2)+"\n");
const serviceWorkerPath=join(root,"sw.js");
const serviceWorker=await readFile(serviceWorkerPath,"utf8");
const buildVersion=`quant-course-${new Date().toISOString().replace(/[-:.TZ]/g,"")}`;
await writeFile(serviceWorkerPath,serviceWorker.replace(/const VERSION = "[^"]+";/,`const VERSION = "${buildVersion}";`));
console.log(`Generated ${result.length} offline asset entries`);
