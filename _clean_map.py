import re, io

path = r'C:\Users\17605\WorkBuddy\2026-07-17-13-41-01\mine-monitor\矿山设备监控系统.html'
with io.open(path, 'r', encoding='utf-8') as f:
    text = f.read()

before = len(text)
# 清理 <div id="map"> 内被嵌入的 Leaflet 运行时 DOM（一行内，含 tile/marker/attribution 等）
new_text, n = re.subn(
    r'<div id="map" class="map leaflet-container.*?</div>\s*\n',
    '<div id="map" class="map"></div>\n',
    text, count=1, flags=re.DOTALL
)
print('map cleanup count:', n)

with io.open(path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print('old size:', before, 'new size:', len(new_text))
print('leaflet-tile-loaded (should be 1, CSS):', new_text.count('leaflet-tile-loaded'))
print('class="pulse (should be ~0 in body html, only in JS strings):', new_text.count('class="pulse '))
