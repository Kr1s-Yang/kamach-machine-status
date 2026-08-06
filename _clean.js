const fs = require('fs');
try {
  const dir = 'C:\\Users\\17605\\WorkBuddy\\2026-07-17-13-41-01\\mine-monitor\\';
  const name = '矿山设备监控系统.html';
  const path = dir + name;
  let text = fs.readFileSync(path, 'utf8');
  const before = text.length;
  const re = /<div id="map" class="map leaflet-container[\s\S]*?<\/div>\s*\n/;
  const newText = text.replace(re, '<div id="map" class="map"></div>\n');
  console.log('before', before, 'after', newText.length, 'changed', before !== newText.length);
  fs.writeFileSync(path, newText, 'utf8');
  console.log('OK written');
  console.log('leaflet-tile-loaded count:', (newText.match(/leaflet-tile-loaded/g) || []).length);
  console.log('class="pulse count:', (newText.match(/class="pulse /g) || []).length);
} catch (e) {
  console.error('ERROR:', e && e.message);
  console.error(e && e.stack);
  process.exit(2);
}
