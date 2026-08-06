'use strict';
const fs = require('fs');
const path = 'C:/Users/17605/WorkBuddy/2026-07-17-13-41-01/mine-monitor/矿山设备监控系统.html';
let s = fs.readFileSync(path, 'utf8');

/* ---------- 1) i18n 基础设施注入（紧跟 'use strict';） ---------- */
const INFRA = `
  /* ===== i18n：zh / ru / en（仅翻译界面文案，矿山名/设备编号/故障描述等数据保持原样） ===== */
  const I18N = {
    zh: {
      app_title:'俄罗斯井下设备状态监控', app_sub:'矿山位置与设备运行状态实时看板',
      dirty_yes:'● 有改动，待导出', dirty_no:'✓ 已导出最新',
      kb_btn:'维修知识库', add_mine:'添加矿山', export_btn:'导出分享',
      offline_mode:'离线模式（矢量底图）',
      ov_title:'设备状态总览', ov_fab:'设备总览',
      ft_title:'故障汇总 · 修复追踪', ft_fab:'故障汇总',
      pick_hint:'点击地图选择矿山位置', cancel:'取消',
      legend_title:'矿山状态', legend_ok:'全部正常 / 停机', legend_fault:'存在故障设备',
      bm_title:'底图', bm_osm:'在线', bm_offline:'离线', bm_tdt:'天地图',
      bm_token_ph:'天地图 token（选天地图时填）',
      bm_hint:'天地图为国内可访问底图，需免费 token：tianditu.gov.cn 申请',
      mine_title_new:'添加矿山', mine_title_edit:'编辑矿山',
      f_mine_name:'矿山名称', f_lat:'纬度 (Lat)', f_lng:'经度 (Lng)', pick_map:'🗺️ 在地图上选取位置', save:'保存',
      dev_title:'编辑设备', dev_title_new:'添加设备', dev_title_edit:'编辑设备',
      f_code:'设备序列号', f_type:'设备类型', f_status:'运行状态',
      st_running:'运行中', st_fault:'故障维修中', st_stopped:'停机中',
      f_fault_desc:'故障描述（可分点填写）', add_fault:'添加故障点', f_stop_reason:'停机原因（可选，自由填写）',
      arc_basic:'基本信息', arc_model:'设备型号', arc_customer:'客户', arc_delivery:'交付日期',
      arc_runhours:'累计运行（小时）', arc_warranty:'质保状态',
      war_in:'质保内', war_out:'已过保', war_unknown:'未知',
      arc_wuntil:'质保截止日期', arc_vin:'VIN 部件档案（型号 + 序列号）',
      comp_engine:'发动机', comp_comp:'空压机', comp_axle:'驱动桥', comp_trans:'变速箱',
      ph_model:'型号', ph_sn:'序列号',
      arc_title:'设备电子档案 · ', close:'关闭', arc_edit:'编辑档案', arc_print:'打印 / 存为 PDF',
      kb_title:'在线维修知识库', kb_search_ph:'搜索标题 / 标签 / 备注……', kb_upload:'⬆ 上传维修指引',
      kb_folder_info:'ℹ️ 资料当前存于浏览器本地库。', kb_link_folder:'📁 关联到单独文件夹（便于备份/分享）',
      kb_meta_title:'补充文件信息', m_title:'标题', m_tags:'标签（用逗号分隔）', m_type:'关联设备类型（可选）',
      m_type_none:'未分类', m_note:'备注（可选）', kb_meta_save:'保存到知识库', preview_dl:'⬇ 下载',
      sum_running:'运行中', sum_fault:'故障', sum_stop:'停机',
      ov_empty:'暂无矿山数据', dev_online:'在线', dev_fault:'故障', dev_stop:'停机',
      ft_open:'未修复', ft_done:'已修复', ft_total:'故障总数', ft_empty:'🎉 暂无故障记录',
      ft_fix:'✓ 故障已修复', ft_undo:'↺ 撤销修复',
      mh_fault:'⚠ 存在故障', mh_ok:'✓ 运行正常',
      map_error:'地图组件加载失败，请检查网络连接（需要加载 Leaflet 与地图瓦片）。',
      panel_sn:'序列号：', panel_fault_detail:'故障详情：', panel_stop_reason:'停机原因：',
      panel_fixed_hist:'✓ 已修复历史', panel_items:'项', panel_view_arc:'📇 查看档案',
      edit:'编辑', delete:'删除', add_device:'＋ 添加设备', edit_loc:'编辑位置', del_mine:'删除矿山',
      toast_tdt_token:'请先在左下角底图面板填入天地图 token', toast_fixed:'已标记修复，并记录修复时间',
      toast_undone:'已撤销修复', toast_loc_updated:'位置已更新', toast_saved:'已保存', toast_dev_del:'设备已删除',
      arc_fault_rec:'故障与维修记录', arc_recorded:'录入', kb_click_preview:'点击预览', kb_type_all:'全部设备类型'
    },
    ru: {
      app_title:'Система мониторинга подземного горного оборудования', app_sub:'Панель реального времени: местоположение шахт и статус оборудования',
      dirty_yes:'● Есть изменения, нужен экспорт', dirty_no:'✓ Экспортировано (актуально)',
      kb_btn:'База знаний ремонта', add_mine:'Добавить шахту', export_btn:'Экспорт / Поделиться',
      offline_mode:'Автономный режим (векторная карта)',
      ov_title:'Обзор статуса оборудования', ov_fab:'Обзор',
      ft_title:'Сводка аварий · отслеживание', ft_fab:'Аварии',
      pick_hint:'Нажмите на карту для выбора шахты', cancel:'Отмена',
      legend_title:'Статус шахты', legend_ok:'Все в норме / остановлено', legend_fault:'Есть аварийное оборудование',
      bm_title:'Карта', bm_osm:'Онлайн', bm_offline:'Автономно', bm_tdt:'Tianditu',
      bm_token_ph:'Токен Tianditu (при выборе)',
      bm_hint:'Tianditu — карта для Китая, нужен бесплатный токен: tianditu.gov.cn',
      mine_title_new:'Добавить шахту', mine_title_edit:'Редактировать шахту',
      f_mine_name:'Название шахты', f_lat:'Широта (Lat)', f_lng:'Долгота (Lng)', pick_map:'🗺️ Выбрать на карте', save:'Сохранить',
      dev_title:'Редактировать оборудование', dev_title_new:'Добавить оборудование', dev_title_edit:'Редактировать оборудование',
      f_code:'Серийный номер', f_type:'Тип оборудования', f_status:'Статус',
      st_running:'Работает', st_fault:'Аварийный ремонт', st_stopped:'Остановлено',
      f_fault_desc:'Описание неисправности (по пунктам)', add_fault:'Добавить неисправность', f_stop_reason:'Причина остановки (необязательно)',
      arc_basic:'Основное', arc_model:'Модель', arc_customer:'Клиент', arc_delivery:'Дата поставки',
      arc_runhours:'Наработка (часы)', arc_warranty:'Гарантия',
      war_in:'На гарантии', war_out:'Гарантия истекла', war_unknown:'Неизвестно',
      arc_wuntil:'Гарантия до', arc_vin:'VIN-компоненты (модель + серийный №)',
      comp_engine:'Двигатель', comp_comp:'Компрессор', comp_axle:'Ведущий мост', comp_trans:'Коробка передач',
      ph_model:'Модель', ph_sn:'Серийный №',
      arc_title:'Электронный паспорт · ', close:'Закрыть', arc_edit:'Редактировать паспорт', arc_print:'Печать / PDF',
      kb_title:'Онлайн-база знаний ремонта', kb_search_ph:'Поиск по заголовку / тегам / примечаниям……', kb_upload:'⬆ Загрузить руководство',
      kb_folder_info:'ℹ️ Данные хранятся в локальной базе браузера.', kb_link_folder:'📁 Связать с папкой (бэкап/обмен)',
      kb_meta_title:'Доп. информация о файле', m_title:'Заголовок', m_tags:'Теги (через запятую)', m_type:'Тип оборудования (необяз.)',
      m_type_none:'Без категории', m_note:'Примечание (необяз.)', kb_meta_save:'Сохранить в базу', preview_dl:'⬇ Скачать',
      sum_running:'Работает', sum_fault:'Авария', sum_stop:'Остановлено',
      ov_empty:'Нет данных о шахтах', dev_online:'Онлайн', dev_fault:'Авария', dev_stop:'Остановлено',
      ft_open:'Не устранено', ft_done:'Устранено', ft_total:'Всего аварий', ft_empty:'🎉 Нет записей об авариях',
      ft_fix:'✓ Авария устранена', ft_undo:'↺ Отменить устранение',
      mh_fault:'⚠ Есть авария', mh_ok:'✓ В норме',
      map_error:'Ошибка загрузки карты. Проверьте подключение к сети (нужны Leaflet и тайлы).',
      panel_sn:'Серийный №: ', panel_fault_detail:'Детали аварии: ', panel_stop_reason:'Причина остановки: ',
      panel_fixed_hist:'✓ История устранений', panel_items:'шт.', panel_view_arc:'📇 Паспорт',
      edit:'Изменить', delete:'Удалить', add_device:'＋ Добавить оборудование', edit_loc:'Изменить место', del_mine:'Удалить шахту',
      toast_tdt_token:'Сначала введите токен Tianditu в панели карты', toast_fixed:'Отмечено как устранённое, время записано',
      toast_undone:'Устранение отменено', toast_loc_updated:'Местоположение обновлено', toast_saved:'Сохранено', toast_dev_del:'Оборудование удалено',
      arc_fault_rec:'Записи аварий и ремонта', arc_recorded:'Добавлено', kb_click_preview:'Нажмите для просмотра', kb_type_all:'Все типы'
    },
    en: {
      app_title:'Underground Mining Equipment Monitor', app_sub:'Real-time dashboard: mine locations & equipment status',
      dirty_yes:'● Unsaved changes, export pending', dirty_no:'✓ Exported, up to date',
      kb_btn:'Maintenance KB', add_mine:'Add Mine', export_btn:'Export / Share',
      offline_mode:'Offline mode (vector map)',
      ov_title:'Equipment Status Overview', ov_fab:'Overview',
      ft_title:'Fault Summary · Repair Tracking', ft_fab:'Faults',
      pick_hint:'Click the map to choose mine location', cancel:'Cancel',
      legend_title:'Mine status', legend_ok:'All normal / stopped', legend_fault:'Faulty equipment present',
      bm_title:'Basemap', bm_osm:'Online', bm_offline:'Offline', bm_tdt:'Tianditu',
      bm_token_ph:'Tianditu token (fill when selected)',
      bm_hint:'Tianditu is accessible in China; free token required: tianditu.gov.cn',
      mine_title_new:'Add Mine', mine_title_edit:'Edit Mine',
      f_mine_name:'Mine name', f_lat:'Latitude (Lat)', f_lng:'Longitude (Lng)', pick_map:'🗺️ Pick on map', save:'Save',
      dev_title:'Edit Equipment', dev_title_new:'Add Equipment', dev_title_edit:'Edit Equipment',
      f_code:'Serial No.', f_type:'Equipment type', f_status:'Status',
      st_running:'Running', st_fault:'Fault repair', st_stopped:'Stopped',
      f_fault_desc:'Fault description (point by point)', add_fault:'Add fault', f_stop_reason:'Stop reason (optional)',
      arc_basic:'Basic info', arc_model:'Model', arc_customer:'Customer', arc_delivery:'Delivery date',
      arc_runhours:'Total run hours', arc_warranty:'Warranty',
      war_in:'In warranty', war_out:'Out of warranty', war_unknown:'Unknown',
      arc_wuntil:'Warranty until', arc_vin:'VIN Parts (model + serial)',
      comp_engine:'Engine', comp_comp:'Air compressor', comp_axle:'Drive axle', comp_trans:'Transmission',
      ph_model:'Model', ph_sn:'Serial',
      arc_title:'Equipment E-Archive · ', close:'Close', arc_edit:'Edit archive', arc_print:'Print / Save PDF',
      kb_title:'Online Maintenance KB', kb_search_ph:'Search title / tags / notes……', kb_upload:'⬆ Upload guide',
      kb_folder_info:'ℹ️ Files are stored in the browser local library.', kb_link_folder:'📁 Link to a folder (backup/share)',
      kb_meta_title:'File info', m_title:'Title', m_tags:'Tags (comma separated)', m_type:'Related type (optional)',
      m_type_none:'Uncategorized', m_note:'Note (optional)', kb_meta_save:'Save to KB', preview_dl:'⬇ Download',
      sum_running:'Running', sum_fault:'Fault', sum_stop:'Stopped',
      ov_empty:'No mine data yet', dev_online:'Online', dev_fault:'Fault', dev_stop:'Stopped',
      ft_open:'Open', ft_done:'Fixed', ft_total:'Total faults', ft_empty:'🎉 No fault records',
      ft_fix:'✓ Fault fixed', ft_undo:'↺ Undo fix',
      mh_fault:'⚠ Faulty', mh_ok:'✓ Normal',
      map_error:'Map component failed to load. Check network (Leaflet & tiles required).',
      panel_sn:'Serial: ', panel_fault_detail:'Fault details: ', panel_stop_reason:'Stop reason: ',
      panel_fixed_hist:'✓ Fixed history', panel_items:'items', panel_view_arc:'📇 View archive',
      edit:'Edit', delete:'Delete', add_device:'＋ Add equipment', edit_loc:'Edit location', del_mine:'Delete mine',
      toast_tdt_token:'Enter Tianditu token in the basemap panel first', toast_fixed:'Marked fixed, time recorded',
      toast_undone:'Fix undone', toast_loc_updated:'Location updated', toast_saved:'Saved', toast_dev_del:'Device deleted',
      arc_fault_rec:'Fault & repair records', arc_recorded:'Recorded', kb_click_preview:'Click to preview', kb_type_all:'All types'
    }
  };
  const TYPE_DEFS = [
    { zh:'干喷车', ru:'Сухая штукатурная машина', en:'Dry sprayer' },
    { zh:'铵油车', ru:'АНФО-зарядная машина', en:'ANFO truck' },
    { zh:'矿卡', ru:'Карьерный самосвал', en:'Mining truck' },
    { zh:'铲运机', ru:'ПДМ (погрузочно-доставочная)', en:'LHD' },
    { zh:'平地机', ru:'Грейдер', en:'Grader' },
    { zh:'凿岩台车', ru:'Буровая установка', en:'Drilling rig' },
    { zh:'撬毛台车', ru:'Машина для оборки кровли', en:'Scaling rig' },
    { zh:'其他', ru:'Другое', en:'Other' },
    { zh:'钻机', ru:'Буровой станок', en:'Drill' },
    { zh:'运输车', ru:'Транспортная машина', en:'Haul truck' },
    { zh:'通风设备', ru:'Вентиляционное оборудование', en:'Ventilation equipment' },
    { zh:'泵站', ru:'Насосная станция', en:'Pump station' },
    { zh:'提升机', ru:'Подъёмник', en:'Hoist' },
    { zh:'掘进机', ru:'Проходческий комбайн', en:'Roadheader' }
  ];
  let currentLang = (function(){ try { return localStorage.getItem('mine-lang') || 'zh'; } catch(e){ return 'zh'; } })();
  function t(key) {
    const d = I18N[currentLang] || I18N.zh;
    return (d && d[key] != null) ? d[key] : ((I18N.zh[key] != null) ? I18N.zh[key] : key);
  }
  function statusLabel(st) { return t('st_' + st); }
  function typeLabel(zh) {
    const d = TYPE_DEFS.find(function(x){ return x.zh === zh; });
    if (!d) return zh;
    return d[currentLang] || d.zh;
  }
  function setLang(l) {
    currentLang = l;
    try { localStorage.setItem('mine-lang', l); } catch(e){}
    applyI18n();
  }
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function(el){ const k = el.getAttribute('data-i18n'); if (k) el.textContent = t(k); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ const k = el.getAttribute('data-i18n-ph'); if (k) el.setAttribute('placeholder', t(k)); });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){ const k = el.getAttribute('data-i18n-title'); if (k) el.setAttribute('title', t(k)); });
    repopulateSelects();
    updateDirtyBadge();
    if (typeof renderOverview === 'function') renderOverview();
    if (typeof renderFaultTable === 'function') renderFaultTable();
    if (typeof renderPanel === 'function' && !panelHidden()) renderPanel();
  }
  function repopulateSelects() {
    const ss = document.getElementById('devStatus');
    if (ss) {
      let h = '';
      ['running','fault','stopped'].forEach(function(k){ h += '<option value="'+k+'">'+t('st_'+k)+'</option>'; });
      ss.innerHTML = h;
    }
    const aw = document.getElementById('arcWarranty');
    if (aw) {
      let h = '';
      [['in','war_in'],['out','war_out'],['unknown','war_unknown']].forEach(function(p){ h += '<option value="'+p[0]+'">'+t(p[1])+'</option>'; });
      aw.innerHTML = h;
    }
    ['devType','kbTypeFilter','kbMetaType'].forEach(function(id){
      const sel = document.getElementById(id);
      if (!sel) return;
      let h = '';
      if (id === 'kbTypeFilter') h += '<option value="">'+t('kb_type_all')+'</option>';
      if (id === 'kbMetaType') h += '<option value="">'+t('m_type_none')+'</option>';
      TYPE_DEFS.forEach(function(td){ h += '<option value="'+td.zh+'">'+td[currentLang]+'</option>'; });
      if (id === 'kbTypeFilter') h += '<option value="__none__">'+t('m_type_none')+'</option>';
      if (id === 'kbMetaType') h += '<option value="__none__">'+t('m_type_none')+'</option>';
      sel.innerHTML = h;
    });
  }
  function bindLangSwitch() {
    const box = document.getElementById('langSwitch');
    if (!box) return;
    box.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang') === currentLang);
      b.onclick = function(){ setLang(b.getAttribute('data-lang')); bindLangSwitch(); };
    });
  }
`;

