    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
    import {
      getFirestore,
      collection,
      doc,
      setDoc,
      deleteDoc,
      getDoc,
      getDocs,
      addDoc,
      query,
      orderBy,
      limit
    } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
    import { LANG } from "./translations.js";

    const SETTINGS = window.APP_CONFIG || window.DEFAULT_APP_CONFIG;

    if(!SETTINGS?.firebase?.apiKey || !SETTINGS?.firestoreCollections || !SETTINGS?.auth){
      document.body.innerHTML = `
        <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f5f7fa;font-family:Arial,sans-serif;">
          <div style="max-width:680px;background:#fff;border-radius:18px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
            <h1 style="margin:0 0 12px;font-size:28px;color:#111827;">Missing app config</h1>
            <p style="margin:0 0 10px;color:#374151;">The app could not find a valid public demo config or local override.</p>
            <p style="margin:0 0 10px;color:#374151;">For local work, create <strong>config.local.js</strong> from <strong>config.local.example.js</strong>.</p>
            <p style="margin:0;color:#6b7280;">GitHub Pages should use <strong>config.demo.js</strong>. Local work can override it with <strong>config.local.js</strong>.</p>
          </div>
        </div>
      `;
      throw new Error('Missing app config');
    }

    const app = initializeApp(SETTINGS.firebase);
    const db = getFirestore(app);

    const ITEMS_COLLECTION = SETTINGS.firestoreCollections.items;
    const LOGS_COLLECTION = SETTINGS.firestoreCollections.scanLogs;
    const PASSWORD_VALUE = SETTINGS.auth.registerPassword;
    const ENGINEER_PASSWORD = SETTINGS.auth.engineerPassword || '4321';
    const FOREMAN_PASSWORD = SETTINGS.auth.foremanPassword || '5678';
    const TYPE_VALUES = {
      shackle: '׳©׳׳§׳',
      strap: '׳¨׳¦׳•׳¢׳”',
      chain: '׳©׳¨׳©׳¨׳×',
      ring: '׳˜׳‘׳¢׳×',
      hook: '׳•׳•',
      fire: 'מטף כיבוי אש',
      aircomp: 'מדחס אויר',
      other: '׳׳—׳¨'
    };
    const STATUS_VALUES = {
      ok: '׳×׳§׳™׳',
      review: '׳׳‘׳“׳™׳§׳”',
      disabled: '׳׳•׳©׳‘׳×'
    };
    const STATUS_VARIANTS = {
      ok: [STATUS_VALUES.ok, 'תקין', 'ok', 'Okay', 'סלים'],
      review: [STATUS_VALUES.review, 'לבדיקה', 'needs review', 'review', 'בבדיקה', 'بحاجة إلى فحص'],
      disabled: [STATUS_VALUES.disabled, 'מושבת', 'disabled', 'out of service', 'معطّل']
    };

    const IMAGE_LIBRARY = {
      "׳©׳׳§׳":"./תמונות/shackle.jpg",
      "׳¨׳¦׳•׳¢׳”":"./תמונות/strap.jpg",
      "׳©׳¨׳©׳¨׳×":"./תמונות/chain.jpg",
      "׳˜׳‘׳¢׳×":"./תמונות/ring.jpg",
      "׳•׳•":"./תמונות/hook.jpg",
      "מטף כיבוי אש":"./תמונות/fire.jpg",
      "מדחס אויר":"./תמונות/aircomp.jpg",
      "׳׳—׳¨":"./תמונות/shackle.jpg"
    };
    const IMAGE_TYPE_ALIASES = {
      "׳©׳׳§׳": "./תמונות/shackle.jpg",
      "שאקל": "./תמונות/shackle.jpg",
      "shackle": "./תמונות/shackle.jpg",
      "׳¨׳¦׳•׳¢׳”": "./תמונות/strap.jpg",
      "רצועה": "./תמונות/strap.jpg",
      "strap": "./תמונות/strap.jpg",
      "׳©׳¨׳©׳¨׳×": "./תמונות/chain.jpg",
      "שרשרת": "./תמונות/chain.jpg",
      "chain": "./תמונות/chain.jpg",
      "׳˜׳‘׳¢׳×": "./תמונות/ring.jpg",
      "טבעת": "./תמונות/ring.jpg",
      "ring": "./תמונות/ring.jpg",
      "׳•׳•": "./תמונות/hook.jpg",
      "וו": "./תמונות/hook.jpg",
      "hook": "./תמונות/hook.jpg",
      "מטף כיבוי אש": "./תמונות/fire.jpg",
      "fire extinguisher": "./תמונות/fire.jpg",
      "מדחס אויר": "./תמונות/aircomp.jpg",
      "air compressor": "./תמונות/aircomp.jpg",
      "׳׳—׳¨": "./תמונות/shackle.jpg",
      "אחר": "./תמונות/shackle.jpg",
      "other": "./תמונות/shackle.jpg"
    };

    const el = (id) => document.getElementById(id);
    const savedLang = localStorage.getItem('lang');
    let currentLang = LANG[savedLang] ? savedLang : 'he';
    const tableFilters = {
      query: '',
      status: 'all'
    };
    const tableSort = {
      key: 'tagId',
      direction: 'asc'
    };
    const CACHE_TTL_MS = 5000;
    const dataCache = {
      items: { value: null, loadedAt: 0, promise: null },
      logs: { value: null, loadedAt: 0, promise: null }
    };
    let lastSavedTagId = '';
    let passwordContext = 'register';
    let pendingRegisterRole = 'engineer';
    let registerAccessRole = '';
    let currentScannedItem = null;
    let customImageSrc = '';
    let pendingImageTask = null;
    const debugState = {
      enabled: new URLSearchParams(window.location.search).get('debug') === '1',
      visible: new URLSearchParams(window.location.search).get('debug') === '1',
      lines: ['Debug panel ready.']
    };

    function t(key){
      return LANG[currentLang][key] || key;
    }

    function formatText(key, replacements = {}){
      return Object.entries(replacements).reduce((text, [name, value]) => {
        return text.replaceAll(`{${name}}`, String(value));
      }, t(key));
    }

    function csvValue(value){
      return `"${String(value ?? '').replaceAll('"', '""')}"`;
    }

    function isLibraryImageSrc(src){
      return Object.values(IMAGE_LIBRARY).includes(src) || String(src || '').startsWith('data:image/svg+xml;utf8,');
    }

    function getDefaultImageForType(type){
      const normalized = String(type || '').trim();
      const normalizedLower = normalized.toLowerCase();
      return IMAGE_TYPE_ALIASES[normalized] || IMAGE_TYPE_ALIASES[normalizedLower] || IMAGE_LIBRARY['׳׳—׳¨'];
    }

    function getDisplayImageSrc(item){
      const savedImage = item?.imageSrc || '';
      if(savedImage && !isLibraryImageSrc(savedImage)){
        return savedImage;
      }
      return getDefaultImageForType(item?.itemType);
    }

    function readFileAsDataUrl(file){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('File read failed'));
        reader.readAsDataURL(file);
      });
    }

    function loadImageElement(src){
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = src;
      });
    }

    async function buildCompressedImageDataUrl(file){
      const sourceDataUrl = await readFileAsDataUrl(file);
      const image = await loadImageElement(sourceDataUrl);
      const maxDimension = 640;
      const scale = Math.min(1, maxDimension / Math.max(image.width || 1, image.height || 1));
      const width = Math.max(1, Math.round((image.width || 1) * scale));
      const height = Math.max(1, Math.round((image.height || 1) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if(!context){
        return sourceDataUrl;
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      return canvas.toDataURL('image/jpeg', 0.62);
    }

    function pushDebugLine(message){
      const timestamp = new Date().toLocaleTimeString();
      debugState.lines.unshift(`[${timestamp}] ${message}`);
      debugState.lines = debugState.lines.slice(0, 30);

      if(el('debugLog')){
        el('debugLog').textContent = debugState.lines.join('\n');
      }
    }

    function setDebugValue(id, value){
      const node = el(id);
      if(node){
        node.textContent = value;
      }
    }

    function refreshDebugPanel(){
      const panel = el('debugPanel');

      if(!panel){
        return;
      }

      panel.classList.toggle('active', debugState.enabled && debugState.visible);
      setDebugValue('debugModeValue', debugState.enabled ? 'Debug On' : 'Debug Off');
      setDebugValue('debugHostValue', window.location.origin);
      setDebugValue('debugFirebaseValue', SETTINGS?.firebase?.projectId || 'Missing');
      setDebugValue('debugNfcValue', 'NDEFReader' in window ? 'Supported' : 'Not supported');
      el('debugLog').textContent = debugState.lines.join('\n');
    }

    function toggleDebugPanel(){
      debugState.visible = !debugState.visible;
      refreshDebugPanel();
    }

    async function copyDebugInfo(){
      const summary = [
        `URL: ${window.location.href}`,
        `Project: ${SETTINGS?.firebase?.projectId || 'missing'}`,
        `Host: ${window.location.origin}`,
        `Language: ${currentLang}`,
        `Web NFC: ${'NDEFReader' in window ? 'supported' : 'not supported'}`,
        '',
        ...debugState.lines
      ].join('\n');

      try {
        await navigator.clipboard.writeText(summary);
        pushDebugLine('Debug info copied to clipboard.');
      } catch (error) {
        pushDebugLine(`Clipboard copy failed: ${error.message}`);
      }
    }

    function translateType(type){
      if(type === '׳©׳׳§׳') return t('type_shackle');
      if(type === '׳¨׳¦׳•׳¢׳”') return t('type_strap');
      if(type === '׳©׳¨׳©׳¨׳×') return t('type_chain');
      if(type === '׳˜׳‘׳¢׳×') return t('type_ring');
      if(type === '׳•׳•') return t('type_hook');
      if(type === 'מטף כיבוי אש') return t('type_fire');
      if(type === 'מדחס אויר') return t('type_aircomp');
      if(type === '׳׳—׳¨') return t('type_other');
      return type || t('scanItemDefault');
    }

    function translateStatus(status){
      const normalized = normalizeStatus(status);
      if(normalized === 'ok') return t('status_ok');
      if(normalized === 'review') return t('status_review');
      if(normalized === 'disabled') return t('status_disabled');
      return status || '-';
    }

    function getAccessRoleLabel(role){
      if(role === 'engineer') return t('roleEngineer');
      if(role === 'foreman') return t('roleForeman');
      return t('roleViewer');
    }

    function statusPillClass(status){
      const normalized = normalizeStatus(status);
      if(normalized === 'ok') return 'pill pill-ok';
      if(normalized === 'review') return 'pill pill-warn';
      if(normalized === 'disabled') return 'pill pill-bad';
      return 'pill';
    }

    function applyStatusColor(node, status){
      const normalized = normalizeStatus(status);
      node.classList.remove('status-ok', 'status-warn', 'status-bad', 'status-chip', 'pill', 'pill-ok', 'pill-warn', 'pill-bad');
      node.classList.add('status-chip');
      if(normalized === 'ok'){
        node.classList.add('pill', 'pill-ok');
      } else if(normalized === 'review'){
        node.classList.add('pill', 'pill-warn');
      } else if(normalized === 'disabled'){
        node.classList.add('pill', 'pill-bad');
      }
    }

    function normalizeStatus(status){
      const normalizedText = String(status || '').trim().toLowerCase();
      if(!normalizedText) return '';

      if(STATUS_VARIANTS.ok.some((value) => String(value).trim().toLowerCase() === normalizedText)) return 'ok';
      if(STATUS_VARIANTS.review.some((value) => String(value).trim().toLowerCase() === normalizedText)) return 'review';
      if(STATUS_VARIANTS.disabled.some((value) => String(value).trim().toLowerCase() === normalizedText)) return 'disabled';

      return '';
    }

    function normalizeTagId(tagId){
      return String(tagId || '').trim().toLowerCase();
    }

    function toTimeValue(value){
      if(!value) return 0;
      if(typeof value?.toDate === 'function'){
        return value.toDate().getTime();
      }
      if(value instanceof Date){
        return value.getTime();
      }

      const text = String(value).trim();
      const isoParsed = Date.parse(text);
      if(!Number.isNaN(isoParsed)){
        return isoParsed;
      }

      const parts = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
      if(parts){
        let [, first, second, year, hours, minutes, seconds = '0', meridiem = ''] = parts;
        let day = Number(first);
        let month = Number(second);
        const normalizedMeridiem = meridiem.toUpperCase();

        if(text.includes('/')){
          month = Number(first);
          day = Number(second);
        }

        let normalizedHours = Number(hours);
        if(normalizedMeridiem === 'PM' && normalizedHours < 12){
          normalizedHours += 12;
        } else if(normalizedMeridiem === 'AM' && normalizedHours === 12){
          normalizedHours = 0;
        }

        return new Date(
          Number(year),
          Math.max(0, month - 1),
          day,
          normalizedHours,
          Number(minutes),
          Number(seconds)
        ).getTime();
      }

      const parsed = Date.parse(text);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    function getNewestItem(items){
      return [...items].sort((a, b) => {
        const timeA = toTimeValue(a?.updatedAt || a?.createdAt);
        const timeB = toTimeValue(b?.updatedAt || b?.createdAt);
        return timeB - timeA;
      })[0] || null;
    }

    function updateStatusOptions(){
      const current = el('itemStatus').value || '׳×׳§׳™׳';
      el('itemStatus').innerHTML = `
        <option value="׳×׳§׳™׳">${t('status_ok')}</option>
        <option value="׳׳‘׳“׳™׳§׳”">${t('status_review')}</option>
        <option value="׳׳•׳©׳‘׳×">${t('status_disabled')}</option>
      `;
      el('itemStatus').value = current;
      updateStatusColorSelect();
    }

    function updateTypeOptions(){
      const current = el('itemType').value || '׳©׳׳§׳';
      el('itemType').innerHTML = `
        <option value="׳©׳׳§׳">${t('type_shackle')}</option>
        <option value="׳¨׳¦׳•׳¢׳”">${t('type_strap')}</option>
        <option value="׳©׳¨׳©׳¨׳×">${t('type_chain')}</option>
        <option value="׳˜׳‘׳¢׳×">${t('type_ring')}</option>
        <option value="׳•׳•">${t('type_hook')}</option>
        <option value="מטף כיבוי אש">${t('type_fire')}</option>
        <option value="מדחס אויר">${t('type_aircomp')}</option>
        <option value="׳׳—׳¨">${t('type_other')}</option>
      `;
      el('itemType').value = current;
    }

    function updateScanEditOptions(){
      const currentType = el('scanEditItemType').value || '׳©׳׳§׳';
      const currentStatus = el('scanEditStatus').value || '׳×׳§׳™׳';
      el('scanEditItemType').innerHTML = el('itemType').innerHTML;
      el('scanEditStatus').innerHTML = el('itemStatus').innerHTML;
      el('scanEditItemType').value = currentType;
      el('scanEditStatus').value = currentStatus;
    }

    function canEditRegister(){
      return registerAccessRole === 'engineer';
    }

    function updateRegisterAccessUi(){
      const canEdit = canEditRegister();
      const selectedRole = pendingRegisterRole || registerAccessRole || 'engineer';
      el('engineerAccessBtn').classList.toggle('active', selectedRole === 'engineer');
      el('foremanAccessBtn').classList.toggle('active', selectedRole === 'foreman');

      [
        'tagId',
        'itemType',
        'description',
        'serialNumber',
        'wll',
        'nextInspection',
        'itemStatus',
        'notes'
      ].forEach((id) => {
        el(id).disabled = !canEdit;
      });

      el('scanNewTagBtn').disabled = !canEdit;
      el('saveBtn').disabled = !canEdit;
      el('clearFormBtn').disabled = !canEdit;
      el('captureImageBtn').disabled = !canEdit;
      el('clearImageBtn').disabled = !canEdit;

      if(registerAccessRole === 'foreman'){
        el('registerStatus').textContent = t('scanReadOnlyNote');
      } else if(registerAccessRole === 'engineer' && el('registerStatus').textContent === t('scanReadOnlyNote')) {
        el('registerStatus').textContent = t('waitingForScan');
      }
    }

    function populateScanEditForm(item){
      if(!item){
        el('scanEditTagId').value = '';
        el('scanEditItemType').value = '׳©׳׳§׳';
        el('scanEditDescription').value = '';
        el('scanEditSerial').value = '';
        el('scanEditWll').value = '';
        el('scanEditNextInspection').value = '';
        el('scanEditStatus').value = '׳×׳§׳™׳';
        el('scanEditNotes').value = '';
        return;
      }

      el('scanEditTagId').value = item.tagId || '';
      el('scanEditItemType').value = item.itemType || '׳©׳׳§׳';
      el('scanEditDescription').value = item.description || '';
      el('scanEditSerial').value = item.serialNumber || '';
      el('scanEditWll').value = item.wll || '';
      el('scanEditNextInspection').value = item.nextInspection || '';
      el('scanEditStatus').value = item.status || '׳×׳§׳™׳';
      el('scanEditNotes').value = item.notes || '';
    }

    function setLang(lang){
      currentLang = lang;
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = LANG[lang].dir;
      pushDebugLine(`Language set to ${lang}.`);
      document.querySelectorAll('.flag-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.lang === lang);
      });

      el('homeCheckText').textContent = t('homeCheck');
      el('homeRegisterText').textContent = t('homeRegister');

      el('passwordBackBtn').textContent = t('back');
      if(passwordContext === 'register'){
        el('passwordTitle').textContent = pendingRegisterRole === 'foreman' ? t('foremanLoginTitle') : t('engineerLoginTitle');
        el('passwordLabel').textContent = pendingRegisterRole === 'foreman' ? t('foremanPasswordLabel') : t('engineerPasswordLabel');
        el('passwordRoleHint').textContent = getAccessRoleLabel(pendingRegisterRole);
      } else {
        el('passwordTitle').textContent = t('passwordTitle');
        el('passwordLabel').textContent = t('passwordLabel');
        el('passwordRoleHint').textContent = '';
      }
      el('passwordInput').placeholder = t('passwordPlaceholder');
      el('passwordEnterBtn').textContent = t('passwordEnter');

      el('scanBackBtn').textContent = t('back');
      el('scanScreenTitle').textContent = t('scanTitle');
      el('scanNowBtn').textContent = t('scanNow');
      el('demoScanBtn').textContent = t('demoScan');
      el('engineerAccessBtn').textContent = t('engineerAccessBtn');
      el('foremanAccessBtn').textContent = t('foremanAccessBtn');
      el('scanEditTitle').textContent = t('scanEditTitle');
      el('scanEditTagIdLabel').textContent = t('tagId');
      el('scanEditItemTypeLabel').textContent = t('itemType');
      el('scanEditDescriptionLabel').textContent = t('description');
      el('scanEditSerialLabel').textContent = t('serial');
      el('scanEditWllLabel').textContent = t('wll');
      el('scanEditNextInspectionLabel').textContent = t('nextInspection');
      el('scanEditStatusLabel').textContent = t('status');
      el('scanEditNotesLabel').textContent = t('notes');
      el('scanSaveBtn').textContent = t('saveScanChanges');
      el('scanEditTagId').placeholder = t('tagPlaceholder');
      el('scanEditDescription').placeholder = t('descriptionPlaceholder');
      el('scanEditSerial').placeholder = t('serialPlaceholder');
      el('scanEditWll').placeholder = t('wllPlaceholder');
      el('scanEditNotes').placeholder = t('notesPlaceholder');
      el('registerBackBtn').textContent = t('back');
      el('registerScreenTitle').textContent = t('registerTitle');
      el('tabRegisterBtn').textContent = t('tabRegister');
      el('tabTableBtn').textContent = t('tabTable');
      el('tabLogsBtn').textContent = t('tabLogs');
      el('scanNewTagBtn').textContent = t('scanNewTag');
      el('clearFormBtn').textContent = t('clearForm');

      el('tagIdLabel').textContent = t('tagId');
      el('itemTypeLabel').textContent = t('itemType');
      el('imageLabel').textContent = t('image');
      el('descriptionLabel').textContent = t('description');
      el('serialLabel').textContent = t('serial');
      el('wllLabel').textContent = t('wll');
      el('nextInspectionLabel').textContent = t('nextInspection');
      el('itemStatusLabel').textContent = t('status');
      el('notesLabel').textContent = t('notes');
      el('saveBtn').textContent = t('saveItem');

      el('tagId').placeholder = t('tagPlaceholder');
      el('description').placeholder = t('descriptionPlaceholder');
      el('serialNumber').placeholder = t('serialPlaceholder');
      el('wll').placeholder = t('wllPlaceholder');
      el('notes').placeholder = t('notesPlaceholder');

      el('lblTagId').textContent = t('tagId');
      el('lblDescription').textContent = t('description');
      el('lblSerial').textContent = t('serial');
      el('lblWll').textContent = t('wll');
      el('lblNextInspection').textContent = t('nextInspection');
      el('lblStatus').textContent = t('status');
      el('lblNotes').textContent = t('notes');

      el('tableTitleText').textContent = t('tableTitle');
      el('tableSummaryText').textContent = formatText('tableSummary', { shown: 0, total: 0 });
      el('tableSearchInput').placeholder = t('tableSearchPlaceholder');
      el('tableSearchInput').setAttribute('aria-label', t('tableSearchPlaceholder'));
      el('tableStatusFilter').setAttribute('aria-label', t('tableStatusFilterLabel'));
      el('clearTableFiltersBtn').textContent = t('clearTableFilters');
      el('exportTableBtn').textContent = t('exportExcel');
      el('refreshTableBtn').textContent = t('refresh');
      el('captureImageBtn').textContent = t('captureImage');
      el('clearImageBtn').textContent = t('clearImage');

      updateTypeOptions();
      updateStatusOptions();
      updateScanEditOptions();
      updateRegisterAccessUi();
      updateTableFilterOptions();
      selectImageByType();
      renderScanLogs();
      renderItemsTable();
      refreshDebugPanel();

      if(!el('scanStatus').textContent.trim()) el('scanStatus').textContent = t('waitingForScan');
      if(!el('registerStatus').textContent.trim()) el('registerStatus').textContent = t('waitingForScan');
    }

    async function getItems(forceFresh = false){
      if(!forceFresh && isCacheFresh(dataCache.items)){
        pushDebugLine(`Using cached items (${dataCache.items.value.length}).`);
        return [...dataCache.items.value];
      }

      if(!forceFresh && dataCache.items.promise){
        pushDebugLine('Waiting for in-flight items request.');
        const pendingItems = await dataCache.items.promise;
        return [...pendingItems];
      }

      pushDebugLine('Loading items from Firestore.');
      dataCache.items.promise = getDocs(collection(db, ITEMS_COLLECTION)).then((snapshot) => {
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data());
        });
        items.sort((a, b) => (a.tagId || '').localeCompare(b.tagId || ''));
        dataCache.items.value = items;
        dataCache.items.loadedAt = Date.now();
        pushDebugLine(`Loaded ${items.length} items.`);
        return items;
      }).finally(() => {
        dataCache.items.promise = null;
      });

      const items = await dataCache.items.promise;
      return [...items];
    }

    function updateTableSummary(shownCount, totalCount){
      el('tableSummaryText').textContent = formatText('tableSummary', {
        shown: shownCount,
        total: totalCount
      });
    }

    function isCacheFresh(entry){
      return Boolean(entry.value) && (Date.now() - entry.loadedAt) < CACHE_TTL_MS;
    }

    function invalidateItemsCache(){
      dataCache.items.value = null;
      dataCache.items.loadedAt = 0;
      dataCache.items.promise = null;
    }

    function invalidateLogsCache(){
      dataCache.logs.value = null;
      dataCache.logs.loadedAt = 0;
      dataCache.logs.promise = null;
    }

    function updateTableFilterOptions(){
      const current = tableFilters.status || 'all';
      el('tableStatusFilter').innerHTML = `
        <option value="all">${t('tableAllStatuses')}</option>
        <option value="${STATUS_VALUES.ok}">${t('status_ok')}</option>
        <option value="${STATUS_VALUES.review}">${t('status_review')}</option>
        <option value="${STATUS_VALUES.disabled}">${t('status_disabled')}</option>
      `;
      el('tableStatusFilter').value = current;
    }

    function getSortValue(item, key){
      if(key === 'status') return translateStatus(item.status);
      if(key === 'itemType') return translateType(item.itemType);
      return item?.[key] || '';
    }

    function compareSortValues(a, b){
      const timeA = toTimeValue(a);
      const timeB = toTimeValue(b);
      if(timeA && timeB){
        return timeA - timeB;
      }

      const textA = String(a || '').trim().toLowerCase();
      const textB = String(b || '').trim().toLowerCase();
      return textA.localeCompare(textB, currentLang);
    }

    function sortItems(items){
      return [...items].sort((itemA, itemB) => {
        const result = compareSortValues(
          getSortValue(itemA, tableSort.key),
          getSortValue(itemB, tableSort.key)
        );
        return tableSort.direction === 'asc' ? result : result * -1;
      });
    }

    function toggleTableSort(key){
      if(tableSort.key === key){
        tableSort.direction = tableSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        tableSort.key = key;
        tableSort.direction = 'asc';
      }

      renderItemsTable();
    }

    function sortIndicator(key){
      if(tableSort.key !== key) return '↕';
      return tableSort.direction === 'asc' ? '↑' : '↓';
    }

    function sortableHeader(label, key){
      const activeClass = tableSort.key === key ? ' active' : '';
      return `<button class="sort-btn${activeClass}" onclick="toggleTableSort('${key}')">${label} <span class="sort-indicator">${sortIndicator(key)}</span></button>`;
    }

    function getStatusOptionsMarkup(selectedStatus){
      return `
        <option value="${STATUS_VALUES.ok}" ${normalizeStatus(selectedStatus) === 'ok' ? 'selected' : ''}>${t('status_ok')}</option>
        <option value="${STATUS_VALUES.review}" ${normalizeStatus(selectedStatus) === 'review' ? 'selected' : ''}>${t('status_review')}</option>
        <option value="${STATUS_VALUES.disabled}" ${normalizeStatus(selectedStatus) === 'disabled' ? 'selected' : ''}>${t('status_disabled')}</option>
      `;
    }

    function applySelectStatusClass(select, statusValue){
      if(!select) return;
      select.classList.remove('status-ok', 'status-warn', 'status-bad');
      const normalized = normalizeStatus(statusValue);
      if(normalized === 'ok'){
        select.classList.add('status-ok');
      } else if(normalized === 'review'){
        select.classList.add('status-warn');
      } else if(normalized === 'disabled'){
        select.classList.add('status-bad');
      }
    }

    function bindTableEditors(){
      document.querySelectorAll('.table-status-select').forEach((select) => {
        applySelectStatusClass(select, select.value);
        select.addEventListener('change', () => {
          applySelectStatusClass(select, select.value);
        });
      });

      document.querySelectorAll('.table-save-btn').forEach((button) => {
        button.addEventListener('click', () => {
          saveTableRow(button.dataset.tagId || '');
        });
      });

      document.querySelectorAll('.table-delete-btn').forEach((button) => {
        button.addEventListener('click', () => {
          deleteTableRow(button.dataset.tagId || '');
        });
      });
    }

    async function saveTableRow(tagId){
      const safeTagId = CSS.escape(String(tagId || ''));
      const statusInput = document.querySelector(`.table-status-select[data-tag-id="${safeTagId}"]`);
      const dateInput = document.querySelector(`.table-date-input[data-tag-id="${safeTagId}"]`);
      const notesInput = document.querySelector(`.table-notes-input[data-tag-id="${safeTagId}"]`);
      const statusNode = document.querySelector(`.table-row-status[data-tag-id="${safeTagId}"]`);

      if(!statusInput || !dateInput || !notesInput || !statusNode){
        return;
      }

      statusNode.textContent = t('saving');

      try {
        const existing = await getItemByTag(tagId);

        if(!existing){
          statusNode.textContent = t('itemNotFound');
          return;
        }

        const updatedItem = {
          ...existing,
          status: statusInput.value,
          nextInspection: dateInput.value,
          notes: notesInput.value.trim(),
          updatedAt: new Date().toLocaleString()
        };

        await saveItemToCloud(updatedItem);
        applySelectStatusClass(statusInput, statusInput.value);
        statusNode.textContent = t('tableRowUpdated');
        await renderItemsTable();
      } catch (e) {
        pushDebugLine(`Inline table save error for ${tagId}: ${e.message}`);
        statusNode.textContent = t('cloudSaveError');
        console.error(e);
      }
    }

    async function deleteTableRow(tagId){
      const safeTagId = CSS.escape(String(tagId || ''));
      const statusNode = document.querySelector(`.table-row-status[data-tag-id="${safeTagId}"]`);

      if(!tagId || !statusNode){
        return;
      }

      if(!canEditRegister()){
        statusNode.textContent = t('scanEditNoPermission');
        return;
      }

      if(!window.confirm(t('deleteItemConfirm'))){
        return;
      }

      statusNode.textContent = t('saving');

      try {
        await deleteDoc(doc(db, ITEMS_COLLECTION, tagId));
        invalidateItemsCache();
        pushDebugLine(`Deleted item ${tagId}.`);
        statusNode.textContent = t('itemDeleted');
        if(lastSavedTagId === tagId){
          lastSavedTagId = '';
        }
        await renderItemsTable();
      } catch (e) {
        pushDebugLine(`Delete error for ${tagId}: ${e.message}`);
        statusNode.textContent = t('cloudSaveError');
        console.error(e);
      }
    }

    async function exportTableCsv(){
      try {
        const items = await getItems();
        const filteredItems = sortItems(getFilteredItems(items));
        const headers = [
          t('tagId'),
          t('status'),
          t('itemType'),
          t('description'),
          t('serial'),
          t('wll'),
          t('nextInspection'),
          t('notes')
        ];

        const rows = filteredItems.map((item) => [
          item.tagId || '',
          translateStatus(item.status),
          translateType(item.itemType),
          item.description || '',
          item.serialNumber || '',
          item.wll || '',
          item.nextInspection || '',
          item.notes || ''
        ]);

        const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nfc-items-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        pushDebugLine(`Exported ${filteredItems.length} table rows.`);
      } catch (e) {
        pushDebugLine(`Table export error: ${e.message}`);
        console.error(e);
      }
    }

    function getFilteredItems(items){
      const normalizedQuery = tableFilters.query.trim().toLowerCase();

      return items.filter((item) => {
        const matchesStatus =
          tableFilters.status === 'all' ||
          item.status === tableFilters.status ||
          normalizeStatus(item.status) === normalizeStatus(tableFilters.status);

        if(!matchesStatus){
          return false;
        }

        if(!normalizedQuery){
          return true;
        }

        const searchFields = [
          item.tagId,
          translateType(item.itemType),
          item.itemType,
          item.description,
          item.serialNumber,
          item.wll,
          item.notes,
          translateStatus(item.status)
        ];

        return searchFields.some((field) => String(field || '').toLowerCase().includes(normalizedQuery));
      });
    }

    async function getItemByTag(tagId){
      pushDebugLine(`Loading item for tag ${tagId}.`);
      const ref = doc(db, ITEMS_COLLECTION, tagId);
      const snap = await getDoc(ref);
      pushDebugLine(snap.exists() ? `Tag ${tagId} found.` : `Tag ${tagId} not found.`);
      return snap.exists() ? snap.data() : null;
    }

    async function saveItemToCloud(item){
      pushDebugLine(`Saving item ${item.tagId}.`);
      await setDoc(doc(db, ITEMS_COLLECTION, item.tagId), item);
      invalidateItemsCache();
      pushDebugLine(`Saved item ${item.tagId}.`);
    }

    async function saveScanLog(tagId, found, item = null){
      pushDebugLine(`Writing scan log for ${tagId} (${found ? 'found' : 'not found'}).`);
      await addDoc(collection(db, LOGS_COLLECTION), {
        tagId,
        found,
        itemStatus: item?.status || '',
        itemType: item?.itemType || '',
        time: new Date().toLocaleString(),
        sortTime: new Date().toISOString()
      });
      invalidateLogsCache();
    }

    async function getLogs(forceFresh = false){
      if(!forceFresh && isCacheFresh(dataCache.logs)){
        pushDebugLine(`Using cached logs (${dataCache.logs.value.length}).`);
        return [...dataCache.logs.value];
      }

      if(!forceFresh && dataCache.logs.promise){
        pushDebugLine('Waiting for in-flight logs request.');
        const pendingLogs = await dataCache.logs.promise;
        return [...pendingLogs];
      }

      pushDebugLine('Loading scan logs.');
      const q = query(collection(db, LOGS_COLLECTION), orderBy('sortTime', 'desc'), limit(100));
      dataCache.logs.promise = getDocs(q).then((snapshot) => {
        const logs = [];
        snapshot.forEach((docSnap) => logs.push(docSnap.data()));
        dataCache.logs.value = logs;
        dataCache.logs.loadedAt = Date.now();
        pushDebugLine(`Loaded ${logs.length} logs.`);
        return logs;
      }).finally(() => {
        dataCache.logs.promise = null;
      });

      const logs = await dataCache.logs.promise;
      return [...logs];
    }

    async function renderScanLogs(){
      const container = el('logsList');
      container.innerHTML = `<div class="empty-text">Loading...</div>`;

      try {
        const [logs, items] = await Promise.all([getLogs(), getItems()]);
        const itemMap = new Map(items.map((item) => [normalizeTagId(item.tagId), item]));

        if(!logs.length){
          container.innerHTML = `<div class="empty-text">${t('logTitleEmpty')}</div>`;
          return;
        }

        container.innerHTML = logs.map(log => {
          const fallbackItem = itemMap.get(normalizeTagId(log.tagId));
          const effectiveStatus = log.itemStatus || fallbackItem?.status || '';
          const effectiveType = log.itemType || fallbackItem?.itemType || '';
          const normalizedStatus = normalizeStatus(effectiveStatus);
          const foundClass = log.found
            ? statusPillClass(effectiveStatus || STATUS_VALUES.ok)
            : 'pill pill-bad';
          const statusClass = statusPillClass(effectiveStatus || '');
          const itemClass = log.found
            ? `log-item ${normalizedStatus === 'review' ? 'log-item-warn' : normalizedStatus === 'disabled' ? 'log-item-bad' : 'log-item-ok'}`
            : 'log-item log-item-bad';
          const stateText = log.found ? t('logFound') : t('logNotFound');
          const statusText = log.found && effectiveStatus ? translateStatus(effectiveStatus) : '';
          const typeText = effectiveType ? translateType(effectiveType) : '';
          return `
            <div class="${itemClass}">
              <div class="log-top">
                <div class="log-pill-row">
                  <span class="${foundClass}">${stateText}</span>
                  ${statusText ? `<span class="${statusClass}">${t('status')}: ${statusText}</span>` : ''}
                </div>
                <span class="log-time">${log.time}</span>
              </div>
              <div>${t('logTag')}: <span class="mono">${log.tagId}</span></div>
              ${typeText ? `<div>${t('itemType')}: ${typeText}</div>` : ''}
            </div>
          `;
        }).join('');
      } catch (e) {
        container.innerHTML = `<div class="empty-text">${t('logLoadError')}</div>`;
        pushDebugLine(`Scan log load error: ${e.message}`);
        console.error(e);
      }
    }

    async function renderItemsTable(){
      const container = el('itemsTableContainer');
      container.innerHTML = `<div class="empty-text">Loading...</div>`;

      try {
        const items = await getItems();
        const filteredItems = sortItems(getFilteredItems(items));

        updateTableSummary(filteredItems.length, items.length);

        if(!items.length){
          container.innerHTML = `<div class="empty-text">${t('noTableItems')}</div>`;
          return;
        }

        if(!filteredItems.length){
          container.innerHTML = `<div class="empty-text">${t('noFilteredItems')}</div>`;
          pushDebugLine('Table filters returned no items.');
          return;
        }

        container.innerHTML = `
          <table class="items-table">
            <thead>
              <tr>
                <th>${t('image')}</th>
                <th>${sortableHeader(t('tagId'), 'tagId')}</th>
                <th>${sortableHeader(t('status'), 'status')}</th>
                <th>${sortableHeader(t('itemType'), 'itemType')}</th>
                <th>${sortableHeader(t('description'), 'description')}</th>
                <th>${sortableHeader(t('serial'), 'serialNumber')}</th>
                <th>${t('wll')}</th>
                <th>${sortableHeader(t('nextInspection'), 'nextInspection')}</th>
                <th>${t('notes')}</th>
                <th>${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr class="${item.tagId === lastSavedTagId ? 'recently-saved-row' : ''}" data-tag-id="${escapeHtml(item.tagId || '')}">
                  <td data-label="${t('image')}"><img class="small-thumb" src="${getDisplayImageSrc(item)}" alt="item"></td>
                  <td data-label="${t('tagId')}"><span class="mono">${item.tagId || ''}</span></td>
                  <td data-label="${t('status')}">
                    <select class="toolbar-input table-inline-input table-status-select" data-tag-id="${escapeHtml(item.tagId || '')}" ${canEditRegister() ? '' : 'disabled'}>
                      ${getStatusOptionsMarkup(item.status)}
                    </select>
                  </td>
                  <td data-label="${t('itemType')}">${translateType(item.itemType)}</td>
                  <td data-label="${t('description')}">${escapeHtml(item.description || '')}</td>
                  <td data-label="${t('serial')}">${escapeHtml(item.serialNumber || '')}</td>
                  <td data-label="${t('wll')}">${escapeHtml(item.wll || '')}</td>
                  <td class="table-edit-cell" data-label="${t('nextInspection')}">
                    <input class="toolbar-input table-inline-input table-date-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="date" value="${escapeHtml(item.nextInspection || '')}" ${canEditRegister() ? '' : 'disabled'}>
                  </td>
                  <td class="table-edit-cell" data-label="${t('notes')}">
                    <input class="toolbar-input table-inline-input table-notes-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="text" value="${escapeHtml(item.notes || '')}" placeholder="${escapeHtml(t('notesPlaceholder'))}" ${canEditRegister() ? '' : 'disabled'}>
                  </td>
                  <td class="table-edit-cell" data-label="${t('actions')}">
                    <div class="table-actions-cell">
                      ${canEditRegister() ? `<button class="mini-btn table-save-btn" data-tag-id="${escapeHtml(item.tagId || '')}">${t('saveChanges')}</button>
                      <button class="mini-btn table-delete-btn" data-tag-id="${escapeHtml(item.tagId || '')}">${t('deleteItem')}</button>` : ''}
                      <div class="table-row-status muted" data-tag-id="${escapeHtml(item.tagId || '')}"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        bindTableEditors();
        if(lastSavedTagId){
          const row = container.querySelector(`tr[data-tag-id="${CSS.escape(lastSavedTagId)}"]`);
          if(row){
            row.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      } catch (e) {
        container.innerHTML = `<div class="empty-text">${t('tableLoadError')}</div>`;
        pushDebugLine(`Items table load error: ${e.message}`);
        console.error(e);
      }
    }

    function escapeHtml(value){
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function openScreen(screenId){
      el('homeScreen').style.display = 'none';
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      el(screenId).classList.add('active');
      clearStatuses();

      if(screenId === 'scanScreen'){
        el('scanResult').classList.remove('active');
        currentScannedItem = null;
        populateScanEditForm(null);
      }
    }

    function goHome(){
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      el('homeScreen').style.display = 'flex';
      clearStatuses();
      currentScannedItem = null;
      registerAccessRole = '';
      pendingRegisterRole = 'engineer';
      populateScanEditForm(null);
      updateRegisterAccessUi();
    }

    function clearStatuses(){
      el('scanStatus').textContent = t('waitingForScan');
      el('registerStatus').textContent = t('waitingForScan');
      el('saveStatus').textContent = '';
      el('passwordStatus').textContent = '';
      el('scanEditStatusText').textContent = '';
    }

    function updatePreviewImage(src){
      el('selectedImagePreview').src = src;
    }

    function triggerImagePicker(){
      el('itemImageInput').click();
    }

    function clearCustomImage(){
      customImageSrc = '';
      pendingImageTask = null;
      el('itemImageInput').value = '';
      selectImageByType();
    }

    function openPasswordScreen(){
      passwordContext = 'register';
      pendingRegisterRole = 'engineer';
      openScreen('passwordScreen');
      el('passwordInput').value = '';
      el('passwordStatus').textContent = '';
      setLang(currentLang);
    }

    function selectRegisterRole(role){
      pendingRegisterRole = role;
      setLang(currentLang);
    }

    function checkPassword(){
      const enteredPassword = String(el('passwordInput').value || '').trim();
      const expectedPassword = pendingRegisterRole === 'foreman' ? FOREMAN_PASSWORD : ENGINEER_PASSWORD;

      if(enteredPassword !== expectedPassword){
        el('passwordStatus').textContent = t('passwordWrong');
        return;
      }

      pushDebugLine(`Register access granted for ${pendingRegisterRole || 'engineer'}.`);
      registerAccessRole = pendingRegisterRole || 'engineer';
      el('passwordInput').value = '';
      el('passwordStatus').textContent = '';
      openScreen('registerScreen');
      openRegisterTab('registerPane');
      updateRegisterAccessUi();
    }

    function openRegisterTab(tabId){
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      el(tabId).classList.add('active');

      if(tabId === 'registerPane'){
        el('tabRegisterBtn').classList.add('active');
      } else if(tabId === 'tablePane'){
        el('tabTableBtn').classList.add('active');
      } else {
        el('tabLogsBtn').classList.add('active');
      }
    }

    function clearForm(){
      el('tagId').value = '';
      el('itemType').value = '׳©׳׳§׳';
      el('description').value = '';
      el('serialNumber').value = '';
      el('wll').value = '';
      el('nextInspection').value = '';
      el('itemStatus').value = '׳×׳§׳™׳';
      el('notes').value = '';
      customImageSrc = '';
      pendingImageTask = null;
      el('itemImageInput').value = '';
      selectImageByType();
      updateStatusColorSelect();
      el('registerStatus').textContent = t('waitingForScan');
      el('saveStatus').textContent = '';
    }

    function clearTableFilters(){
      tableFilters.query = '';
      tableFilters.status = 'all';
      el('tableSearchInput').value = '';
      el('tableStatusFilter').value = 'all';
      renderItemsTable();
    }

    async function applyUrlTestState(){
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');
      const screenParam = params.get('screen');
      const tabParam = params.get('tab');

      if (langParam && LANG[langParam]) {
        setLang(langParam);
      }

      if (screenParam === 'password') {
        openPasswordScreen();
        return;
      }

      if (screenParam === 'scan') {
        openScreen('scanScreen');
        return;
      }

      if (screenParam === 'register') {
        openScreen('registerScreen');

        if (tabParam === 'table') {
          openRegisterTab('tablePane');
          await renderItemsTable();
          return;
        }

        if (tabParam === 'logs') {
          openRegisterTab('logsPane');
          await renderScanLogs();
          return;
        }

        openRegisterTab('registerPane');
        return;
      }

      goHome();
    }

    function selectImageByType(){
      const type = el('itemType').value || '׳׳—׳¨';
      updatePreviewImage(customImageSrc || getDefaultImageForType(type));
    }

    function updateStatusColorSelect(){
      const select = el('itemStatus');
      select.classList.remove('status-ok','status-warn','status-bad');

      if(select.value === '׳×׳§׳™׳'){
        select.classList.add('status-ok');
      } else if(select.value === '׳׳‘׳“׳™׳§׳”'){
        select.classList.add('status-warn');
      } else if(select.value === '׳׳•׳©׳‘׳×'){
        select.classList.add('status-bad');
      }
    }

    function fillScanCard(item){
      currentScannedItem = item;
      el('scanItemImage').src = getDisplayImageSrc(item);
      el('scanItemType').textContent = translateType(item.itemType);
      el('scanTagId').textContent = item.tagId || '-';
      el('scanDescription').textContent = item.description || '-';
      el('scanSerial').textContent = item.serialNumber || '-';
      el('scanWll').textContent = item.wll || '-';
      el('scanNextInspection').textContent = item.nextInspection || '-';
      el('scanItemStatus').textContent = translateStatus(item.status);
      applyStatusColor(el('scanItemStatus'), item.status);
      el('scanNotes').textContent = item.notes || '-';
      el('scanResult').classList.add('active');
      populateScanEditForm(item);
    }

    async function saveScanItemEdits(){
      if(!canEditRegister()){
        el('scanEditStatusText').textContent = t('scanEditNoPermission');
        return;
      }

      if(!currentScannedItem){
        el('scanEditStatusText').textContent = t('scanEditNeedItem');
        return;
      }

      const originalTagId = String(currentScannedItem.tagId || '').trim();
      const nextTagId = String(el('scanEditTagId').value || '').trim();

      if(!nextTagId){
        el('scanEditStatusText').textContent = t('needTag');
        return;
      }

      el('scanEditStatusText').textContent = t('saving');

      try {
        if(nextTagId !== originalTagId){
          const tagConflict = await getItemByTag(nextTagId);
          if(tagConflict){
            el('scanEditStatusText').textContent = t('scanEditTagConflict');
            return;
          }
        }

        const updatedItem = {
          ...currentScannedItem,
          tagId: nextTagId,
          itemType: el('scanEditItemType').value,
          description: el('scanEditDescription').value.trim(),
          serialNumber: el('scanEditSerial').value.trim(),
          wll: el('scanEditWll').value.trim(),
          nextInspection: el('scanEditNextInspection').value,
          status: el('scanEditStatus').value,
          notes: el('scanEditNotes').value.trim(),
          updatedAt: new Date().toLocaleString()
        };

        await saveItemToCloud(updatedItem);
        if(nextTagId !== originalTagId){
          await deleteDoc(doc(db, ITEMS_COLLECTION, originalTagId));
          invalidateItemsCache();
        }

        currentScannedItem = updatedItem;
        lastSavedTagId = updatedItem.tagId;
        fillScanCard(updatedItem);
        el('scanEditStatusText').textContent = t('scanItemUpdated');
        await renderItemsTable();
      } catch (error) {
        pushDebugLine(`Scan edit save error: ${error.message}`);
        el('scanEditStatusText').textContent = t('cloudSaveError');
        console.error(error);
      }
    }

    function fillRegisterForm(item){
      el('tagId').value = item.tagId || '';
      el('itemType').value = item.itemType || '׳©׳׳§׳';
      el('description').value = item.description || '';
      el('serialNumber').value = item.serialNumber || '';
      el('wll').value = item.wll || '';
      el('nextInspection').value = item.nextInspection || '';
      el('itemStatus').value = item.status || '׳×׳§׳™׳';
      el('notes').value = item.notes || '';
      customImageSrc = item.imageSrc && !isLibraryImageSrc(item.imageSrc) ? item.imageSrc : '';
      pendingImageTask = null;
      el('itemImageInput').value = '';
      selectImageByType();
      updateStatusColorSelect();
    }

    async function saveItem(){
      if(!canEditRegister()){
        el('saveStatus').textContent = t('scanEditNoPermission');
        return;
      }

      const tagId = String(el('tagId').value || '').trim();

      if(!tagId){
        el('saveStatus').textContent = t('needTag');
        return;
      }

      if(pendingImageTask){
        el('saveStatus').textContent = t('saving');
        try {
          await pendingImageTask;
        } catch (e) {
          pushDebugLine(`Image preparation error before save: ${e.message}`);
          el('saveStatus').textContent = t('cloudSaveError');
          return;
        }
      }

      const existing = await getItemByTag(tagId);
      const item = {
        tagId,
        itemType: el('itemType').value,
        description: el('description').value.trim(),
        serialNumber: el('serialNumber').value.trim(),
        wll: el('wll').value.trim(),
        nextInspection: el('nextInspection').value,
        status: el('itemStatus').value,
        notes: el('notes').value.trim(),
      imageSrc: customImageSrc || getDefaultImageForType(el('itemType').value),
        createdAt: existing?.createdAt || new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };

      try {
        await saveItemToCloud(item);
        pushDebugLine(`Save flow completed for ${tagId}.`);
        el('saveStatus').textContent = existing ? t('itemUpdated') : t('itemSaved');
        lastSavedTagId = tagId;
        clearForm();
        clearTableFilters();
        openRegisterTab('tablePane');
        await renderItemsTable();
      } catch (e) {
        pushDebugLine(`Save error for ${tagId}: ${e.message}`);
        el('saveStatus').textContent = t('cloudSaveError');
        console.error(e);
      }
    }

    async function demoScan(){
      try {
        const items = await getItems();

        if(!items.length){
          currentScannedItem = null;
          populateScanEditForm(null);
          el('scanResult').classList.remove('active');
          el('scanStatus').textContent = t('noItemsForDemo');
          return;
        }

        const item = getNewestItem(items) || items[0];
        await saveScanLog(item.tagId, true, item);
        pushDebugLine(`Demo scan used newest item ${item.tagId}.`);
        el('scanStatus').textContent = t('demoMode');
        fillScanCard(item);
        renderScanLogs();
      } catch (e) {
        pushDebugLine(`Demo scan error: ${e.message}`);
        el('scanStatus').textContent = t('cloudReadError');
        console.error(e);
      }
    }

    async function startScan(mode){
      const statusEl = mode === 'scan' ? el('scanStatus') : el('registerStatus');

      if(!('NDEFReader' in window)){
        pushDebugLine('Web NFC is not available on this device/browser.');
        statusEl.textContent = t('noWebNfc');
        return;
      }

      try{
        const ndef = new NDEFReader();
        await ndef.scan();
        pushDebugLine(`Started NFC scan in ${mode} mode.`);
        statusEl.textContent = t('waitingForNfcTag');

        ndef.onreadingerror = () => {
          pushDebugLine('NFC tag detected but reading failed.');
          statusEl.textContent = t('scanReadError');
        };

        ndef.onreading = async ({ serialNumber }) => {
          const tagId = String(serialNumber || '').trim() || 'NFC-UNKNOWN';
          pushDebugLine(`NFC read tag ${tagId} in ${mode} mode.`);

          try {
            const found = await getItemByTag(tagId);
            await saveScanLog(tagId, !!found, found);

            if(mode === 'scan'){
              if(found){
                statusEl.textContent = t('itemFound');
                fillScanCard(found);
              } else {
                currentScannedItem = null;
                populateScanEditForm(null);
                el('scanResult').classList.remove('active');
                statusEl.textContent = t('itemNotFound');
              }
            } else {
              el('tagId').value = tagId;
              if(found){
                statusEl.textContent = t('existingTag');
                fillRegisterForm(found);
              } else {
                statusEl.textContent = t('newTag');
                updateStatusColorSelect();
              }
            }

            renderScanLogs();
          } catch (e) {
            pushDebugLine(`NFC processing error for ${tagId}: ${e.message}`);
            statusEl.textContent = t('cloudReadError');
            console.error(e);
          }
        };
      } catch(err){
        pushDebugLine(`Could not start scan: ${err.message}`);
        statusEl.textContent = t('scanStartError');
      }
    }

    el('itemType').addEventListener('change', selectImageByType);
    el('itemStatus').addEventListener('change', updateStatusColorSelect);
    el('itemImageInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if(!file){
        return;
      }

      pendingImageTask = buildCompressedImageDataUrl(file)
        .then((dataUrl) => {
          customImageSrc = dataUrl;
      updatePreviewImage(customImageSrc || getDefaultImageForType(el('itemType').value));
          pushDebugLine(`Image selected for current item: ${file.name}`);
          pendingImageTask = null;
        })
        .catch((error) => {
          pushDebugLine(`Image read failed: ${error.message || 'Unknown error'}`);
          pendingImageTask = null;
          throw error;
        });
    });
    el('tableSearchInput').addEventListener('input', (event) => {
      tableFilters.query = event.target.value || '';
      renderItemsTable();
    });
    el('tableStatusFilter').addEventListener('change', (event) => {
      tableFilters.status = event.target.value || 'all';
      renderItemsTable();
    });

    window.addEventListener('error', (event) => {
      pushDebugLine(`Runtime error: ${event.message}`);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason?.message || String(event.reason || 'Unknown promise rejection');
      pushDebugLine(`Unhandled promise rejection: ${reason}`);
    });

    window.setLang = setLang;
    window.openScreen = openScreen;
    window.openPasswordScreen = openPasswordScreen;
    window.goHome = goHome;
    window.checkPassword = checkPassword;
    window.openRegisterTab = openRegisterTab;
    window.clearForm = clearForm;
    window.clearTableFilters = clearTableFilters;
    window.toggleDebugPanel = toggleDebugPanel;
    window.copyDebugInfo = copyDebugInfo;
    window.saveItem = saveItem;
    window.saveScanItemEdits = saveScanItemEdits;
    window.saveTableRow = saveTableRow;
    window.deleteTableRow = deleteTableRow;
    window.triggerImagePicker = triggerImagePicker;
    window.clearCustomImage = clearCustomImage;
    window.toggleTableSort = toggleTableSort;
    window.exportTableCsv = exportTableCsv;
    window.demoScan = demoScan;
    window.startScan = startScan;
    window.renderItemsTable = renderItemsTable;
    window.renderScanLogs = renderScanLogs;

    async function bootApp(){
      setLang(currentLang);
      clearStatuses();
      selectImageByType();
      updateStatusColorSelect();
      updateRegisterAccessUi();
      await renderScanLogs();
      await renderItemsTable();
      await applyUrlTestState();
      refreshDebugPanel();
      pushDebugLine('App boot completed.');
    }

    bootApp();
