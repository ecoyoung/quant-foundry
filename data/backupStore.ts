export const BACKUP_VERSION = 1;
export const COURSE_PREFIXES = ["quant-", "quant-stage-project-"];

export type CourseBackup = { schema: "quant-research-backup"; version: number; createdAt: string; origin: string; entries: Record<string,string>; checksum: string };

function checksum(entries:Record<string,string>) { let hash=2166136261; const input=JSON.stringify(Object.keys(entries).sort().map(key=>[key,entries[key]])); for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);} return (hash>>>0).toString(16).padStart(8,"0"); }
export function collectCourseEntries(){const entries:Record<string,string>={};for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key&&COURSE_PREFIXES.some(prefix=>key.startsWith(prefix)))entries[key]=localStorage.getItem(key)??"";}return entries;}
export function createBackup():CourseBackup { const entries=collectCourseEntries(); return {schema:"quant-research-backup",version:BACKUP_VERSION,createdAt:new Date().toISOString(),origin:location.origin,entries,checksum:checksum(entries)}; }
export function validateBackup(value:unknown):CourseBackup { if(!value||typeof value!=="object")throw new Error("备份不是有效对象");const backup=value as CourseBackup;if(backup.schema!=="quant-research-backup")throw new Error("不是量研课备份文件");if(backup.version>BACKUP_VERSION)throw new Error("备份版本高于当前应用，暂时无法恢复");if(!backup.entries||typeof backup.entries!=="object")throw new Error("备份缺少数据条目");if(checksum(backup.entries)!==backup.checksum)throw new Error("校验码不一致，文件可能损坏");return migrateBackup(backup); }
function migrateBackup(backup:CourseBackup):CourseBackup { return {...backup,version:BACKUP_VERSION}; }
export function restoreBackup(backup:CourseBackup){const safe=validateBackup(backup);for(const [key,value] of Object.entries(safe.entries)){if(COURSE_PREFIXES.some(prefix=>key.startsWith(prefix)))localStorage.setItem(key,value);}localStorage.setItem("quant-backup-last-restore-v1",new Date().toISOString());}
export function storageHealth(){const entries=collectCourseEntries();let corrupt=0;for(const [key,value] of Object.entries(entries)){if((key.includes("progress")||key.includes("runs")||key.includes("experiments")||key.includes("project"))){try{JSON.parse(value)}catch{corrupt+=1}}}const bytes=new Blob(Object.entries(entries).flat()).size;return {entries:Object.keys(entries).length,bytes,corrupt};}