s = s.replace("  'use strict';", "  'use strict';\n" + INFRA);

/* ---------- 2) 顶栏语言切换器 HTML ---------- */
const EXPORT_BTN = `<button id="exportBtn" class="btn btn-ghost"><svg class="ico" viewBox="0 0 24 24"><path d="M12 3v12"></path><path d="m7 11 5 4 5-4"></path><path d="M5 21h14"></path></svg>导出分享</button>`;
const SWITCH = `<div class="lang-switch" id="langSwitch"><button data-lang="zh" class="active">中文</button><button data-lang="ru">RU</button><button data-lang="en">EN</button></div>\n    </div>`;
s = s.replace(EXPORT_BTN + "\n    </div>", EXPORT_BTN + "\n" + SWITCH);

/* ---------- 3) 切换器 CSS（插入到“地图”样式段之前） ---------- */
const LANG_CSS = `.lang-switch { display: inline-flex; gap: 2px; background: rgba(255,255,255,.14); border: 1px solid rgba(147,197,253,.45); border-radius: 9px; padding: 2px; }
.lang-switch button { border: none; background: transparent; color: #eaf2ff; font-size: 12px; font-weight: 700; padding: 4px 9px; border-radius: 7px; cursor: pointer; transition: background .15s ease, color .15s ease; }
.lang-switch button:hover { background: rgba(255,255,255,.18); }
.lang-switch button.active { background: linear-gradient(160deg,#2563eb,#0c66a8); color: #fff; box-shadow: 0 2px 8px rgba(8,15,35,.3); }
@media (max-width: 768px) { .lang-switch button { padding: 3px 7px; font-size: 11px; } }\n\n`;
s = s.replace("/* ============ 地图 ============ */", LANG_CSS + "/* ============ 地图 ============ */");

