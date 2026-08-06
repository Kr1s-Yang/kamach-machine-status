const fs = require('fs');
const path = require('path');

const FILE = '矿山设备监控系统-20260722.html';
const src = fs.readFileSync(FILE, 'utf8');

// 真正的赋值：window.MINE_DATA = { ... }（buildShareHTML 里的是 'window.MINE_DATA = ' + json，不匹配）
const marker = 'window.MINE_DATA = {';
const si = src.indexOf(marker);
if (si < 0) { console.log('未找到 window.MINE_DATA 赋值'); process.exit(1); }
const sv = si + marker.length;
// 数据脚本是单个大对象，其后第一个 </script> 即结束（base64 不含 '<'）
const close = src.indexOf('</script>', sv);
if (close < 0) { console.log('未找到数据脚本结束'); process.exit(1); }
let jsonStr = src.slice(sv, close).replace(/;\s*$/, '');
const data = JSON.parse(jsonStr);
console.log('已解析；mines:', (data.mines || []).length, '；kb 条目:', (data.kb || []).length);

const outDir = 'kb_files';
fs.mkdirSync(outDir, { recursive: true });
let extracted = 0, skipped = 0;
(data.kb || []).forEach(function (k) {
  if (k.dataUrl && k.dataUrl.indexOf(',') > 0) {
    const idx = k.dataUrl.indexOf(',');
    let buf;
    try { buf = Buffer.from(k.dataUrl.slice(idx + 1), 'base64'); } catch (e) { skipped++; return; }
    const m = (k.fileName || '').match(/\.[^.]+$/);
    const fn = k.id + (m ? m[0] : '');
    fs.writeFileSync(path.join(outDir, fn), buf);
    k.stored = 'folder'; k.path = fn; delete k.dataUrl;
    extracted++;
  } else if (k.dataUrl) { skipped++; }
});
console.log('抽取到 kb_files/ 的文件数：', extracted, '，跳过：', skipped);

data.savedAt = Date.now();
const newJson = JSON.stringify(data);
const newFile = src.slice(0, sv) + newJson + src.slice(close);
fs.writeFileSync(FILE, newFile);

const kbF = fs.readdirSync(outDir);
let total = 0; kbF.forEach(function (n) { total += fs.statSync(path.join(outDir, n)).size; });
console.log('kb_files/：', kbF);
console.log('kb_files/ 总大小：', (total / 1048576).toFixed(2), 'MB');
console.log('改写后文件大小：', (newFile.length / 1048576).toFixed(2), 'MB（原约', (src.length / 1048576).toFixed(2), 'MB）');
console.log('DONE');
