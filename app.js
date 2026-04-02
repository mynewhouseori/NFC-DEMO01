    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
    import {
      getFirestore,
      collection,
      doc,
      setDoc,
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
    const TYPE_VALUES = {
      shackle: '׳©׳׳§׳',
      strap: '׳¨׳¦׳•׳¢׳”',
      chain: '׳©׳¨׳©׳¨׳×',
      ring: '׳˜׳‘׳¢׳×',
      hook: '׳•׳•',
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
      "׳©׳׳§׳":"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='32' fill='%23f8fafc'/%3E%3Crect x='24' y='24' width='352' height='352' rx='28' fill='white' stroke='%23dbe4ea' stroke-width='6'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%23ecfeff' stroke='%230f766e' stroke-width='6'/%3E%3Ctext x='200' y='170' font-size='82' text-anchor='middle'%3Eנ”—%3C/text%3E%3Crect x='70' y='258' width='260' height='58' rx='16' fill='%230f766e' opacity='0.12'/%3E%3Ctext x='200' y='296' font-size='34' text-anchor='middle' fill='%231f2937' font-family='Arial, sans-serif'%3E׳©׳׳§׳%3C/text%3E%3C/svg%3E",
      "׳¨׳¦׳•׳¢׳”":"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='32' fill='%23f8fafc'/%3E%3Crect x='24' y='24' width='352' height='352' rx='28' fill='white' stroke='%23dbe4ea' stroke-width='6'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%23ecfeff' stroke='%230f766e' stroke-width='6'/%3E%3Ctext x='200' y='170' font-size='82' text-anchor='middle'%3Eנ×¢%3C/text%3E%3Crect x='70' y='258' width='260' height='58' rx='16' fill='%230f766e' opacity='0.12'/%3E%3Ctext x='200' y='296' font-size='34' text-anchor='middle' fill='%231f2937' font-family='Arial, sans-serif'%3E׳¨׳¦׳•׳¢׳”%3C/text%3E%3C/svg%3E",
      "׳©׳¨׳©׳¨׳×":"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='32' fill='%23f8fafc'/%3E%3Crect x='24' y='24' width='352' height='352' rx='28' fill='white' stroke='%23dbe4ea' stroke-width='6'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%23ecfeff' stroke='%230f766e' stroke-width='6'/%3E%3Ctext x='200' y='170' font-size='82' text-anchor='middle'%3Eג›“ן¸%3C/text%3E%3Crect x='70' y='258' width='260' height='58' rx='16' fill='%230f766e' opacity='0.12'/%3E%3Ctext x='200' y='296' font-size='34' text-anchor='middle' fill='%231f2937' font-family='Arial, sans-serif'%3E׳©׳¨׳©׳¨׳×%3C/text%3E%3C/svg%3E",
      "׳˜׳‘׳¢׳×":"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='32' fill='%23f8fafc'/%3E%3Crect x='24' y='24' width='352' height='352' rx='28' fill='white' stroke='%23dbe4ea' stroke-width='6'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%23ecfeff' stroke='%230f766e' stroke-width='6'/%3E%3Ctext x='200' y='170' font-size='82' text-anchor='middle'%3Eג­•%3C/text%3E%3Crect x='70' y='258' width='260' height='58' rx='16' fill='%230f766e' opacity='0.12'/%3E%3Ctext x='200' y='296' font-size='34' text-anchor='middle' fill='%231f2937' font-family='Arial, sans-serif'%3E׳˜׳‘׳¢׳×%3C/text%3E%3C/svg%3E",
      "׳•׳•":"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='32' fill='%23f8fafc'/%3E%3Crect x='24' y='24' width='352' height='352' rx='28' fill='white' stroke='%23dbe4ea' stroke-width='6'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%23ecfeff' stroke='%230f766e' stroke-width='6'/%3E%3Ctext x='200' y='170' font-size='82' text-anchor='middle'%3Eנ×%3C/text%3E%3Crect x='70' y='258' width='260' height='58' rx='16' fill='%230f766e' opacity='0.12'/%3E%3Ctext x='200' y='296' font-size='34' text-anchor='middle' fill='%231f2937' font-family='Arial, sans-serif'%3E׳•׳•%3C/text%3E%3C/svg%3E",
      "׳׳—׳¨":"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' rx='32' fill='%23f8fafc'/%3E%3Crect x='24' y='24' width='352' height='352' rx='28' fill='white' stroke='%23dbe4ea' stroke-width='6'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%23ecfeff' stroke='%230f766e' stroke-width='6'/%3E%3Ctext x='200' y='170' font-size='82' text-anchor='middle'%3Eנ“¦%3C/text%3E%3Crect x='70' y='258' width='260' height='58' rx='16' fill='%230f766e' opacity='0.12'/%3E%3Ctext x='200' y='296' font-size='34' text-anchor='middle' fill='%231f2937' font-family='Arial, sans-serif'%3E׳₪׳¨׳™׳˜%3C/text%3E%3C/svg%3E"
    };

    function buildItemImage(iconText, labelText){
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
          <rect width="400" height="400" rx="32" fill="#f8fafc"/>
          <rect x="24" y="24" width="352" height="352" rx="28" fill="white" stroke="#dbe4ea" stroke-width="6"/>
          <circle cx="200" cy="150" r="72" fill="#ecfeff" stroke="#0f766e" stroke-width="6"/>
          <text x="200" y="176" font-size="88" text-anchor="middle" fill="#0f766e" font-family="Arial, sans-serif">${iconText}</text>
          <rect x="70" y="258" width="260" height="58" rx="16" fill="#0f766e" opacity="0.12"/>
          <text x="200" y="296" font-size="30" text-anchor="middle" fill="#1f2937" font-family="Arial, sans-serif">${labelText}</text>
        </svg>
      `;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    Object.assign(IMAGE_LIBRARY, {
      [TYPE_VALUES.shackle]: buildItemImage('S', 'Shackle'),
      [TYPE_VALUES.strap]: buildItemImage('R', 'Strap'),
      [TYPE_VALUES.chain]: buildItemImage('C', 'Chain'),
      [TYPE_VALUES.ring]: buildItemImage('O', 'Ring'),
      [TYPE_VALUES.hook]: buildItemImage('H', 'Hook'),
      [TYPE_VALUES.other]: buildItemImage('I', 'Item')
    });

    const el = (id) => document.getElementById(id);
    const savedLang = localStorage.getItem('lang');
    let currentLang = LANG[savedLang] ? savedLang : 'he';
    const tableFilters = {
      query: '',
      status: 'all'
    };
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
        <option value="׳׳—׳¨">${t('type_other')}</option>
      `;
      el('itemType').value = current;
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
      el('passwordTitle').textContent = t('passwordTitle');
      el('passwordLabel').textContent = t('passwordLabel');
      el('passwordInput').placeholder = t('passwordPlaceholder');
      el('passwordEnterBtn').textContent = t('passwordEnter');

      el('scanBackBtn').textContent = t('back');
      el('scanScreenTitle').textContent = t('scanTitle');
      el('scanNowBtn').textContent = t('scanNow');
      el('demoScanBtn').textContent = t('demoScan');

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
      el('refreshTableBtn').textContent = t('refresh');

      updateTypeOptions();
      updateStatusOptions();
      updateTableFilterOptions();
      selectImageByType();
      renderScanLogs();
      renderItemsTable();
      refreshDebugPanel();

      if(!el('scanStatus').textContent.trim()) el('scanStatus').textContent = t('waitingForScan');
      if(!el('registerStatus').textContent.trim()) el('registerStatus').textContent = t('waitingForScan');
    }

    async function getItems(){
      pushDebugLine('Loading items from Firestore.');
      const snapshot = await getDocs(collection(db, ITEMS_COLLECTION));
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data());
      });
      items.sort((a, b) => (a.tagId || '').localeCompare(b.tagId || ''));
      pushDebugLine(`Loaded ${items.length} items.`);
      return items;
    }

    function updateTableSummary(shownCount, totalCount){
      el('tableSummaryText').textContent = formatText('tableSummary', {
        shown: shownCount,
        total: totalCount
      });
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
    }

    async function getLogs(){
      pushDebugLine('Loading scan logs.');
      const q = query(collection(db, LOGS_COLLECTION), orderBy('sortTime', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const logs = [];
      snapshot.forEach((docSnap) => logs.push(docSnap.data()));
      pushDebugLine(`Loaded ${logs.length} logs.`);
      return logs;
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
        const filteredItems = getFilteredItems(items);

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
                <th>${t('tagId')}</th>
                <th>${t('status')}</th>
                <th>${t('itemType')}</th>
                <th>${t('description')}</th>
                <th>${t('serial')}</th>
                <th>${t('wll')}</th>
                <th>${t('nextInspection')}</th>
                <th>${t('notes')}</th>
                <th>${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => `
                <tr>
                  <td data-label="${t('image')}"><img class="small-thumb" src="${item.imageSrc || IMAGE_LIBRARY[item.itemType] || IMAGE_LIBRARY['׳׳—׳¨']}" alt="item"></td>
                  <td data-label="${t('tagId')}"><span class="mono">${item.tagId || ''}</span></td>
                  <td data-label="${t('status')}">
                    <select class="toolbar-input table-inline-input table-status-select" data-tag-id="${escapeHtml(item.tagId || '')}">
                      ${getStatusOptionsMarkup(item.status)}
                    </select>
                  </td>
                  <td data-label="${t('itemType')}">${translateType(item.itemType)}</td>
                  <td data-label="${t('description')}">${escapeHtml(item.description || '')}</td>
                  <td data-label="${t('serial')}">${escapeHtml(item.serialNumber || '')}</td>
                  <td data-label="${t('wll')}">${escapeHtml(item.wll || '')}</td>
                  <td data-label="${t('nextInspection')}">
                    <input class="toolbar-input table-inline-input table-date-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="date" value="${escapeHtml(item.nextInspection || '')}">
                  </td>
                  <td data-label="${t('notes')}">
                    <input class="toolbar-input table-inline-input table-notes-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="text" value="${escapeHtml(item.notes || '')}" placeholder="${escapeHtml(t('notesPlaceholder'))}">
                  </td>
                  <td data-label="${t('actions')}">
                    <div class="table-actions-cell">
                      <button class="mini-btn table-save-btn" data-tag-id="${escapeHtml(item.tagId || '')}">${t('saveChanges')}</button>
                      <div class="table-row-status muted" data-tag-id="${escapeHtml(item.tagId || '')}"></div>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        bindTableEditors();
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
      }
    }

    function goHome(){
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      el('homeScreen').style.display = 'flex';
      clearStatuses();
    }

    function clearStatuses(){
      el('scanStatus').textContent = t('waitingForScan');
      el('registerStatus').textContent = t('waitingForScan');
      el('saveStatus').textContent = '';
      el('passwordStatus').textContent = '';
    }

    function openPasswordScreen(){
      openScreen('passwordScreen');
      el('passwordInput').value = '';
      el('passwordStatus').textContent = '';
    }

    function checkPassword(){
      pushDebugLine('Password screen accepted in demo mode.');
      el('passwordInput').value = '';
      el('passwordStatus').textContent = '';
      openScreen('registerScreen');
      openRegisterTab('registerPane');
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
      el('selectedImagePreview').src = IMAGE_LIBRARY[type] || IMAGE_LIBRARY['׳׳—׳¨'];
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
      el('scanItemImage').src = item.imageSrc || IMAGE_LIBRARY[item.itemType] || IMAGE_LIBRARY['׳׳—׳¨'];
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
      selectImageByType();
      updateStatusColorSelect();
    }

    async function saveItem(){
      const tagId = String(el('tagId').value || '').trim();

      if(!tagId){
        el('saveStatus').textContent = t('needTag');
        return;
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
        imageSrc: IMAGE_LIBRARY[el('itemType').value] || IMAGE_LIBRARY['׳׳—׳¨'],
        createdAt: existing?.createdAt || new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };

      try {
        await saveItemToCloud(item);
        pushDebugLine(`Save flow completed for ${tagId}.`);
        el('saveStatus').textContent = existing ? t('itemUpdated') : t('itemSaved');
        await renderItemsTable();
        clearForm();
        setTimeout(() => goHome(), 700);
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
          el('scanResult').classList.remove('active');
          el('scanStatus').textContent = t('noItemsForDemo');
          return;
        }

        const item = items[0];
        await saveScanLog(item.tagId, true, item);
        pushDebugLine(`Demo scan used tag ${item.tagId}.`);
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
    window.saveTableRow = saveTableRow;
    window.demoScan = demoScan;
    window.startScan = startScan;
    window.renderItemsTable = renderItemsTable;
    window.renderScanLogs = renderScanLogs;

    async function bootApp(){
      setLang(currentLang);
      clearStatuses();
      selectImageByType();
      updateStatusColorSelect();
      await renderScanLogs();
      await renderItemsTable();
      await applyUrlTestState();
      refreshDebugPanel();
      pushDebugLine('App boot completed.');
    }

    bootApp();