/* ---------- 4) 静态 HTML 文案 → data-i18n 包裹 ---------- */
const STAT = [
  [`>俄罗斯井下设备状态监控</h1>`, `><span data-i18n="app_title">俄罗斯井下设备状态监控</span></h1>`],
  [`>矿山位置与设备运行状态实时看板</p>`, `><span data-i18n="app_sub">矿山位置与设备运行状态实时看板</span></p>`],
  [`>✓ 已导出最新</span>`, `><span data-i18n="dirty_no">✓ 已导出最新</span>`],
  [`>维修知识库</button>`, `><span data-i18n="kb_btn">维修知识库</span></button>`],
  [`>添加矿山</button>`, `><span data-i18n="add_mine">添加矿山</span></button>`],
  [`>导出分享</button>`, `><span data-i18n="export_btn">导出分享</span></button>`],
  [`>离线模式（矢量底图）</div>`, `><span data-i18n="offline_mode">离线模式（矢量底图）</span></div>`],
  [`>设备状态总览</div>`, `><span data-i18n="ov_title">设备状态总览</span></div>`],
  [`>设备总览</button>`, `><span data-i18n="ov_fab">设备总览</span></button>`],
  [`>故障汇总 · 修复追踪</div>`, `><span data-i18n="ft_title">故障汇总 · 修复追踪</span></div>`],
  [`>故障汇总</button>`, `><span data-i18n="ft_fab">故障汇总</span></button>`],
  [`>点击地图选择矿山位置</span>`, `><span data-i18n="pick_hint">点击地图选择矿山位置</span></span>`],
  [`>取消</button>`, `><span data-i18n="cancel">取消</span></button>`],
  [`>矿山状态</div>`, `><span data-i18n="legend_title">矿山状态</span></div>`],
  [`>全部正常 / 停机</div>`, `><span data-i18n="legend_ok">全部正常 / 停机</span></div>`],
  [`>存在故障设备</div>`, `><span data-i18n="legend_fault">存在故障设备</span></div>`],
  [`>底图</div>`, `><span data-i18n="bm_title">底图</span></div>`],
  [`>在线</button>`, `><span data-i18n="bm_osm">在线</span></button>`],
  [`>离线</button>`, `><span data-i18n="bm_offline">离线</span></button>`],
  [`>天地图</button>`, `><span data-i18n="bm_tdt">天地图</span></button>`],
  [`placeholder="天地图 token（选天地图时填）"`, `placeholder="天地图 token（选天地图时填）" data-i18n-ph="bm_token_ph"`],
  [`>天地图为国内可访问底图，需免费 token：tianditu.gov.cn 申请</div>`, `><span data-i18n="bm_hint">天地图为国内可访问底图，需免费 token：tianditu.gov.cn 申请</span></div>`],
  [`>矿山名称</span>`, `><span data-i18n="f_mine_name">矿山名称</span>`],
  [`>纬度 (Lat)</span>`, `><span data-i18n="f_lat">纬度 (Lat)</span>`],
  [`>经度 (Lng)</span>`, `><span data-i18n="f_lng">经度 (Lng)</span>`],
  [`>🗺️ 在地图上选取位置</button>`, `><span data-i18n="pick_map">🗺️ 在地图上选取位置</span></button>`],
  [`>保存</button>`, `><span data-i18n="save">保存</span></button>`],
  [`>设备序列号</span>`, `><span data-i18n="f_code">设备序列号</span>`],
  [`>设备类型</span>`, `><span data-i18n="f_type">设备类型</span>`],
  [`>运行状态</span>`, `><span data-i18n="f_status">运行状态</span>`],
  [`>故障描述（可分点填写）</span>`, `><span data-i18n="f_fault_desc">故障描述（可分点填写）</span>`],
  [`>添加故障点</button>`, `><span data-i18n="add_fault">添加故障点</span></button>`],
  [`>停机原因（可选，自由填写）</span>`, `><span data-i18n="f_stop_reason">停机原因（可选，自由填写）</span>`],
  [`>电子档案 · 基本信息</div>`, `><span data-i18n="arc_basic">电子档案 · 基本信息</span></div>`],
  [`>设备型号</span>`, `><span data-i18n="arc_model">设备型号</span>`],
  [`>客户</span>`, `><span data-i18n="arc_customer">客户</span>`],
  [`>交付日期</span>`, `><span data-i18n="arc_delivery">交付日期</span>`],
  [`>累计运行（小时）</span>`, `><span data-i18n="arc_runhours">累计运行（小时）</span>`],
  [`>质保状态</span>`, `><span data-i18n="arc_warranty">质保状态</span>`],
  [`>质保截止日期</span>`, `><span data-i18n="arc_wuntil">质保截止日期</span>`],
  [`>VIN 部件档案（型号 + 序列号）</div>`, `><span data-i18n="arc_vin">VIN 部件档案（型号 + 序列号）</span></div>`],
  [`>发动机</div>`, `><span data-i18n="comp_engine">发动机</span></div>`],
  [`>空压机</div>`, `><span data-i18n="comp_comp">空压机</span></div>`],
  [`>驱动桥</div>`, `><span data-i18n="comp_axle">驱动桥</span></div>`],
  [`>变速箱</div>`, `><span data-i18n="comp_trans">变速箱</span></div>`],
  [`placeholder="型号"`, `placeholder="型号" data-i18n-ph="ph_model"`],
  [`placeholder="序列号"`, `placeholder="序列号" data-i18n-ph="ph_sn"`],
  [`>关闭</button>`, `><span data-i18n="close">关闭</span></button>`],
  [`>编辑档案</button>`, `><span data-i18n="arc_edit">编辑档案</span></button>`],
  [`>打印 / 存为 PDF</button>`, `><span data-i18n="arc_print">打印 / 存为 PDF</span></button>`],
  [`>在线维修知识库</h2>`, `><span data-i18n="kb_title">在线维修知识库</span></h2>`],
  [`placeholder="搜索标题 / 标签 / 备注……"`, `placeholder="搜索标题 / 标签 / 备注……" data-i18n-ph="kb_search_ph"`],
  [`>⬆ 上传维修指引</button>`, `><span data-i18n="kb_upload">⬆ 上传维修指引</span></button>`],
  [`>ℹ️ 资料当前存于浏览器本地库。`, `><span data-i18n="kb_folder_info">ℹ️ 资料当前存于浏览器本地库。</span>`],
  [`>📁 关联到单独文件夹（便于备份/分享）</button>`, `><span data-i18n="kb_link_folder">📁 关联到单独文件夹（便于备份/分享）</span></button>`],
  [`<h2>补充文件信息</h2>`, `<h2><span data-i18n="kb_meta_title">补充文件信息</span></h2>`],
  [`>标题</span>`, `><span data-i18n="m_title">标题</span>`],
  [`>标签（用逗号分隔）</span>`, `><span data-i18n="m_tags">标签（用逗号分隔）</span>`],
  [`>关联设备类型（可选）</span>`, `><span data-i18n="m_type">关联设备类型（可选）</span>`],
  [`>备注（可选）</span>`, `><span data-i18n="m_note">备注（可选）</span>`],
  [`>保存到知识库</button>`, `><span data-i18n="kb_meta_save">保存到知识库</span></button>`],
  [`>⬇ 下载</button>`, `><span data-i18n="preview_dl">⬇ 下载</span></button>`]
];
STAT.forEach(function(p){ s = s.split(p[0]).join(p[1]); });

