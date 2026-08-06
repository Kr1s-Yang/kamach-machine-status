/* ===================================================================
 * 俄罗斯井下设备状态监控系统  —  交互逻辑
 * 技术：Leaflet（地图/缩放/平移）+ localStorage（数据持久化）
 * =================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'mine-monitor-data-v1';

  /* ===========================================================
   * 天地图（Tianditu）底图配置
   * 天地图是国家地理信息公共服务平台，服务器在国内、无需 VPN 即可访问，
   * 且具备全球矢量/影像覆盖（俄罗斯地区细节充足）。需要免费申请一个 token：
   *   1) 打开 https://tianditu.gov.cn 注册并登录
   *   2) 进入「应用管理 → 创建应用」，类型选"浏览器端"，获得一串 tk 密钥
   *   3) 把下面的 TIANDITU_TOKEN 替换为你的密钥即可
   * 若未配置 token，应用会自动回退到内置的离线矢量底图（俄罗斯轮廓 + 城市），不会白屏。
   * 注意：天地图为 GCJ-02 坐标，矿山标注点为 WGS-84，存在轻微偏移（监控展示可接受）。
   * =========================================================== */
  const TIANDITU_TOKEN = 'YOUR_TIANDITU_TOKEN'; // ← 在此填入你的天地图 tk 密钥
  const TD_TOKEN_READY = typeof TIANDITU_TOKEN === 'string'
    && TIANDITU_TOKEN && TIANDITU_TOKEN.indexOf('YOUR_TIANDITU_TOKEN') === -1;

  const STATUS = {
    running: { label: '运行中', cls: 'st-running' },
    fault:   { label: '故障维修中', cls: 'st-fault' },
    stopped: { label: '停机中', cls: 'st-stopped' }
  };

  /* ---------- 工具 ---------- */
  function uid() {
    return 'm' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 示例数据（俄罗斯真实矿区坐标） ---------- */
  function sampleData() {
    return {
      mines: [
        {
          id: uid(), name: '诺里尔斯克镍矿', lat: 69.35, lng: 88.20,
          devices: [
            { id: uid(), code: 'DR-001', type: '钻机', status: 'running', faults: [] },
            { id: uid(), code: 'TR-010', type: '运输车', status: 'fault', faults: ['主传动轴承过热，需停机更换', '液压管路渗油需排查'] },
            { id: uid(), code: 'VF-003', type: '通风设备', status: 'running', faults: [] }
          ]
        },
        {
          id: uid(), name: '米尔内钻石矿', lat: 62.53, lng: 113.96,
          devices: [
            { id: uid(), code: 'HM-001', type: '提升机', status: 'running', faults: [], stopReason: '' },
            { id: uid(), code: 'PU-002', type: '泵站', status: 'stopped', faults: [], stopReason: '例行保养，预计 2 天后恢复' }
          ]
        },
        {
          id: uid(), name: '沃尔库塔煤矿', lat: 67.50, lng: 64.07,
          devices: [
            { id: uid(), code: 'EX-001', type: '掘进机', status: 'running', faults: [] }
          ]
        },
        {
          id: uid(), name: '马格尼托戈尔斯克铁矿', lat: 53.42, lng: 59.05,
          devices: [
            { id: uid(), code: 'DR-021', type: '钻机', status: 'fault', faults: ['液压系统泄漏，压力不足'] },
            { id: uid(), code: 'TR-045', type: '运输车', status: 'fault', faults: ['转向机构异响，需检修', '左前轮胎压报警'] }
          ]
        },
        {
          id: uid(), name: '库尔斯克铁矿', lat: 51.74, lng: 36.19,
          devices: [
            { id: uid(), code: 'VF-011', type: '通风设备', status: 'running', faults: [], stopReason: '' },
            { id: uid(), code: 'PU-007', type: '泵站', status: 'stopped', faults: [], stopReason: '季节性停产检修' }
          ]
        }
      ]
    };
  }

  /* ---------- 状态 ---------- */
  let state = { mines: [], selectedId: null };
  let markers = {};      // mineId -> L.marker
  let pickMode = null;   // { forNew:bool, mineId?:string }
  let map = null;
  let hoverEl = null; // 矿山悬停浮层（名称 + 状态）
  let faultPoints = [];    // 设备编辑时的故障点列表

  /* ---------- 持久化 ---------- */
  let dirty = false; // 是否有改动尚未"保存到文件"

  function load() {
    let ls = null, sh = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) ls = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    if (window.MINE_DATA && window.MINE_DATA.mines && window.MINE_DATA.mines.length) {
      sh = window.MINE_DATA;
    }
    // 取"更新时间(savedAt)较新"的一方：本机编辑 vs 分发文件，保证最新数据优先
    let chosen = null;
    if (ls && ls.mines && ls.mines.length && sh && sh.mines && sh.mines.length) {
      chosen = (ls.savedAt || 0) >= (sh.savedAt || 0) ? ls : sh;
    } else if (ls && ls.mines && ls.mines.length) {
      chosen = ls;
    } else if (sh && sh.mines && sh.mines.length) {
      chosen = sh;
    }
    if (!chosen) chosen = { savedAt: 0, mines: sampleData().mines };

    state.mines = chosen.mines;
    migrate(state.mines);
    // 若数据来自分发文件（本机尚无缓存），先写入本机，便于后续编辑持久化
    save();
    dirty = false; updateDirtyBadge();
  }
  function migrate(list) {
    list.forEach(function (mine) {
      (mine.devices || []).forEach(function (d) {
        if (d.faults == null) d.faults = (d.fault && String(d.fault).trim()) ? [d.fault] : [];
        delete d.fault;
        if (d.stopReason == null) d.stopReason = '';
      });
    });
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), mines: state.mines }));
    } catch (e) { /* ignore quota */ }
  }

  /* 导出"单文件分享版"：把数据、Leaflet 库、样式全部内联进一个 HTML。
     同事双击即可打开，无需联网、无需整个文件夹，数据随文件走，不会丢失。 */
  function exportShareFile() {
    const json = JSON.stringify({ savedAt: Date.now(), mines: state.mines })
      .replace(/<\/script>/gi, '<\\/script>');
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fname = '矿山设备监控系统-' + stamp + '.html';
    buildSelfContained(json, function (html) {
      downloadHTML(html, fname);
      markClean();
      toast('已导出单文件：' + fname + '（直接发给同事，双击即可看到你的全部数据）');
    });
  }
  function escForJs(s) { return String(s).replace(/<\/script>/gi, '<\\/script>'); }
  function escForCss(s) { return String(s).replace(/<\/style>/gi, '<\\/style>'); }
  function fetchText(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error('nf'); return r.text(); }); }

  function buildSelfContained(json, cb) {
    // 优先：通过 http 预览服务器直接内联最新资源，生成完全自包含单文件
    Promise.all([
      fetchText('index.html'), fetchText('vendor/leaflet.js'), fetchText('vendor/leaflet.css'),
      fetchText('vendor/russia.js'), fetchText('vendor/cities.js'), fetchText('app.js'), fetchText('styles.css')
    ]).then(function (res) {
      const idx = res[0], lj = res[1], lcss = res[2], rus = res[3], cit = res[4], app = res[5], css = res[6];
      let html = idx
        .replace('<script src="vendor/share-template.js"></script>', '')
        .replace('<link rel="stylesheet" href="vendor/leaflet.css" />', '<style>' + escForCss(lcss) + '</style>')
        .replace('<link rel="stylesheet" href="styles.css" />', '<style>' + escForCss(css) + '</style>')
        .replace('<script src="vendor/leaflet.js"></script>', '<script>' + escForJs(lj) + '</script>')
        .replace('<script src="vendor/russia.js"></script>', '<script>' + escForJs(rus) + '</script>')
        .replace('<script src="vendor/cities.js"></script>', '<script>' + escForJs(cit) + '</script>')
        .replace('<script src="app.js"></script>', '<script>' + escForJs(app) + '</script>')
        .replace('<script src="data.js"></script>', '<script>window.MINE_DATA = ' + json + ';</script>');
      cb(html);
    }).catch(function () {
      // 回退：file:// 双击打开时无法 fetch，使用预生成的单文件模板（同样自包含）
      const tpl = window.SHARE_TEMPLATE || '';
      if (!tpl) { toast('导出失败：请通过本地预览地址(http)打开后点击导出'); return; }
      cb(tpl.replace('__DATA__', json));
    });
  }
  function downloadHTML(html, fname) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function markDirty() { dirty = true; updateDirtyBadge(); }
  function markClean() { dirty = false; updateDirtyBadge(); }
  function updateDirtyBadge() {
    const el = document.getElementById('dirtyBadge');
    if (!el) return;
    if (dirty) {
      el.textContent = '● 有改动，待导出';
      el.className = 'dirty-badge dirty';
    } else {
      el.textContent = '✓ 已导出最新';
      el.className = 'dirty-badge clean';
    }
  }

  /* ---------- 地图 ---------- */
  function initMap() {
    // 聚焦欧亚大陆（以俄罗斯为核心），限制视野范围，不显示全球
    var eurasia = L.latLngBounds([[18, -20], [83, 195]]);
    map = L.map('map', {
      center: [61, 95], zoom: 3, minZoom: 3, maxZoom: 14, zoomControl: true,
      maxBounds: eurasia, maxBoundsViscosity: 0.85, worldCopyJump: false
    });

    const offlineLayer = L.layerGroup();
    let offlineOn = false;
    function goOffline(reason) {
      if (offlineOn) return;
      offlineOn = true;
      try { map.removeLayer(onlineLayer); map.removeLayer(onlineLabels); } catch (e) {}
      offlineLayer.addTo(map);
      const badge = document.getElementById('mapModeBadge');
      if (badge) {
        badge.classList.remove('hidden');
        badge.textContent = reason || '🗺️ 离线模式（矢量底图）';
      }
    }

    // 在线底图：天地图（国内可访问、全球覆盖、俄罗斯细节充足）
    //   vec_w = 全球矢量底图；cva_w = 全球中文注记层（城市/地名）
    const tdBase = 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=' + TIANDITU_TOKEN;
    const tdLabel = 'https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=' + TIANDITU_TOKEN;
    const onlineLayer = L.tileLayer(tdBase, {
      subdomains: '01234567', maxZoom: 18,
      attribution: '&copy; 天地图 Tianditu', bounds: eurasia
    });
    const onlineLabels = L.tileLayer(tdLabel, {
      subdomains: '01234567', maxZoom: 18,
      attribution: '', bounds: eurasia, opacity: 1
    });

    if (!TD_TOKEN_READY) {
      // 未配置 token：直接走离线矢量底图
      goOffline('🔑 未配置天地图 token，已用离线矢量底图（见 app.js 顶部）');
    } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      goOffline('🗺️ 离线模式（矢量底图）');
    } else {
      onlineLayer.addTo(map);
      onlineLabels.addTo(map);
      onlineLayer.on('tileerror', function () { goOffline('⚠️ 天地图加载失败，已切换离线矢量底图'); });
      onlineLabels.on('tileerror', function () { try { map.removeLayer(onlineLabels); } catch (e) {} });
    }

    // 离线矢量底图：俄罗斯轮廓 + 主要城市（无需联网，保证始终可见）
    if (window.RUSSIA_GEOJSON && window.RUSSIA_GEOJSON.features) {
      L.geoJSON(window.RUSSIA_GEOJSON, {
        style: { color: '#94a3b8', weight: 1, fillColor: '#e8eef6', fillOpacity: 1 },
        interactive: false
      }).addTo(offlineLayer);
    }
    (window.RUSSIAN_CITIES || []).forEach(function (c) {
      const m = L.circleMarker([c.lat, c.lng], {
        radius: c.major ? 4 : 3, color: '#4f46e5', weight: 1.5,
        fillColor: '#6366f1', fillOpacity: 1
      });
      m.bindTooltip(c.name, {
        permanent: !!c.major, direction: 'right', offset: [5, 0],
        className: 'city-tip' + (c.major ? ' city-major' : '')
      });
      m.addTo(offlineLayer);
    });

    // 矿山悬停浮层
    hoverEl = document.createElement('div');
    hoverEl.className = 'mine-hover';
    map.getContainer().appendChild(hoverEl);

    map.on('click', onMapClick);
    map.on('movestart', hideHover);
    map.on('zoomstart', hideHover);
  }

  /* 矿山光点颜色：存在故障维修中 -> 红；否则（含全部停机）-> 绿 */
  function mineColor(mine) {
    return mine.devices.some(function (d) { return d.status === 'fault'; }) ? 'red' : 'green';
  }

  function buildIcon(mine) {
    return L.divIcon({
      className: 'mine-marker',
      html: '<div class="pulse ' + mineColor(mine) + '"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function renderMarkers() {
    Object.keys(markers).forEach(function (id) { map.removeLayer(markers[id]); });
    markers = {};
    state.mines.forEach(function (mine) {
      const m = L.marker([mine.lat, mine.lng], { icon: buildIcon(mine) })
        .addTo(map);
      // 所有矿山均悬浮展示：名称 + 运行/停机/故障状态 + 故障点详情
      m.on('mouseover', function () { showHover(mine); });
      m.on('mouseout', hideHover);
      m.on('click', function (e) {
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        if (pickMode) return;            // 选点模式下不打开面板
        hideHover();
        openPanel(mine.id);
      });
      markers[mine.id] = m;
    });
  }

  /* 状态图标 */
  function statusIcon(st) {
    return st === 'running' ? '▶' : st === 'fault' ? '⚠' : '⏸';
  }

  /* 矿山悬停浮层：名称 + 全部设备（序列号 + 状态）+ 统计 */
  function buildHoverHTML(mine) {
    const color = mineColor(mine);
    const running = mine.devices.filter(function (d) { return d.status === 'running'; }).length;
    const stopped = mine.devices.filter(function (d) { return d.status === 'stopped'; }).length;
    const fault = mine.devices.filter(function (d) { return d.status === 'fault'; }).length;

    let html = '<div class="mh-title">' + esc(mine.name) + '</div>';
    html += '<div class="mh-status">';
    html += color === 'red'
      ? '<span class="mh-badge red">⚠ 存在故障</span>'
      : '<span class="mh-badge green">✓ 运行正常</span>';
    html += '</div>';

    // 设备列表：序列号 + 类型 + 状态（颜色/图标区分）
    html += '<div class="mh-dev-list">';
    mine.devices.forEach(function (d) {
      const s = STATUS[d.status];
      html += '<div class="mh-dev-row">';
      html += '  <span class="mh-dev-code" title="设备序列号">' + esc(d.code || '—') + '</span>';
      html += '  <span class="mh-dev-type">' + esc(d.type) + '</span>';
      html += '  <span class="mh-chip ' + s.cls + '">' + statusIcon(d.status) + ' ' + s.label + '</span>';
      html += '</div>';
      if (d.status === 'fault' && d.faults && d.faults.length) {
        html += '<div class="mh-dev-note">⚠ ' + esc(d.faults[0]) + (d.faults.length > 1 ? ' 等 ' + d.faults.length + ' 项' : '') + '</div>';
      } else if (d.status === 'stopped' && d.stopReason) {
        html += '<div class="mh-dev-note">⏸ ' + esc(d.stopReason) + '</div>';
      }
    });
    html += '</div>';

    html += '<div class="mh-divider"></div><div class="mh-stats">';
    html += '<span class="mh-stat running">运行中 ' + running + '</span>';
    html += '<span class="mh-stat stopped">停机中 ' + stopped + '</span>';
    if (fault) html += '<span class="mh-stat fault">故障中 ' + fault + '</span>';
    html += '</div>';

    return html;
  }
  function showHover(mine) {
    if (!hoverEl || !map) return;
    hoverEl.innerHTML = buildHoverHTML(mine);
    const pt = map.latLngToContainerPoint([mine.lat, mine.lng]);
    hoverEl.style.left = pt.x + 'px';
    hoverEl.style.top = pt.y + 'px';
    hoverEl.classList.add('show');
  }
  function hideHover() {
    if (hoverEl) hoverEl.classList.remove('show');
  }

  function onMapClick(e) {
    if (!pickMode) return;
    const lat = e.latlng.lat, lng = e.latlng.lng;
    if (pickMode.forNew) {
      exitPickMode();
      openMineModal(null, lat, lng);
    } else if (pickMode.mineId) {
      const mine = state.mines.find(function (x) { return x.id === pickMode.mineId; });
      if (mine) {
        mine.lat = lat; mine.lng = lng;
        save(); renderMarkers(); exitPickMode(); openPanel(mine.id);
        markDirty(); toast('位置已更新');
      }
    }
  }

  function enterPickMode(opts) {
    pickMode = opts;
    document.getElementById('pickBanner').classList.remove('hidden');
    document.getElementById('map').classList.add('pick-cursor');
  }
  function exitPickMode() {
    pickMode = null;
    document.getElementById('pickBanner').classList.add('hidden');
    document.getElementById('map').classList.remove('pick-cursor');
  }

  /* ---------- 详情面板 ---------- */
  const panel = document.getElementById('panel');

  function openPanel(mineId) {
    state.selectedId = mineId;
    renderPanel();
    panel.classList.add('show');
  }
  function closePanel() {
    state.selectedId = null;
    panel.classList.remove('show');
  }

  function renderPanel() {
    const mine = state.mines.find(function (x) { return x.id === state.selectedId; });
    if (!mine) return;

    const color = mineColor(mine);
    const total = mine.devices.length;
    const faultN = mine.devices.filter(function (d) { return d.status === 'fault'; }).length;

    let html = '';
    html += '<div class="panel-header">';
    html += '  <div><h2>' + esc(mine.name) + '</h2>';
    html += '  <div class="coords">📍 ' + mine.lat.toFixed(4) + ', ' + mine.lng.toFixed(4) + '</div></div>';
    html += '  <button class="icon-btn" id="closePanel" aria-label="关闭">×</button>';
    html += '</div>';

    html += '<div class="panel-status">';
    html += '  <span class="status-pill ' + color + '">' + (color === 'red' ? '⚠ 存在故障' : '✓ 运行正常') + '</span>';
    html += '  <span class="count">共 ' + total + ' 台设备' + (faultN ? '（故障 ' + faultN + '）' : '') + '</span>';
    html += '  <span class="legend-inline">';
    html += '    <span><i class="lg-dot run"></i>运行</span>';
    html += '    <span><i class="lg-dot stop"></i>停机</span>';
    html += '    <span><i class="lg-dot fault"></i>故障</span>';
    html += '  </span>';
    html += '</div>';

    html += '<div class="device-list">';
    if (total === 0) {
      html += '<div class="empty">暂无设备，点击下方按钮添加</div>';
    } else {
      mine.devices.forEach(function (d) {
        const s = STATUS[d.status];
        html += '<div class="device-card">';
        html += '  <div class="device-top"><span class="dev-type">' + esc(d.type) + '</span>';
        html += '    <span class="badge ' + s.cls + '">' + s.label + '</span></div>';
        if (d.code) html += '<div class="dev-code">序列号：' + esc(d.code) + '</div>';
        if (d.status === 'fault' && d.faults && d.faults.length) {
          html += '<div class="dev-fault"><b>故障详情：</b><ol class="fault-ol">';
          d.faults.forEach(function (f) { html += '<li>' + esc(f) + '</li>'; });
          html += '</ol></div>';
        } else if (d.status === 'stopped' && d.stopReason) {
          html += '<div class="dev-stop"><b>停机原因：</b>' + esc(d.stopReason) + '</div>';
        }
        html += '  <div class="device-actions">';
        html += '    <button class="btn-mini" data-edit-dev="' + d.id + '">编辑</button>';
        html += '    <button class="btn-mini danger" data-del-dev="' + d.id + '">删除</button>';
        html += '  </div>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="panel-footer">';
    html += '  <button class="btn btn-primary btn-block" id="addDeviceBtn">＋ 添加设备</button>';
    html += '  <div class="row">';
    html += '    <button class="btn btn-ghost" id="editMineBtn">编辑位置</button>';
    html += '    <button class="btn btn-danger" id="delMineBtn">删除矿山</button>';
    html += '  </div>';
    html += '</div>';

    panel.innerHTML = html;

    document.getElementById('closePanel').onclick = closePanel;
    document.getElementById('addDeviceBtn').onclick = function () { openDeviceModal(mine.id, null); };
    document.getElementById('editMineBtn').onclick = function () { openMineModal(mine.id); };
    document.getElementById('delMineBtn').onclick = function () { deleteMine(mine.id); };
    panel.querySelectorAll('[data-edit-dev]').forEach(function (b) {
      b.onclick = function () { openDeviceModal(mine.id, b.getAttribute('data-edit-dev')); };
    });
    panel.querySelectorAll('[data-del-dev]').forEach(function (b) {
      b.onclick = function () { deleteDevice(mine.id, b.getAttribute('data-del-dev')); };
    });
  }

  /* ---------- 矿山 弹窗 ---------- */
  const mineModal = document.getElementById('mineModal');
  let editingMineId = null;

  function openMineModal(mineId, lat, lng) {
    editingMineId = mineId || null;
    const mine = mineId ? state.mines.find(function (x) { return x.id === mineId; }) : null;
    document.getElementById('mineModalTitle').textContent = mine ? '编辑矿山' : '添加矿山';
    document.getElementById('mineName').value = mine ? mine.name : '';
    document.getElementById('mineLat').value = mine ? mine.lat : (lat != null ? lat.toFixed(5) : '');
    document.getElementById('mineLng').value = mine ? mine.lng : (lng != null ? lng.toFixed(5) : '');
    mineModal.classList.remove('hidden');
    setTimeout(function () { document.getElementById('mineName').focus(); }, 50);
  }
  function closeMineModal() { mineModal.classList.add('hidden'); editingMineId = null; }

  function saveMine() {
    const name = document.getElementById('mineName').value.trim();
    const lat = parseFloat(document.getElementById('mineLat').value);
    const lng = parseFloat(document.getElementById('mineLng').value);
    if (!name) { toast('请填写矿山名称'); return; }
    if (isNaN(lat) || isNaN(lng)) { toast('请填写有效的经纬度'); return; }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { toast('经纬度超出有效范围'); return; }

    let targetId;
    if (editingMineId) {
      const mine = state.mines.find(function (x) { return x.id === editingMineId; });
      mine.name = name; mine.lat = lat; mine.lng = lng;
      targetId = editingMineId;
    } else {
      const mine = { id: uid(), name: name, lat: lat, lng: lng, devices: [] };
      state.mines.push(mine);
      targetId = mine.id;
    }
    save(); renderMarkers(); closeMineModal(); markDirty(); toast('已保存');
    openPanel(targetId);
  }

  /* ---------- 设备 弹窗 ---------- */
  const deviceModal = document.getElementById('deviceModal');
  let devCtx = { mineId: null, deviceId: null };

  function openDeviceModal(mineId, deviceId) {
    devCtx = { mineId: mineId, deviceId: deviceId || null };
    const mine = state.mines.find(function (x) { return x.id === mineId; });
    const dev = deviceId ? mine.devices.find(function (d) { return d.id === deviceId; }) : null;
    document.getElementById('deviceModalTitle').textContent = dev ? '编辑设备' : '添加设备';
    document.getElementById('devCode').value = dev ? (dev.code || '') : '';
    document.getElementById('devType').value = dev ? dev.type : '钻机';
    document.getElementById('devStatus').value = dev ? dev.status : 'running';
    // 故障点列表
    faultPoints = dev ? (dev.faults ? dev.faults.slice() : []) : [];
    document.getElementById('devStopReason').value = dev ? (dev.stopReason || '') : '';
    toggleStatusFields();
    deviceModal.classList.remove('hidden');
  }

  /* 分点故障编辑器：逐条添加 / 编辑 / 删除 */
  function renderFaultEditor() {
    const wrap = document.getElementById('faultList');
    wrap.innerHTML = '';
    if (faultPoints.length === 0) {
      wrap.innerHTML = '<div class="fault-empty">暂无故障点，点击下方按钮添加</div>';
    }
    faultPoints.forEach(function (text, i) {
      const row = document.createElement('div');
      row.className = 'fault-point-row';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '故障点 ' + (i + 1) + '：如 主轴承过热';
      input.value = text;
      input.addEventListener('input', function () { faultPoints[i] = input.value; });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'fault-del';
      del.textContent = '×';
      del.title = '删除该故障点';
      del.addEventListener('click', function () { faultPoints.splice(i, 1); renderFaultEditor(); });
      row.appendChild(input);
      row.appendChild(del);
      wrap.appendChild(row);
    });
  }
  function toggleStatusFields() {
    const st = document.getElementById('devStatus').value;
    document.getElementById('faultField').classList.toggle('hidden', st !== 'fault');
    document.getElementById('stopField').classList.toggle('hidden', st !== 'stopped');
    if (st === 'fault') {
      if (faultPoints.length === 0) faultPoints.push('');
      renderFaultEditor();
    }
  }
  function closeDeviceModal() { deviceModal.classList.add('hidden'); devCtx = { mineId: null, deviceId: null }; }

  function saveDevice() {
    const type = document.getElementById('devType').value;
    const code = document.getElementById('devCode').value.trim();
    const status = document.getElementById('devStatus').value;
    const stopReason = document.getElementById('devStopReason').value.trim();
    const faults = faultPoints.map(function (f) { return f.trim(); }).filter(function (f) { return f; });
    if (status === 'fault' && faults.length === 0) { toast('故障状态下请至少填写一个故障点'); return; }

    const mine = state.mines.find(function (x) { return x.id === devCtx.mineId; });
    if (!mine) return;
    if (devCtx.deviceId) {
      const dev = mine.devices.find(function (d) { return d.id === devCtx.deviceId; });
      dev.type = type; dev.code = code; dev.status = status;
      dev.faults = status === 'fault' ? faults : [];
      dev.stopReason = status === 'stopped' ? stopReason : '';
    } else {
      mine.devices.push({
        id: uid(), code: code, type: type, status: status,
        faults: status === 'fault' ? faults : [],
        stopReason: status === 'stopped' ? stopReason : ''
      });
    }
    save(); renderMarkers(); renderPanel(); closeDeviceModal(); markDirty(); toast('已保存');
  }

  function deleteDevice(mineId, deviceId) {
    const mine = state.mines.find(function (x) { return x.id === mineId; });
    mine.devices = mine.devices.filter(function (d) { return d.id !== deviceId; });
    save(); renderMarkers(); renderPanel(); markDirty(); toast('设备已删除');
  }

  function deleteMine(mineId) {
    if (!window.confirm('确定删除该矿山及其全部设备？')) return;
    state.mines = state.mines.filter(function (x) { return x.id !== mineId; });
    save(); renderMarkers(); closePanel(); markDirty(); toast('矿山已删除');
  }

  /* ---------- 轻提示 ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2000);
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    document.getElementById('addMineBtn').onclick = function () { enterPickMode({ forNew: true }); };
    document.getElementById('cancelPick').onclick = exitPickMode;
    document.getElementById('saveMineBtn').onclick = saveMine;
    document.getElementById('saveDeviceBtn').onclick = saveDevice;
    document.getElementById('exportBtn').onclick = exportShareFile;
    document.getElementById('pickOnMap').onclick = function () {
      closeMineModal();
      const back = editingMineId; // 可能为 null（新建）或某矿山 id（编辑）
      enterPickMode({ forNew: back === null, mineId: back || undefined });
    };
    document.getElementById('devStatus').onchange = toggleStatusFields;
    document.getElementById('addFaultBtn').onclick = function () { faultPoints.push(''); renderFaultEditor(); };

    document.querySelectorAll('[data-close]').forEach(function (b) {
      b.onclick = function () { mineModal.classList.add('hidden'); deviceModal.classList.add('hidden'); };
    });
    mineModal.addEventListener('click', function (e) { if (e.target === mineModal) mineModal.classList.add('hidden'); });
    deviceModal.addEventListener('click', function (e) { if (e.target === deviceModal) deviceModal.classList.add('hidden'); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        mineModal.classList.add('hidden'); deviceModal.classList.add('hidden');
        if (pickMode) exitPickMode();
      }
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    const mapEl = document.getElementById('map');
    if (typeof L === 'undefined') {
      mapEl.innerHTML = '<div class="map-error">地图组件加载失败，请检查网络连接（需要加载 Leaflet 与地图瓦片）。</div>';
    } else {
      initMap();
    }
    load();
    if (map) renderMarkers();
    bind();
    updateDirtyBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
