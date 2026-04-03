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
    const REPORT_TEXT = {
      he: {
        exportReport: 'דוח מצב',
        reportTitle: 'דוח מצב ציוד',
        reportGeneratedAt: 'הדוח הופק בתאריך {date}',
        reportExecutiveSummary: 'סיכום מנהלים',
        reportExecutiveText: 'נכון לעכשיו קיימים {total} פריטים במערכת: {ok} תקינים, {review} לבדיקה ו-{disabled} מושבתים.',
        reportTotalItems: 'סה״כ פריטים',
        reportOverdue: 'באיחור לבדיקה',
        reportDueSoon: 'בדיקה ב-30 הימים הקרובים',
        reportOverdueLine: '{count} פריטים עברו את תאריך הבדיקה הבא.',
        reportUpcomingLine: '{count} פריטים צפויים לבדיקה במהלך 30 הימים הקרובים.',
        reportMissingDateLine: '{count} פריטים ללא תאריך בדיקה הבא.',
        reportPriorityTable: 'פריטים הדורשים תשומת לב',
        reportUrgency: 'רמת טיפול',
        reportOverdueDays: 'איחור של {days} ימים',
        reportUpcomingDays: 'בעוד {days} ימים',
        reportNoUrgentItems: 'אין כרגע פריטים דחופים להצגה.',
        reportFooter: 'הדוח נוצר אוטומטית ממסך הטבלה לצורכי הצגה, בקרה ושיתוף.'
      },
      en: {
        exportReport: 'Status Report',
        reportTitle: 'Equipment Status Report',
        reportGeneratedAt: 'Report generated on {date}',
        reportExecutiveSummary: 'Executive Summary',
        reportExecutiveText: 'There are currently {total} items in the system: {ok} OK, {review} needing review, and {disabled} disabled.',
        reportTotalItems: 'Total Items',
        reportOverdue: 'Overdue for Inspection',
        reportDueSoon: 'Due Within 30 Days',
        reportOverdueLine: '{count} items are past their next inspection date.',
        reportUpcomingLine: '{count} items are due for inspection within the next 30 days.',
        reportMissingDateLine: '{count} items are missing a next inspection date.',
        reportPriorityTable: 'Priority Items',
        reportUrgency: 'Action Level',
        reportOverdueDays: 'Overdue by {days} days',
        reportUpcomingDays: 'Due in {days} days',
        reportNoUrgentItems: 'There are currently no urgent items to display.',
        reportFooter: 'This report was generated automatically from the table view for presentation and follow-up.'
      },
      ar: {
        exportReport: 'تقرير حالة',
        reportTitle: 'تقرير حالة المعدات',
        reportGeneratedAt: 'تم إنشاء التقرير بتاريخ {date}',
        reportExecutiveSummary: 'ملخص تنفيذي',
        reportExecutiveText: 'يوجد حالياً {total} معدة في النظام: {ok} سليمة، {review} بحاجة إلى فحص، و {disabled} معطلة.',
        reportTotalItems: 'إجمالي المعدات',
        reportOverdue: 'متأخرة للفحص',
        reportDueSoon: 'فحص خلال 30 يوماً',
        reportOverdueLine: '{count} معدات تجاوزت تاريخ الفحص القادم.',
        reportUpcomingLine: '{count} معدات مطلوب فحصها خلال 30 يوماً القادمة.',
        reportMissingDateLine: '{count} معدات بدون تاريخ فحص قادم.',
        reportPriorityTable: 'معدات تحتاج إلى متابعة',
        reportUrgency: 'مستوى المعالجة',
        reportOverdueDays: 'متأخر {days} يوماً',
        reportUpcomingDays: 'خلال {days} يوماً',
        reportNoUrgentItems: 'لا توجد حالياً معدات عاجلة للعرض.',
        reportFooter: 'تم إنشاء هذا التقرير تلقائياً من شاشة الجدول لأغراض العرض والمتابعة.'
      }
    };
    const LOCATION_TEXT = {
      he: {
        lastSeenLocation: 'מיקום אחרון',
        locationUnavailable: 'לא זמין',
        locationPending: 'מאמת מיקום...',
        locationSaved: 'המיקום נשמר',
        locationCoords: 'קו רוחב {lat}, קו אורך {lng}',
        locationAccuracy: 'דיוק משוער {meters} מ׳',
        locationAt: 'עודכן {time}'
      },
      en: {
        lastSeenLocation: 'Last Location',
        locationUnavailable: 'Unavailable',
        locationPending: 'Checking location...',
        locationSaved: 'Location saved',
        locationCoords: 'Lat {lat}, Lng {lng}',
        locationAccuracy: 'Approx. accuracy {meters} m',
        locationAt: 'Updated {time}'
      },
      ar: {
        lastSeenLocation: 'آخر موقع',
        locationUnavailable: 'غير متاح',
        locationPending: 'جارٍ التحقق من الموقع...',
        locationSaved: 'تم حفظ الموقع',
        locationCoords: 'خط العرض {lat}، خط الطول {lng}',
        locationAccuracy: 'دقة تقريبية {meters} م',
        locationAt: 'تم التحديث {time}'
      }
    };
    LANG.ar.registrationDate = LANG.ar.registrationDate || 'تاريخ التسجيل الأولي';
    const IMAGE_VERSION = '20260403f';
    const withImageVersion = (path) => `${path}?v=${IMAGE_VERSION}`;
    const IMAGE_PATHS = {
      shackle: './תמונות/shackle.jpg',
      strap: './תמונות/strap.jpg',
      chain: './תמונות/chain.jpg',
      ring: './תמונות/ring.jpg',
      hook: './תמונות/hook.jpg',
      fire: './תמונות/fire.jpg',
      aircomp: './תמונות/aircomp.jpg'
    };
    const IMAGE_LIBRARY = {
      "׳©׳׳§׳": withImageVersion(IMAGE_PATHS.shackle),
      "׳¨׳¦׳•׳¢׳”": withImageVersion(IMAGE_PATHS.strap),
      "׳©׳¨׳©׳¨׳×": withImageVersion(IMAGE_PATHS.chain),
      "׳˜׳‘׳¢׳×": withImageVersion(IMAGE_PATHS.ring),
      "׳•׳•": withImageVersion(IMAGE_PATHS.hook),
      "מטף כיבוי אש": withImageVersion(IMAGE_PATHS.fire),
      "מדחס אויר": withImageVersion(IMAGE_PATHS.aircomp),
      "׳׳—׳¨": withImageVersion(IMAGE_PATHS.shackle)
    };
    const IMAGE_TYPE_ALIASES = {
      "׳©׳׳§׳": withImageVersion(IMAGE_PATHS.shackle),
      "שאקל": withImageVersion(IMAGE_PATHS.shackle),
      "shackle": withImageVersion(IMAGE_PATHS.shackle),
      "׳¨׳¦׳•׳¢׳”": withImageVersion(IMAGE_PATHS.strap),
      "רצועה": withImageVersion(IMAGE_PATHS.strap),
      "strap": withImageVersion(IMAGE_PATHS.strap),
      "׳©׳¨׳©׳¨׳×": withImageVersion(IMAGE_PATHS.chain),
      "שרשרת": withImageVersion(IMAGE_PATHS.chain),
      "chain": withImageVersion(IMAGE_PATHS.chain),
      "׳˜׳‘׳¢׳×": withImageVersion(IMAGE_PATHS.ring),
      "טבעת": withImageVersion(IMAGE_PATHS.ring),
      "ring": withImageVersion(IMAGE_PATHS.ring),
      "׳•׳•": withImageVersion(IMAGE_PATHS.hook),
      "וו": withImageVersion(IMAGE_PATHS.hook),
      "hook": withImageVersion(IMAGE_PATHS.hook),
      "מטף כיבוי אש": withImageVersion(IMAGE_PATHS.fire),
      "fire extinguisher": withImageVersion(IMAGE_PATHS.fire),
      "מדחס אויר": withImageVersion(IMAGE_PATHS.aircomp),
      "air compressor": withImageVersion(IMAGE_PATHS.aircomp),
      "׳׳—׳¨": withImageVersion(IMAGE_PATHS.shackle),
      "אחר": withImageVersion(IMAGE_PATHS.shackle),
      "other": withImageVersion(IMAGE_PATHS.shackle)
    };

    const el = (id) => document.getElementById(id);
    const savedLang = localStorage.getItem('lang');
    let currentLang = LANG[savedLang] ? savedLang : 'he';
    const APP_COPYRIGHT_YEAR = new Date().getFullYear();
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

    function rt(key){
      return REPORT_TEXT[currentLang]?.[key] || REPORT_TEXT.he[key] || key;
    }

    function lt(key){
      return LOCATION_TEXT[currentLang]?.[key] || LOCATION_TEXT.he[key] || key;
    }

    function formatReportText(key, replacements = {}){
      return Object.entries(replacements).reduce((text, [name, value]) => {
        return text.replaceAll(`{${name}}`, String(value));
      }, rt(key));
    }

    function formatLocationText(key, replacements = {}){
      return Object.entries(replacements).reduce((text, [name, value]) => {
        return text.replaceAll(`{${name}}`, String(value));
      }, lt(key));
    }

    function csvValue(value){
      return `"${String(value ?? '').replaceAll('"', '""')}"`;
    }

    function isLibraryImageSrc(src){
      const srcText = String(src || '');
      const normalizedSrc = srcText.split('?')[0];
      return Object.values(IMAGE_PATHS).includes(normalizedSrc) || Object.values(IMAGE_LIBRARY).includes(srcText) || srcText.startsWith('data:image/svg+xml;utf8,');
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

    function roundCoordinate(value){
      return Number(value || 0).toFixed(5);
    }

    function formatLocationSnapshot(location){
      if(!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number'){
        return '';
      }

      const parts = [
        formatLocationText('locationCoords', {
          lat: roundCoordinate(location.latitude),
          lng: roundCoordinate(location.longitude)
        })
      ];

      if(Number.isFinite(Number(location.accuracy))){
        parts.push(formatLocationText('locationAccuracy', {
          meters: Math.round(Number(location.accuracy))
        }));
      }

      if(location.capturedAt){
        parts.push(formatLocationText('locationAt', {
          time: new Date(location.capturedAt).toLocaleString()
        }));
      }

      return parts.join(' • ');
    }

    function getLastSeenLocationText(item){
      if(!item?.lastSeenLocation){
        return lt('locationUnavailable');
      }

      return item.lastSeenLocation.label || formatLocationSnapshot(item.lastSeenLocation) || lt('locationUnavailable');
    }

    function getCurrentLocationSnapshot(){
      return new Promise((resolve) => {
        if(!navigator.geolocation){
          pushDebugLine('Geolocation is not available on this device/browser.');
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
          const snapshot = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString()
          };
          snapshot.label = formatLocationSnapshot(snapshot);
          pushDebugLine(`Location captured: ${snapshot.label}`);
          resolve(snapshot);
        }, (error) => {
          pushDebugLine(`Location unavailable: ${error.message}`);
          resolve(null);
        }, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        });
      });
    }

    async function attachLastSeenToItem(item, locationSnapshot){
      if(!item || !locationSnapshot){
        return item;
      }

      const updatedItem = {
        ...item,
        lastSeenLocation: locationSnapshot,
        lastSeenAt: locationSnapshot.capturedAt,
        updatedAt: new Date().toLocaleString()
      };

      await saveItemToCloud(updatedItem);
      return updatedItem;
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

      [
        'tagId',
        'itemType',
        'description',
        'serialNumber',
        'wll',
        'registrationDate',
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
        el('scanEditRegistrationDate').value = '';
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
      el('scanEditRegistrationDate').value = getRegistrationDateValue(item);
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
      el('legalCopyrightText').textContent = formatText('legalCopyright', { year: APP_COPYRIGHT_YEAR });
      el('legalOpenBtn').textContent = t('legalOpen');
      el('legalTitleText').textContent = t('legalTitle');
      el('legalCloseBtn').textContent = t('legalClose');
      el('legalIntroText').textContent = t('legalIntro');
      el('legalLine1Text').textContent = t('legalLine1');
      el('legalLine2Text').textContent = t('legalLine2');
      el('legalLine3Text').textContent = t('legalLine3');
      el('legalLine4Text').textContent = t('legalLine4');
      el('legalLine5Text').textContent = t('legalLine5');
      el('legalDisclaimerText').textContent = t('legalDisclaimer');

      el('passwordBackBtn').textContent = t('back');
      if(passwordContext === 'register'){
        el('passwordTitle').textContent = t('passwordTitle');
        el('passwordRoleHint').textContent = '';
        el('engineerLoginTitleText').textContent = t('engineerLoginTitle');
        el('engineerRoleHintText').textContent = t('engineerRoleHint');
        el('engineerPasswordLabelText').textContent = t('engineerPasswordLabel');
        el('engineerEnterBtn').textContent = t('passwordEnter');
        el('foremanLoginTitleText').textContent = t('foremanLoginTitle');
        el('foremanRoleHintText').textContent = t('foremanRoleHint');
        el('foremanPasswordLabelText').textContent = t('foremanPasswordLabel');
        el('foremanEnterBtn').textContent = t('passwordEnter');
      } else {
        el('passwordTitle').textContent = t('passwordTitle');
        el('passwordRoleHint').textContent = '';
      }
      if(el('engineerPasswordInput')){
        el('engineerPasswordInput').placeholder = t('passwordPlaceholder');
      }
      if(el('foremanPasswordInput')){
        el('foremanPasswordInput').placeholder = t('passwordPlaceholder');
      }

      el('scanBackBtn').textContent = t('back');
      el('scanScreenTitle').textContent = t('scanTitle');
      el('scanNowBtn').textContent = t('scanNow');
      el('demoScanBtn').textContent = t('demoScan');
      el('scanEditTitle').textContent = t('scanEditTitle');
      el('scanEditTagIdLabel').textContent = t('tagId');
      el('scanEditItemTypeLabel').textContent = t('itemType');
      el('scanEditDescriptionLabel').textContent = t('description');
      el('scanEditSerialLabel').textContent = t('serial');
      el('scanEditWllLabel').textContent = t('wll');
      el('scanEditRegistrationDateLabel').textContent = t('registrationDate');
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
      el('registrationDateLabel').textContent = t('registrationDate');
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
      el('lblLastSeenLocation').textContent = lt('lastSeenLocation');

      el('tableTitleText').textContent = t('tableTitle');
      el('tableSummaryText').textContent = formatText('tableSummary', { shown: 0, total: 0 });
      el('tableSearchInput').placeholder = t('tableSearchPlaceholder');
      el('tableSearchInput').setAttribute('aria-label', t('tableSearchPlaceholder'));
      el('tableStatusFilter').setAttribute('aria-label', t('tableStatusFilterLabel'));
      el('clearTableFiltersBtn').textContent = t('clearTableFilters');
      el('exportReportBtn').textContent = rt('exportReport');
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
      if(key === 'registrationDate') return getRegistrationDateValue(item);
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
      const registrationDateInput = document.querySelector(`.table-registration-date-input[data-tag-id="${safeTagId}"]`);
      const dateInput = document.querySelector(`.table-date-input[data-tag-id="${safeTagId}"]`);
      const notesInput = document.querySelector(`.table-notes-input[data-tag-id="${safeTagId}"]`);
      const statusNode = document.querySelector(`.table-row-status[data-tag-id="${safeTagId}"]`);

      if(!statusInput || !registrationDateInput || !dateInput || !notesInput || !statusNode){
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
          registrationDate: registrationDateInput.value,
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
          t('registrationDate'),
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
          getRegistrationDateValue(item),
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

    function parseInspectionDate(value){
      const text = String(value || '').trim();
      if(!text) return null;
      const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!match) return null;
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    function startOfToday(){
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function daysUntilInspection(value){
      const parsed = parseInspectionDate(value);
      if(!parsed) return null;
      const diff = parsed.getTime() - startOfToday().getTime();
      return Math.round(diff / 86400000);
    }

    function formatReportDate(value){
      const parsed = parseInspectionDate(value);
      if(!parsed) return value || '-';
      return parsed.toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar' : 'he-IL');
    }

    let reportLogoDataUrlPromise = null;

    function getReportLogoDataUrl(){
      if(reportLogoDataUrlPromise){
        return reportLogoDataUrlPromise;
      }

      reportLogoDataUrlPromise = fetch('./logo.jpg')
        .then((response) => {
          if(!response.ok){
            throw new Error(`Logo request failed with status ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result || '');
          reader.onerror = () => reject(new Error('Failed to read logo file.'));
          reader.readAsDataURL(blob);
        }))
        .catch((error) => {
          pushDebugLine(`Report logo unavailable: ${error.message}`);
          return '';
        });

      return reportLogoDataUrlPromise;
    }

    function todayIsoDate(){
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function normalizeRegistrationDate(value){
      const text = String(value || '').trim();
      if(!text) return '';
      if(/^\d{4}-\d{2}-\d{2}$/.test(text)){
        return text;
      }
      const timeValue = toTimeValue(text);
      if(!timeValue){
        return '';
      }
      const parsed = new Date(timeValue);
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function getRegistrationDateValue(item = null){
      return normalizeRegistrationDate(item?.registrationDate || item?.createdAt) || todayIsoDate();
    }

    function getInspectionBucket(item){
      const days = daysUntilInspection(item.nextInspection);
      if(days === null) return 'missing';
      if(days < 0) return 'overdue';
      if(days <= 7) return 'upcoming';
      return 'future';
    }

    function compareInspectionUrgency(itemA, itemB){
      const rankForDays = (days) => {
        if(days === null) return 2;
        if(days < 0) return 0;
        if(days <= 7) return 1;
        return 2;
      };
      const daysA = daysUntilInspection(itemA.nextInspection);
      const daysB = daysUntilInspection(itemB.nextInspection);
      const rankA = rankForDays(daysA);
      const rankB = rankForDays(daysB);
      if(rankA !== rankB) return rankA - rankB;
      if(daysA === null && daysB === null) return 0;
      if(daysA === null) return 1;
      if(daysB === null) return -1;
      return daysA - daysB;
    }

    async function exportPresentationReport(){
      try {
        const items = sortItems(getFilteredItems(await getItems()));
        const reportLogoSrc = await getReportLogoDataUrl();
        const reportLogoUrl = new URL('./logo.jpg', window.location.href).href;
        const total = items.length;
        const okCount = items.filter((item) => normalizeStatus(item.status) === 'ok').length;
        const reviewCount = items.filter((item) => normalizeStatus(item.status) === 'review').length;
        const disabledCount = items.filter((item) => normalizeStatus(item.status) === 'disabled').length;
        const overdueItems = items.filter((item) => getInspectionBucket(item) === 'overdue');
        const upcomingItems = items.filter((item) => getInspectionBucket(item) === 'upcoming');
        const missingDateItems = items.filter((item) => getInspectionBucket(item) === 'missing');
        const reportItems = [...items].sort(compareInspectionUrgency);
        const generatedAt = new Date().toLocaleString(currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar' : 'he-IL');

        const priorityRows = reportItems.length
          ? reportItems.map((item) => {
              const days = daysUntilInspection(item.nextInspection);
              const bucket = getInspectionBucket(item);
              const urgencyText = bucket === 'overdue'
                ? formatReportText('reportOverdueDays', { days: Math.abs(days) })
                : bucket === 'upcoming'
                  ? formatReportText('reportUpcomingDays', { days })
                  : '-';
              const rowClass = bucket === 'overdue' ? 'overdue-row' : bucket === 'upcoming' ? 'upcoming-row' : 'normal-row';
              const badgeClass = bucket === 'overdue'
                ? 'urgency-badge urgency-badge-overdue'
                : bucket === 'upcoming'
                  ? 'urgency-badge urgency-badge-upcoming'
                  : 'urgency-badge urgency-badge-normal';
              return `
                <tr class="${rowClass}">
                  <td>${escapeHtml(item.tagId || '-')}</td>
                  <td>${escapeHtml(translateType(item.itemType))}</td>
                  <td>${escapeHtml(item.description || '-')}</td>
                  <td>${escapeHtml(translateStatus(item.status))}</td>
                  <td>${escapeHtml(formatReportDate(getRegistrationDateValue(item)))}</td>
                  <td>${escapeHtml(formatReportDate(item.nextInspection))}</td>
                  <td><span class="${badgeClass}">${escapeHtml(urgencyText)}</span></td>
                </tr>
              `;
            }).join('')
          : `<tr><td colspan="7">${escapeHtml(rt('reportNoUrgentItems'))}</td></tr>`;

        const buildReportHtml = (logoSrc) => `
          <html dir="${currentLang === 'en' ? 'ltr' : 'rtl'}" lang="${escapeHtml(currentLang)}">
          <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(rt('reportTitle'))}</title>
            <style>
              body { font-family: Arial, sans-serif; color:#0f172a; padding:32px; background:#ffffff; }
              .report-header { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:18px; direction:${currentLang === 'en' ? 'ltr' : 'rtl'}; }
              .report-logo-wrap { flex:0 0 auto; }
              .report-logo { display:block; width:180px; height:180px; object-fit:contain; }
              .report-title-wrap { flex:1 1 auto; }
              h1 { margin:0 0 8px; color:#0f766e; font-size:28px; }
              h2 { margin:28px 0 12px; font-size:18px; color:#111827; }
              p { margin:0 0 10px; line-height:1.7; }
              .subtitle { color:#475569; margin-bottom:18px; }
              .section { border:1px solid #e2e8f0; border-radius:16px; padding:18px; margin-bottom:18px; background:#fff; }
              .highlight { color:#0f766e; font-weight:700; }
              ul { margin:8px 0 0; padding-${currentLang === 'en' ? 'left' : 'right'}:20px; }
              li { margin-bottom:6px; }
              table { width:100%; border-collapse:collapse; margin-top:12px; }
              th, td { border:1px solid #dbe4ea; padding:10px; text-align:${currentLang === 'en' ? 'left' : 'right'}; }
              th { background:#f1f5f9; font-size:13px; }
              .normal-row { background:#ffffff; }
              .overdue-row { background:#fff1f2; }
              .upcoming-row { background:#fdf2f8; }
              .urgency-badge { display:inline-block; padding:4px 10px; border-radius:999px; font-weight:800; }
              .urgency-badge-normal { background:#ffffff; color:#64748b; border:1px solid #dbe4ea; }
              .urgency-badge-overdue { background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; animation:reportPulse 1.2s ease-in-out infinite; }
              .urgency-badge-upcoming { background:#fce7f3; color:#be185d; border:1px solid #f9a8d4; }
              @keyframes reportPulse {
                0% { opacity:1; box-shadow:0 0 0 0 rgba(220,38,38,.30); }
                50% { opacity:.78; box-shadow:0 0 0 6px rgba(220,38,38,.08); }
                100% { opacity:1; box-shadow:0 0 0 0 rgba(220,38,38,0); }
              }
              .footer { margin-top:18px; color:#64748b; font-size:12px; }
            </style>
          </head>
          <body>
            <div class="report-header">
              ${logoSrc ? `<div class="report-logo-wrap"><img class="report-logo" src="${logoSrc}" alt="Logo"></div>` : ''}
              <div class="report-title-wrap">
                <h1>${escapeHtml(rt('reportTitle'))}</h1>
                <p class="subtitle">${escapeHtml(formatReportText('reportGeneratedAt', { date: generatedAt }))}</p>
              </div>
            </div>

            <div class="section">
              <h2>${escapeHtml(rt('reportExecutiveSummary'))}</h2>
              <p>${escapeHtml(formatReportText('reportExecutiveText', {
                total,
                ok: okCount,
                review: reviewCount,
                disabled: disabledCount
              }))}</p>
              <ul>
                <li>${escapeHtml(formatReportText('reportOverdueLine', { count: overdueItems.length }))}</li>
                <li>${escapeHtml(formatReportText('reportUpcomingLine', { count: upcomingItems.length }))}</li>
                <li>${escapeHtml(formatReportText('reportMissingDateLine', { count: missingDateItems.length }))}</li>
              </ul>
            </div>

            <div class="section">
              <h2>${escapeHtml(rt('reportPriorityTable'))}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(t('tagId'))}</th>
                    <th>${escapeHtml(t('itemType'))}</th>
                    <th>${escapeHtml(t('description'))}</th>
                    <th>${escapeHtml(t('status'))}</th>
                    <th>${escapeHtml(t('registrationDate'))}</th>
                    <th>${escapeHtml(t('nextInspection'))}</th>
                    <th>${escapeHtml(rt('reportUrgency'))}</th>
                  </tr>
                </thead>
                <tbody>${priorityRows}</tbody>
              </table>
            </div>

            <div class="footer">${escapeHtml(rt('reportFooter'))}</div>
          </body>
          </html>
        `;

        const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
        const reportHtml = buildReportHtml(reportLogoSrc || reportLogoUrl);
        const exportDocHtml = buildReportHtml(reportLogoUrl || reportLogoSrc);

        if(isMobileDevice){
          const reportDate = new Date().toISOString().slice(0, 10);
          const mobileFile = new File(
            ['\uFEFF', exportDocHtml],
            `nfc-status-report-${reportDate}.doc`,
            { type: 'application/msword' }
          );
          const shareTitle = rt('reportTitle');
          const shareText = currentLang === 'en'
            ? 'Share the equipment status report'
            : currentLang === 'ar'
              ? 'مشاركة تقرير حالة المعدات'
              : 'שתף את דוח מצב הציוד';

          if(navigator.canShare && navigator.canShare({ files: [mobileFile] }) && navigator.share){
            try {
              await navigator.share({
                title: shareTitle,
                text: shareText,
                files: [mobileFile]
              });
              pushDebugLine(`Shared presentation report for ${items.length} items.`);
              return;
            } catch (shareError) {
              pushDebugLine(`Mobile share fallback: ${shareError.message}`);
            }
          }

          const mobileHtml = reportHtml.replace(
            '<body>',
            `<body><div style="margin-bottom:16px;"><button onclick="window.print()" style="border:none;border-radius:12px;padding:12px 16px;background:#0f766e;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">${escapeHtml(currentLang === 'en' ? 'Print / Save PDF' : currentLang === 'ar' ? 'طباعة / حفظ PDF' : 'הדפס / שמור PDF')}</button></div>`
          );
          const blob = new Blob([mobileHtml], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
          const blob = new Blob(['\uFEFF', exportDocHtml], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `nfc-status-report-${new Date().toISOString().slice(0, 10)}.doc`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        }
        pushDebugLine(`Exported presentation report for ${items.length} items.`);
      } catch (e) {
        pushDebugLine(`Report export error: ${e.message}`);
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
          getRegistrationDateValue(item),
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

    async function saveScanLog(tagId, found, item = null, locationSnapshot = null){
      pushDebugLine(`Writing scan log for ${tagId} (${found ? 'found' : 'not found'}).`);
      await addDoc(collection(db, LOGS_COLLECTION), {
        tagId,
        found,
        itemStatus: item?.status || '',
        itemType: item?.itemType || '',
        lastSeenLocation: locationSnapshot || item?.lastSeenLocation || null,
        lastSeenAt: locationSnapshot?.capturedAt || item?.lastSeenAt || '',
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
          const locationText = log.lastSeenLocation?.label || formatLocationSnapshot(log.lastSeenLocation);
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
              ${locationText && locationText !== lt('locationUnavailable') ? `<div>${lt('lastSeenLocation')}: ${locationText}</div>` : ''}
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
                <th>${sortableHeader(t('registrationDate'), 'registrationDate')}</th>
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
                  <td class="table-edit-cell" data-label="${t('registrationDate')}">
                    <input class="toolbar-input table-inline-input table-registration-date-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="date" value="${escapeHtml(getRegistrationDateValue(item))}" ${canEditRegister() ? '' : 'disabled'}>
                  </td>
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

    function openLegalNotice(){
      el('legalModal').hidden = false;
      document.body.classList.add('modal-open');
    }

    function closeLegalNotice(){
      el('legalModal').hidden = true;
      document.body.classList.remove('modal-open');
    }

    function goHome(){
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      el('homeScreen').style.display = 'flex';
      clearStatuses();
      currentScannedItem = null;
      registerAccessRole = '';
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
      openScreen('passwordScreen');
      el('engineerPasswordInput').value = '';
      el('foremanPasswordInput').value = '';
      el('passwordStatus').textContent = '';
      setLang(currentLang);
    }

    function checkPassword(role){
      pushDebugLine(`Register access granted for ${role}.`);
      registerAccessRole = role;
      el('engineerPasswordInput').value = '';
      el('foremanPasswordInput').value = '';
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
      el('registrationDate').value = todayIsoDate();
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

    function ensureScanLocationRow(){
      if(el('scanLastSeenLocation') && el('lblLastSeenLocation')){
        return;
      }

      const detailsColumn = document.querySelector('#scanResult .result-grid > div:last-child');
      const notesLine = el('scanNotes')?.closest('div');
      if(!detailsColumn || !notesLine){
        return;
      }

      const line = document.createElement('div');
      line.innerHTML = `<span id="lblLastSeenLocation"></span>: <span id="scanLastSeenLocation"></span>`;
      detailsColumn.insertBefore(line, notesLine.nextSibling);
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
      el('scanLastSeenLocation').textContent = getLastSeenLocationText(item);
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
          registrationDate: el('scanEditRegistrationDate').value || getRegistrationDateValue(currentScannedItem),
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
      el('registrationDate').value = getRegistrationDateValue(item);
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
        registrationDate: el('registrationDate').value || getRegistrationDateValue(existing),
        nextInspection: el('nextInspection').value,
        status: el('itemStatus').value,
        notes: el('notes').value.trim(),
        imageSrc: customImageSrc || getDefaultImageForType(el('itemType').value),
        lastSeenLocation: existing?.lastSeenLocation || null,
        lastSeenAt: existing?.lastSeenAt || '',
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
        el('scanStatus').textContent = `${t('demoMode')} • ${lt('locationPending')}`;
        const locationSnapshot = await getCurrentLocationSnapshot();
        const displayItem = await attachLastSeenToItem(item, locationSnapshot);
        await saveScanLog(displayItem.tagId, true, displayItem, locationSnapshot);
        pushDebugLine(`Demo scan used newest item ${displayItem.tagId}.`);
        el('scanStatus').textContent = locationSnapshot ? `${t('demoMode')} • ${lt('locationSaved')}` : t('demoMode');
        fillScanCard(displayItem);
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
            statusEl.textContent = lt('locationPending');
            const locationSnapshot = await getCurrentLocationSnapshot();
            const locatedItem = found ? await attachLastSeenToItem(found, locationSnapshot) : null;
            await saveScanLog(tagId, !!found, locatedItem, locationSnapshot);

            if(mode === 'scan'){
              if(locatedItem){
                statusEl.textContent = locationSnapshot ? `${t('itemFound')} • ${lt('locationSaved')}` : t('itemFound');
                fillScanCard(locatedItem);
              } else {
                currentScannedItem = null;
                populateScanEditForm(null);
                el('scanResult').classList.remove('active');
                statusEl.textContent = locationSnapshot ? `${t('itemNotFound')} • ${lt('locationSaved')}` : t('itemNotFound');
              }
            } else {
              el('tagId').value = tagId;
              if(locatedItem){
                statusEl.textContent = locationSnapshot ? `${t('existingTag')} • ${lt('locationSaved')}` : t('existingTag');
                fillRegisterForm(locatedItem);
              } else {
                statusEl.textContent = locationSnapshot ? `${t('newTag')} • ${lt('locationSaved')}` : t('newTag');
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

    window.addEventListener('keydown', (event) => {
      if(event.key === 'Escape' && !el('legalModal').hidden){
        closeLegalNotice();
      }
    });

    window.setLang = setLang;
    window.openScreen = openScreen;
    window.openLegalNotice = openLegalNotice;
    window.closeLegalNotice = closeLegalNotice;
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
    window.exportPresentationReport = exportPresentationReport;
    window.demoScan = demoScan;
    window.startScan = startScan;
    window.renderItemsTable = renderItemsTable;
    window.renderScanLogs = renderScanLogs;

    async function bootApp(){
      ensureScanLocationRow();
      setLang(currentLang);
      clearStatuses();
      clearForm();
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