/* ---------- 5) 动态 JS 文案 → t() / 枚举 ---------- */
const DYN = [
  // 状态码 → key
  [`s.label`, `statusLabel(d.status)`],
  // 总览统计标签
  [`ov-sum-lbl">运行中</div>`, `ov-sum-lbl">' + t('sum_running') + '</div>`],
  [`ov-sum-lbl">故障</div>`, `ov-sum-lbl">' + t('sum_fault') + '</div>`],
  [`ov-sum-lbl">停机</div>`, `ov-sum-lbl">' + t('sum_stop') + '</div>`],
  [`'<div class="ov-empty">暂无矿山数据</div>'`, `'<div class="ov-empty">' + t('ov_empty') + '</div>'`],
  // labelOf
  [`return st === 'running' ? '在线' : st === 'fault' ? '故障' : '停机';`, `return st === 'running' ? t('dev_online') : st === 'fault' ? t('dev_fault') : t('dev_stop');`],
  // 故障汇总标签
  [`ft-sum-lbl">未修复</div>`, `ft-sum-lbl">' + t('ft_open') + '</div>`],
  [`ft-sum-lbl">已修复</div>`, `ft-sum-lbl">' + t('ft_done') + '</div>`],
  [`ft-sum-lbl">故障总数</div>`, `ft-sum-lbl">' + t('ft_total') + '</div>`],
  [`'<div class="ft-empty">🎉 暂无故障记录</div>'`, `'<div class="ft-empty">' + t('ft_empty') + '</div>'`],
  // 故障行按钮
  [`>✓ 故障已修复</button>`, `>' + t('ft_fix') + '</button>`],
  [`>↺ 撤销修复</button>`, `>' + t('ft_undo') + '</button>`],
  // 悬停浮层
  [`>⚠ 存在故障</span>`, `>' + t('mh_fault') + '</span>`],
  [`>✓ 运行正常</span>`, `>' + t('mh_ok') + '</span>`],
  [`>运行中 `, `>' + t('sum_running') + ' `],
  [`>停机中 `, `>' + t('sum_stop') + ' `],
  [`>故障中 `, `>' + t('sum_fault') + ' `],
  // 地图加载失败
  [`'<div class="map-error">地图组件加载失败，请检查网络连接（需要加载 Leaflet 与地图瓦片）。</div>'`, `'<div class="map-error">' + t('map_error') + '</div>'`],
  // 设备详情面板
  [`(color === 'red' ? '⚠ 存在故障' : '✓ 运行正常')`, `(color === 'red' ? t('mh_fault') : t('mh_ok'))`],
  [`><i class="lg-dot run"></i>运行</span>`, `><i class="lg-dot run"></i>' + t('sum_running') + '</span>`],
  [`><i class="lg-dot stop"></i>停机</span>`, `><i class="lg-dot stop"></i>' + t('sum_stop') + '</span>`],
  [`><i class="lg-dot fault"></i>故障</span>`, `><i class="lg-dot fault"></i>' + t('sum_fault') + '</span>`],
  [`'<span class="dev-type">' + esc(d.type) + '</span>'`, `'<span class="dev-type">' + esc(typeLabel(d.type)) + '</span>'`],
  [`'序列号：'`, `t('panel_sn') + '`],
  [`'<b>故障详情：</b>'`, `'<b>' + t('panel_fault_detail') + '</b>'`],
  [`'<b>停机原因：</b>'`, `'<b>' + t('panel_stop_reason') + '</b>'`],
  [`'<div class="dev-fixed-note">✓ 已修复历史 ' + fxp.length + ' 项</div>'`, `'<div class="dev-fixed-note">' + t('panel_fixed_hist') + ' ' + fxp.length + ' ' + t('panel_items') + '</div>'`],
  [`>📇 查看档案</button>`, `>' + t('panel_view_arc') + '</button>`],
  [`>编辑</button>`, `>' + t('edit') + '</button>`],
  [`>删除</button>`, `>' + t('delete') + '</button>`],
  [`>＋ 添加设备</button>`, `>' + t('add_device') + '</button>`],
  [`>编辑位置</button>`, `>' + t('edit_loc') + '</button>`],
  [`>删除矿山</button>`, `>' + t('del_mine') + '</button>`],
  // dirtyBadge
  [`'● 有改动，待导出'`, `t('dirty_yes')`],
  [`'✓ 已导出最新'`, `t('dirty_no')`],
  // toasts
  [`toast('请先在左下角底图面板填入天地图 token')`, `toast(t('toast_tdt_token'))`],
  [`toast(fixed ? '已标记修复，并记录修复时间' : '已撤销修复')`, `toast(fixed ? t('toast_fixed') : t('toast_undone'))`],
  [`toast('位置已更新')`, `toast(t('toast_loc_updated'))`],
  [`toast('已保存')`, `toast(t('toast_saved'))`],
  [`toast('设备已删除')`, `toast(t('toast_dev_del'))`],
  // 类型枚举显示
  [`'<div class="ov-dev-type">' + esc(d.type || '') + '</div>'`, `'<div class="ov-dev-type">' + esc(typeLabel(d.type)) + '</div>'`],
  [`' · ' + esc(r.deviceType)`, `' · ' + esc(typeLabel(r.deviceType))`],
  [`'<span class="mh-dev-type">' + esc(d.type) + '</span>'`, `'<span class="mh-dev-type">' + esc(typeLabel(d.type)) + '</span>'`],
  [`'<span class="kb-type-chip">' + esc(k.deviceType) + '</span>'`, `'<span class="kb-type-chip">' + esc(typeLabel(k.deviceType)) + '</span>'`],
  // 弹窗标题（JS 覆盖 textContent）
  [`mine ? '编辑矿山' : '添加矿山'`, `mine ? t('mine_title_edit') : t('mine_title_new')`],
  [`dev ? '编辑设备' : '添加设备'`, `dev ? t('dev_title_edit') : t('dev_title_new')`],
  [`'设备电子档案 · ' + (ctx.dev.code || ctx.dev.type || '')`, `t('arc_title') + (ctx.dev.code || ctx.dev.type || '')`],
  // 档案卡区块标题
  [`>基本信息</div>`, `>' + t('arc_basic') + '</div>`],
  [`>VIN 部件档案</div>`, `>' + t('arc_vin') + '</div>`],
  [`>故障与维修记录</div>`, `>' + t('arc_fault_rec') + '</div>`],
  // “录入 ”时间戳
  [`">录入 `, `">' + t('arc_recorded') + ' `],
  // 知识库列表预览标题
  [`title="点击预览"`, `title="点击预览" data-i18n-title="kb_click_preview"`]
];
DYN.forEach(function(p){ s = s.split(p[0]).join(p[1]); });

/* ---------- 6) init 末尾接入 applyI18n + 切换器绑定 ---------- */
s = s.replace("    updateDirtyBadge();\n  }", "    updateDirtyBadge();\n    applyI18n();\n    bindLangSwitch();\n  }");

fs.writeFileSync(path, s, 'utf8');
console.log('i18n applied. file bytes =', s.length);
