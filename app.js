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
      where,
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
        reportSavePdf: 'שמור PDF',
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
        exportReport: 'Current Status Report',
        reportSavePdf: 'Save PDF',
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
        exportReport: 'تقرير حالة محدث',
        reportSavePdf: 'حفظ PDF',
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
    Object.assign(LANG.he, {
      homeBusiness: 'מודול לחברת בנייה',
      homeEngineer: 'גרסת מהנדס בודק',
      homeKickerBusiness: 'construction demo',
      homeTitleBusiness: 'מערכת דמו לחברת בנייה',
      homeSubtitleBusiness: 'בדיקת ציוד, קליטת ציוד, טבלה ולוגים באותו ממשק הדגמה קיים.',
      homeCheckHintBusiness: 'סריקה ובדיקת פריט קיים בשטח',
      homeRegisterBusinessLabel: 'תסקיר בדיקה',
      homeRegisterHintBusiness: 'קליטה, עריכה וניהול ציוד',
      homeKickerEngineer: 'engineer workspace',
      homeTitleEngineer: 'גרסת מהנדס עם מסלול מלא למנהל עבודה',
      homeSubtitleEngineer: 'כל אפשרויות הגרסה המקורית נשארות זמינות, ובנוסף מסלול מהנדס בודק עם תסקיר ודוח מקצועי.',
      homeEngineerHint: 'כניסה למסלול מהנדס בודק',
      homeCheckHintEngineer: 'בדיקת פריט לפי תג או סריקה',
      homeRegisterHintEngineer: 'קליטה, עריכה וניהול ציוד למהנדס ולמנהל עבודה',
      businessPasswordTitle: 'כניסה למודול חברת הבנייה',
      engineerPasswordTitle: 'כניסה לגרסת מהנדס בודק',
      businessPasswordHint: 'כאן נשמרת גרסת הדמו המקורית לחברת בנייה.',
      engineerPasswordHint: 'כאן נפתחת סביבת עבודה מקצועית למהנדס בודק.',
      engineerWorkspaceRoleHint: 'כניסה לטופס תסקיר, בדיקה מקצועית והפקת דוח.',
      engineerWorkspaceIntro: 'אותו מאגר ציוד, אבל עם מסך עבודה נפרד למהנדס.',
      engineerOnlyAccess: 'לגרסת המהנדס יש כניסת מהנדס בלבד.',
      engineerWorkspaceTitle: 'גרסת מהנדס בודק',
      engineerWorkspaceReady: 'גרסת המהנדס מוכנה לעבודה ולמילוי תסקיר.',
      engineerTabInspection: 'תסקיר בדיקה',
      engineerTabItems: 'כרטיסי פריט',
      engineerTabReport: 'דוח תסקיר',
      engineerAssessmentTitle: 'תסקיר בדיקת מהנדס',
      engineerAssessmentSubtitle: 'שומרים על כרטיס הפריט המשותף ומוסיפים עליו תסקיר בדיקה מקצועי.',
      engineerReportNumber: 'מספר תסקיר',
      engineerInspectorName: 'שם מהנדס',
      engineerInspectionDate: 'תאריך בדיקה',
      engineerValidityUntil: 'תוקף בדיקה',
      engineerManufacturer: 'יצרן',
      engineerModel: 'דגם',
      engineerResult: 'תוצאה',
      engineerFailureReason: 'ליקוי / סיבת פסילה',
      engineerProfessionalNotes: 'הערות מקצועיות',
      engineerResultPass: 'תקין',
      engineerResultConditional: 'תקין בכפוף לתיקון',
      engineerResultFail: 'פסול',
      engineerReportNumberPlaceholder: 'לדוגמה: ENG-2026-014',
      engineerInspectorNamePlaceholder: 'לדוגמה: מהנדס אורי לוין',
      engineerManufacturerPlaceholder: 'לדוגמה: Crosby',
      engineerModelPlaceholder: 'לדוגמה: G-2130',
      engineerFailureReasonPlaceholder: 'לדוגמה: שחיקה, עיוות או סימון חסר',
      engineerProfessionalNotesPlaceholder: 'כתוב כאן ממצאים, המלצות והערות מקצועיות.'
    });
    Object.assign(LANG.en, {
      homeBusiness: 'Construction Module',
      homeEngineer: 'Engineer Inspector Version',
      homeKickerBusiness: 'construction demo',
      homeTitleBusiness: 'Demo System for Construction Teams',
      homeSubtitleBusiness: 'Equipment check, registration, table, and logs in the original demo flow.',
      homeCheckHintBusiness: 'Scan and review an existing item',
      homeRegisterBusinessLabel: 'Inspection Report',
      homeRegisterHintBusiness: 'Register, edit, and manage equipment',
      homeKickerEngineer: 'engineer workspace',
      homeTitleEngineer: 'Engineer Version with Full Foreman Access',
      homeSubtitleEngineer: 'All original flows remain available, plus the enhanced engineer assessment and report workflow.',
      homeEngineerHint: 'Open the engineer inspector workflow',
      homeCheckHintEngineer: 'Check an item by tag or scan',
      homeRegisterHintEngineer: 'Register, edit, and manage equipment for engineer and foreman',
      businessPasswordTitle: 'Construction Module Access',
      engineerPasswordTitle: 'Engineer Workspace Access',
      businessPasswordHint: 'This keeps the original construction-company demo intact.',
      engineerPasswordHint: 'This route opens the professional inspection workflow and report.',
      engineerWorkspaceRoleHint: 'Access the inspection form, findings, and printable engineer report.',
      engineerWorkspaceIntro: 'The same equipment pool appears here through a dedicated engineer workflow.',
      engineerOnlyAccess: 'The engineer version is available through Engineer Login only.',
      engineerWorkspaceTitle: 'Engineer Inspector Workspace',
      engineerWorkspaceReady: 'Engineer workspace ready for inspection and report entry.',
      engineerTabInspection: 'Inspection',
      engineerTabItems: 'Items',
      engineerTabReport: 'Report',
      engineerAssessmentTitle: 'Engineer Inspection Report',
      engineerAssessmentSubtitle: 'Keep the shared item card, then add the professional inspection record separately.',
      engineerReportNumber: 'Report Number',
      engineerInspectorName: 'Engineer Name',
      engineerInspectionDate: 'Inspection Date',
      engineerValidityUntil: 'Validity Until',
      engineerManufacturer: 'Manufacturer',
      engineerModel: 'Model',
      engineerResult: 'Result',
      engineerFailureReason: 'Defect / Rejection Reason',
      engineerProfessionalNotes: 'Professional Notes',
      engineerResultPass: 'Pass',
      engineerResultConditional: 'Conditional',
      engineerResultFail: 'Fail',
      engineerReportNumberPlaceholder: 'Example: ENG-2026-014',
      engineerInspectorNamePlaceholder: 'Example: Eng. O. Levin',
      engineerManufacturerPlaceholder: 'Example: Crosby',
      engineerModelPlaceholder: 'Example: G-2130',
      engineerFailureReasonPlaceholder: 'Example: wear, deformation, missing marking',
      engineerProfessionalNotesPlaceholder: 'Write findings, recommendations, and professional notes here.'
    });
    Object.assign(LANG.ar, {
      homeBusiness: 'وحدة شركة البناء',
      homeEngineer: 'نسخة المهندس الفاحص',
      homeKickerBusiness: 'construction demo',
      homeTitleBusiness: 'نظام عرض لشركة بناء',
      homeSubtitleBusiness: 'فحص معدّات وتسجيل وجدول وسجلات ضمن نسخة العرض الأصلية.',
      homeCheckHintBusiness: 'مسح وفحص معدّة موجودة',
      homeRegisterBusinessLabel: 'تقرير فحص',
      homeRegisterHintBusiness: 'تسجيل وتعديل وإدارة المعدّات',
      homeKickerEngineer: 'engineer workspace',
      homeTitleEngineer: 'نسخة مهندس مع صلاحيات كاملة لمدير العمل',
      homeSubtitleEngineer: 'كل مسارات النسخة الأصلية تبقى متاحة، مع إضافة مسار المهندس الفاحص والتقرير المهني.',
      homeEngineerHint: 'الدخول إلى مسار المهندس الفاحص',
      homeCheckHintEngineer: 'فحص معدّة بواسطة الوسم أو المسح',
      homeRegisterHintEngineer: 'تسجيل وتعديل وإدارة المعدّات للمهندس ومدير العمل',
      businessPasswordTitle: 'الدخول إلى وحدة شركة البناء',
      engineerPasswordTitle: 'الدخول إلى مساحة المهندس',
      businessPasswordHint: 'هذه هي نسخة العرض الأصلية لشركات البناء.',
      engineerPasswordHint: 'هذا المسار مخصص لنموذج الفحص المهني والتقرير.',
      engineerWorkspaceRoleHint: 'الوصول إلى نموذج الفحص والملاحظات وتقرير المهندس الجاهز للطباعة.',
      engineerWorkspaceIntro: 'يتم استخدام نفس المعدات هنا لكن من خلال سير عمل منفصل للمهندس.',
      engineerOnlyAccess: 'نسخة المهندس متاحة عبر دخول المهندس فقط.',
      engineerWorkspaceTitle: 'مساحة المهندس الفاحص',
      engineerWorkspaceReady: 'مساحة المهندس جاهزة لإدخال الفحص والتقرير.',
      engineerTabInspection: 'الفحص',
      engineerTabItems: 'المعدّات',
      engineerTabReport: 'التقرير',
      engineerAssessmentTitle: 'تقرير فحص مهندس',
      engineerAssessmentSubtitle: 'حافظ على بطاقة المعدّة المشتركة ثم أضف سجل الفحص المهني بشكل منفصل.',
      engineerReportNumber: 'رقم التقرير',
      engineerInspectorName: 'اسم المهندس',
      engineerInspectionDate: 'تاريخ الفحص',
      engineerValidityUntil: 'صلاحية الفحص',
      engineerManufacturer: 'الشركة المصنعة',
      engineerModel: 'الطراز',
      engineerResult: 'النتيجة',
      engineerFailureReason: 'العيب / سبب الرفض',
      engineerProfessionalNotes: 'ملاحظات مهنية',
      engineerResultPass: 'ناجح',
      engineerResultConditional: 'مشروط',
      engineerResultFail: 'راسب',
      engineerReportNumberPlaceholder: 'مثال: ENG-2026-014',
      engineerInspectorNamePlaceholder: 'مثال: م. سامر خليل',
      engineerManufacturerPlaceholder: 'مثال: Crosby',
      engineerModelPlaceholder: 'مثال: G-2130',
      engineerFailureReasonPlaceholder: 'مثال: تآكل، تشوه، أو علامة مفقودة',
      engineerProfessionalNotesPlaceholder: 'اكتب هنا النتائج والتوصيات والملاحظات المهنية.'
    });
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
    const DEMO_ISRAEL_LOCATIONS = [
      { he: 'נמל אשדוד', en: 'Ashdod Port', ar: 'ميناء أشدود', latitude: 31.80152, longitude: 34.64042 },
      { he: 'נמל חיפה', en: 'Haifa Port', ar: 'ميناء حيفا', latitude: 32.83038, longitude: 34.98854 },
      { he: 'אזור תעשייה חולון', en: 'Holon Industrial Zone', ar: 'المنطقة الصناعية حولون', latitude: 32.01045, longitude: 34.77984 },
      { he: 'קריית עתידים תל אביב', en: 'Kiryat Atidim, Tel Aviv', ar: 'كريات عتيديم تل أبيب', latitude: 32.11303, longitude: 34.84072 },
      { he: 'פארק תעשיות קיסריה', en: 'Caesarea Industrial Park', ar: 'المنطقة الصناعية قيسارية', latitude: 32.48474, longitude: 34.90493 },
      { he: 'אזור תעשייה באר שבע', en: 'Beersheba Industrial Area', ar: 'المنطقة الصناعية بئر السبع', latitude: 31.24384, longitude: 34.7913 },
      { he: 'נמל אילת', en: 'Eilat Port', ar: 'ميناء إيلات', latitude: 29.54746, longitude: 34.9565 },
      { he: 'אזור תעשייה פתח תקווה', en: 'Petah Tikva Industrial Area', ar: 'المنطقة الصناعية بيتاح تكفا', latitude: 32.09174, longitude: 34.88753 }
    ];

    const el = (id) => document.getElementById(id);
    const savedLang = localStorage.getItem('lang');
    let currentLang = LANG[savedLang] ? savedLang : 'he';
    const APP_COPYRIGHT_YEAR = new Date().getFullYear();
    const APP_MODES = {
      business: 'business',
      engineer: 'engineer'
    };
    const APP_VARIANT = window.APP_VARIANT === APP_MODES.engineer ? APP_MODES.engineer : APP_MODES.business;
    const VISIT_STORAGE_KEY = 'nfc_demo_active_visit_v1';
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
    const reportArchiveState = {
      from: '',
      to: '',
      site: 'all',
      visits: [],
      logsByKey: new Map()
    };
    const pendingTableEdits = new Map();
    let lastSavedTagId = '';
    let passwordContext = 'register';
    let registerAccessRole = '';
    let currentAppMode = APP_VARIANT;
    let currentScannedItem = null;
    let scanDemoGalleryMode = false;
    let customImageSrc = '';
    let pendingImageTask = null;
    let activeVisit = null;
    let pendingDeleteTagId = '';
    let pendingDeleteResetTimer = null;
    let visitSignaturePadState = null;
    const debugState = {
      enabled: new URLSearchParams(window.location.search).get('debug') === '1',
      visible: new URLSearchParams(window.location.search).get('debug') === '1',
      lines: ['Debug panel ready.']
    };

    function t(key){
      return LANG[currentLang][key] || key;
    }

    function isEngineerWorkspace(){
      return currentAppMode === APP_MODES.engineer;
    }

    function getHomeCopy(){
      if(isEngineerWorkspace()){
      return {
        kicker: t('homeKickerEngineer'),
        title: t('homeTitleEngineer'),
        subtitle: t('homeSubtitleEngineer'),
        primaryHint: t('homeEngineerHint'),
        secondaryHint: t('homeRegisterHintEngineer')
      };
      }

      return {
        kicker: t('homeKickerBusiness'),
        title: t('homeTitleBusiness'),
        subtitle: t('homeSubtitleBusiness'),
        primaryHint: t('homeCheckHintBusiness'),
        secondaryHint: t('homeRegisterHintBusiness')
      };
    }

    function openBusinessModule(){
      currentAppMode = APP_MODES.business;
      openPasswordScreen();
    }

    function openEngineerModule(){
      currentAppMode = APP_MODES.engineer;
      openPasswordScreen();
    }

    function getEngineerAssessment(item = null){
      const source = item?.engineerAssessment || {};
      return {
        reportNumber: source.reportNumber || '',
        engineerName: source.engineerName || '',
        inspectionDate: source.inspectionDate || '',
        manufacturer: source.manufacturer || '',
        model: source.model || '',
        result: source.result || 'pass',
        failureReason: source.failureReason || '',
        validityUntil: source.validityUntil || '',
        professionalNotes: source.professionalNotes || ''
      };
    }

    function fillEngineerAssessmentForm(item = null){
      if(!el('engineerReportNumber')){
        return;
      }
      const assessment = getEngineerAssessment(item);
      el('engineerReportNumber').value = assessment.reportNumber;
      el('engineerInspectorName').value = assessment.engineerName || activeVisit?.engineer || '';
      el('engineerInspectionDate').value = formatDateInputValue(assessment.inspectionDate || activeVisit?.date || todayIsoDate());
      el('engineerManufacturer').value = assessment.manufacturer;
      el('engineerModel').value = assessment.model;
      el('engineerResult').value = assessment.result;
      el('engineerFailureReason').value = assessment.failureReason;
      el('engineerValidityUntil').value = formatDateInputValue(assessment.validityUntil);
      el('engineerProfessionalNotes').value = assessment.professionalNotes;
    }

    function readEngineerAssessment(existing = null){
      if(!el('engineerReportNumber')){
        return getEngineerAssessment(existing);
      }
      const previous = getEngineerAssessment(existing);
      return {
        reportNumber: String(el('engineerReportNumber')?.value || previous.reportNumber || '').trim(),
        engineerName: String(el('engineerInspectorName')?.value || activeVisit?.engineer || previous.engineerName || '').trim(),
        inspectionDate: normalizeRegistrationDate(el('engineerInspectionDate')?.value) || previous.inspectionDate || activeVisit?.date || todayIsoDate(),
        manufacturer: String(el('engineerManufacturer')?.value || previous.manufacturer || '').trim(),
        model: String(el('engineerModel')?.value || previous.model || '').trim(),
        result: String(el('engineerResult')?.value || previous.result || 'pass').trim() || 'pass',
        failureReason: String(el('engineerFailureReason')?.value || previous.failureReason || '').trim(),
        validityUntil: normalizeRegistrationDate(el('engineerValidityUntil')?.value) || previous.validityUntil || '',
        professionalNotes: String(el('engineerProfessionalNotes')?.value || previous.professionalNotes || '').trim(),
        updatedAt: new Date().toLocaleString(),
        createdAt: previous.createdAt || new Date().toLocaleString()
      };
    }

    function formatText(key, replacements = {}){
      return Object.entries(replacements).reduce((text, [name, value]) => {
        return text.replaceAll(`{${name}}`, String(value));
      }, t(key));
    }

    function capitalize(value){
      const text = String(value || '');
      return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
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

    function getAllSitesLabel(){
      return currentLang === 'en' ? 'All Sites' : currentLang === 'ar' ? 'كل المواقع' : 'כל האתרים';
    }

    function getReportSiteScope(items = []){
      const uniqueSites = [...new Set(
        items
          .map((item) => String(item?.siteName || '').trim())
          .filter(Boolean)
      )];
      return uniqueSites.length === 1 ? uniqueSites[0] : getAllSitesLabel();
    }

    function formatExecutiveSummaryText(items, counts){
      let summaryText = formatReportText('reportExecutiveText', counts);
      if(currentLang === 'he'){
        summaryText = summaryText.replace(/^נכון לעכשיו קיימים/, 'בהתאם לבחירה קיימים');
      } else if(currentLang === 'en'){
        summaryText = summaryText.replace(/^There are currently/, 'Based on the current selection there are');
      }
      return `${summaryText} ${t('siteName')}: ${getReportSiteScope(items)}`;
    }

    function formatLocationText(key, replacements = {}){
      return Object.entries(replacements).reduce((text, [name, value]) => {
        return text.replaceAll(`{${name}}`, String(value));
      }, lt(key));
    }

    function getLocaleTag(){
      return currentLang === 'en' ? 'en-US' : currentLang === 'ar' ? 'ar' : 'he-IL';
    }

    function visitBadgeText(){
      if(!activeVisit){
        return t('visitStatusIdle');
      }
      return activeVisit.status === 'closed' ? t('visitStatusClosed') : t('visitStatusActive');
    }

    function createVisitId(){
      return `visit-${Date.now()}`;
    }

    function loadActiveVisit(){
      activeVisit = null;
      try {
        localStorage.removeItem(VISIT_STORAGE_KEY);
      } catch (error) {
        pushDebugLine(`Visit storage reset failed: ${error.message}`);
      }
    }

    function persistActiveVisit(){
      if(!activeVisit){
        localStorage.removeItem(VISIT_STORAGE_KEY);
        return;
      }
      localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(activeVisit));
    }

    function getVisitFormData(){
      const engineerName = String(el('visitEngineer')?.value || '').trim();
      return {
        date: normalizeRegistrationDate(el('visitDate')?.value) || todayIsoDate(),
        engineer: engineerName,
        client: String(el('visitClient')?.value || '').trim(),
        site: String(el('visitSite')?.value || '').trim(),
        signature: engineerName,
        notes: String(el('visitNotes')?.value || '').trim()
      };
    }

    function getVisitClientValue(){
      return String(el('visitClient')?.value || '').trim();
    }

    function getVisitSiteValue(){
      return String(el('visitSite')?.value || '').trim();
    }

    function canEditVisitClosure(){
      return canEditRegister() && !!activeVisit && activeVisit.status !== 'closed';
    }

    function populateVisitForm(visit = null){
      el('visitDate').value = formatDateInputValue(visit?.date || todayIsoDate());
      el('visitEngineer').value = visit?.engineer || '';
      el('visitClient').value = visit?.client || '';
      el('visitSite').value = visit?.site || '';
      el('visitNotes').value = visit?.notes || '';
      loadVisitSignatureDataUrl(visit?.signatureDataUrl || '');
    }

    function getVisitRelevantLogs(logs = dataCache.logs.value || []){
      if(!activeVisit?.id){
        return [];
      }
      return logs.filter((log) => log.visitId === activeVisit.id && ['register_new', 'register_update', 'check'].includes(log.actionType));
    }

    function getVisitLogCounts(logs = dataCache.logs.value || []){
      const visitLogs = getVisitRelevantLogs(logs);
      return {
        newCount: visitLogs.filter((log) => log.actionType === 'register_new').length,
        checkedCount: visitLogs.filter((log) => log.actionType === 'check' || log.actionType === 'register_update').length
      };
    }

    function renderVisitStatus(message = ''){
      const badge = el('visitStatusBadge');
      badge.textContent = visitBadgeText();
      badge.classList.toggle('active', !!activeVisit && activeVisit.status !== 'closed');
      badge.classList.toggle('closed', !!activeVisit && activeVisit.status === 'closed');

      const summary = activeVisit
        ? formatText('visitSummaryLine', {
            date: formatDisplayDate(activeVisit.date || todayIsoDate()),
            engineer: activeVisit.engineer || '-',
            ...getVisitLogCounts()
          })
        : t('visitSummaryEmpty');

      el('visitSummaryText').textContent = summary;
      const statusText = el('visitStatusText');
      const resolvedMessage = message || (!activeVisit ? t('visitStatusNoVisit') : activeVisit.status === 'closed' ? t('visitStatusClosedMessage') : t('visitStatusSaved'));
      statusText.textContent = resolvedMessage;
      statusText.classList.remove('status-ok', 'status-warn', 'status-bad', 'muted');
      if(!activeVisit){
        statusText.classList.add('muted');
      } else if(activeVisit.status === 'closed'){
        statusText.classList.add('status-warn');
      } else {
        statusText.classList.add('status-ok');
      }
      const visitSaveBtn = el('visitSaveBtn');
      const visitCloseBtn = el('visitCloseBtn');
      const visitEndPanel = el('visitEndPanel');
      const isActiveVisit = !!activeVisit && activeVisit.status !== 'closed';
      visitSaveBtn.textContent = isActiveVisit ? t('visitSaveActive') : (!activeVisit || activeVisit.status === 'closed' ? t('visitSaveStart') : t('visitSaveUpdate'));
      visitSaveBtn.classList.toggle('active-visit', isActiveVisit);
      visitSaveBtn.classList.toggle('ready-to-start', !isActiveVisit);
      if(visitCloseBtn){
        visitCloseBtn.classList.toggle('ready-to-close', isActiveVisit);
      }
      if(visitEndPanel){
        visitEndPanel.hidden = !activeVisit;
      }
      el('visitCloseBtn').disabled = !canEditRegister() || !activeVisit || activeVisit.status === 'closed';
      el('visitReportBtn').disabled = !canEditRegister() || !activeVisit;
      el('visitReportBtn').hidden = !canEditRegister();
    }

    function getCurrentVisitForLogs(){
      if(!activeVisit || activeVisit.status === 'closed'){
        return null;
      }
      return activeVisit;
    }

    function getVisitSignatureCanvas(){
      return el('visitSignaturePad');
    }

    function refreshVisitSignaturePad(){
      if(!visitSignaturePadState?.resizeCanvas){
        return;
      }
      requestAnimationFrame(() => {
        visitSignaturePadState?.resizeCanvas?.();
      });
    }

    function setupVisitSignaturePad(){
      const canvas = getVisitSignatureCanvas();
      if(!canvas){
        return;
      }

      if(canvas.dataset.signatureBound === '1'){
        visitSignaturePadState?.resizeCanvas?.();
        return;
      }

      const context = canvas.getContext('2d');
      context.lineWidth = 2.2;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = '#0f172a';

      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const bounds = canvas.getBoundingClientRect();
        const width = Math.max(Math.round(bounds.width * ratio), 1);
        const height = Math.max(Math.round(bounds.height * ratio), 1);
        const snapshot = canvas.toDataURL('image/png');
        canvas.width = width;
        canvas.height = height;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.lineWidth = 2.2;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = '#0f172a';
        if(snapshot && snapshot !== 'data:,'){
          const image = new Image();
          image.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, bounds.width, bounds.height);
          };
          image.src = snapshot;
        } else {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      const eventPosition = (event) => {
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches?.[0] || event.changedTouches?.[0] || null;
        const clientX = touch ? touch.clientX : event.clientX;
        const clientY = touch ? touch.clientY : event.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const drawDot = (point) => {
        context.beginPath();
        context.arc(point.x, point.y, 1.2, 0, Math.PI * 2);
        context.fillStyle = '#0f172a';
        context.fill();
      };

      const startStroke = (point) => {
        if(!visitSignaturePadState){
          return;
        }
        visitSignaturePadState.drawing = true;
        visitSignaturePadState.dirty = true;
        visitSignaturePadState.lastPoint = point;
        drawDot(point);
      };

      const moveStroke = (point) => {
        if(!visitSignaturePadState?.drawing || !visitSignaturePadState.lastPoint){
          return;
        }
        context.beginPath();
        context.moveTo(visitSignaturePadState.lastPoint.x, visitSignaturePadState.lastPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
        visitSignaturePadState.lastPoint = point;
      };

      visitSignaturePadState = {
        drawing: false,
        dirty: false,
        lastPoint: null,
        activeInput: '',
        resizeCanvas
      };

      const startDrawing = (event, source) => {
        if(source === 'mouse' && event.button !== 0){
          return;
        }
        if(!canEditVisitClosure()){
          return;
        }
        event.preventDefault();
        canvas.focus?.();
        visitSignaturePadState.activeInput = source;
        startStroke(eventPosition(event));
      };

      const continueDrawing = (event, source) => {
        if(!visitSignaturePadState?.drawing || visitSignaturePadState.activeInput !== source){
          return;
        }
        if(source === 'mouse' && (event.buttons & 1) !== 1){
          stopDrawing();
          return;
        }
        event.preventDefault();
        moveStroke(eventPosition(event));
      };

      const stopDrawing = () => {
        if(!visitSignaturePadState){
          return;
        }
        visitSignaturePadState.drawing = false;
        visitSignaturePadState.lastPoint = null;
        visitSignaturePadState.activeInput = '';
      };

      canvas.addEventListener('mousedown', (event) => {
        startDrawing(event, 'mouse');
      });

      window.addEventListener('mousemove', (event) => {
        continueDrawing(event, 'mouse');
      });

      window.addEventListener('mouseup', () => {
        stopDrawing();
      });

      canvas.addEventListener('touchstart', (event) => {
        startDrawing(event, 'touch');
      }, { passive: false });

      canvas.addEventListener('touchmove', (event) => {
        continueDrawing(event, 'touch');
      }, { passive: false });

      window.addEventListener('touchend', stopDrawing, { passive: true });
      window.addEventListener('touchcancel', stopDrawing, { passive: true });
      window.addEventListener('resize', resizeCanvas);
      canvas.dataset.signatureBound = '1';
      resizeCanvas();
    }

    function clearVisitSignaturePad(){
      if(!canEditVisitClosure()){
        return;
      }
      const canvas = getVisitSignatureCanvas();
      const context = canvas?.getContext('2d');
      if(!canvas || !context){
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      if(visitSignaturePadState){
        visitSignaturePadState.dirty = false;
      }
      if(activeVisit){
        activeVisit.signatureDataUrl = '';
        persistActiveVisit();
      }
    }

    function getVisitSignatureDataUrl(){
      const canvas = getVisitSignatureCanvas();
      if(!canvas || !visitSignaturePadState?.dirty){
        return '';
      }
      return canvas.toDataURL('image/png');
    }

    function loadVisitSignatureDataUrl(dataUrl){
      const canvas = getVisitSignatureCanvas();
      const context = canvas?.getContext('2d');
      if(!canvas || !context){
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      visitSignaturePadState.dirty = false;
      if(!dataUrl){
        return;
      }

      const image = new Image();
      image.onload = () => {
        const width = canvas.getBoundingClientRect().width || canvas.width;
        const height = canvas.getBoundingClientRect().height || canvas.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, width, height);
        visitSignaturePadState.dirty = true;
      };
      image.src = dataUrl;
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
          time: formatDisplayDateTime(location.capturedAt)
        }));
      }

      return parts.join(' • ');
    }

    function getDemoLocationLabel(location){
      if(!location){
        return '';
      }
      return currentLang === 'en' ? location.en : currentLang === 'ar' ? location.ar : location.he;
    }

    function getDemoLocationSnapshot(index){
      const location = DEMO_ISRAEL_LOCATIONS[index % DEMO_ISRAEL_LOCATIONS.length];
      if(!location){
        return null;
      }

      return {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: 30 + ((index % 5) * 7),
        capturedAt: new Date(Date.now() - (index * 45 * 60000)).toISOString(),
        label: getDemoLocationLabel(location)
      };
    }

    function getLastSeenLocationText(item){
      if(!item?.lastSeenLocation){
        return lt('locationUnavailable');
      }

      return item.lastSeenLocation.label || formatLocationSnapshot(item.lastSeenLocation) || lt('locationUnavailable');
    }

    function getLocationMapUrl(location){
      if(!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number'){
        return '';
      }

      const lat = Number(location.latitude).toFixed(6);
      const lng = Number(location.longitude).toFixed(6);
      return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
    }

    function updateLastSeenLocationLink(item){
      const link = el('scanLastSeenLocation');
      if(!link){
        return;
      }

      const mapUrl = getLocationMapUrl(item?.lastSeenLocation);
      if(mapUrl){
        link.textContent = t('locationMapLink');
        link.href = mapUrl;
        link.classList.remove('is-disabled');
      } else {
        link.textContent = getLastSeenLocationText(item);
        link.href = '#';
        link.classList.add('is-disabled');
      }
    }

    function ensureLogsSubtitle(){
      const title = el('logsHistoryTitleText');
      if(!title){
        return null;
      }

      let subtitle = el('logsHistorySubtitleText');
      if(subtitle){
        return subtitle;
      }

      subtitle = document.createElement('div');
      subtitle.id = 'logsHistorySubtitleText';
      subtitle.className = 'report-archive-subtitle';
      title.insertAdjacentElement('afterend', subtitle);
      return subtitle;
    }

    function ensureLogsDashboardShell(){
      const pane = el('logsPane');
      if(!pane){
        return {};
      }

      let summary = el('logsDashboardSummary');
      if(!summary){
        summary = document.createElement('div');
        summary.id = 'logsDashboardSummary';
        summary.className = 'logs-dashboard-summary';
        pane.insertBefore(summary, pane.firstElementChild || null);
      }

      let content = el('logsDashboardContent');
      if(!content){
        content = document.createElement('div');
        content.id = 'logsDashboardContent';
        content.className = 'logs-dashboard-content';
        while(summary.nextSibling){
          content.appendChild(summary.nextSibling);
        }
        pane.appendChild(content);
      }

      return { pane, summary, content, logsPanel: null };
    }

    function countUniqueTags(logs = []){
      return new Set(logs.map((log) => normalizeTagId(log.tagId)).filter(Boolean)).size;
    }

    function formatLogAction(log){
      const actionType = String(log?.actionType || '').trim();
      if(actionType === 'register_new') return t('visitActionNew');
      if(actionType === 'register_update') return t('saveChanges');
      if(actionType === 'check') return t('visitActionChecked');
      return log?.found ? t('logFound') : t('logNotFound');
    }

    function buildLogsSummary(logs = [], visits = []){
      const totalScans = logs.length;
      const foundCount = logs.filter((log) => log.found).length;
      const notFoundCount = totalScans - foundCount;
      const lastScanTime = logs[0]?.time ? formatDisplayDateTime(logs[0].time) : '-';

      return [
        { label: t('logsSummaryScans'), value: totalScans || 0, tone: 'teal' },
        { label: t('logsSummaryVisits'), value: visits.length || 0, tone: 'slate' },
        { label: t('logsSummaryFound'), value: foundCount || 0, tone: 'green' },
        { label: t('logsSummaryMissing'), value: notFoundCount || 0, tone: 'rose' },
        { label: t('logsSummaryTags'), value: countUniqueTags(logs), tone: 'amber' },
        { label: t('logsSummaryLastScan'), value: lastScanTime, tone: 'blue', compact: true }
      ];
    }

    function renderLogsSummary(logs = [], visits = []){
      const { summary } = ensureLogsDashboardShell();
      if(!summary){
        return;
      }

      const cards = buildLogsSummary(logs, visits);
      summary.innerHTML = cards.map((card) => `
        <div class="logs-summary-card logs-summary-${card.tone}">
          <div class="logs-summary-label">${escapeHtml(card.label)}</div>
          <div class="logs-summary-value${card.compact ? ' is-compact' : ''}">${escapeHtml(card.value)}</div>
        </div>
      `).join('');
    }

    function updateLogsDashboardHeadings({ totalLogs = 0, shownLogs = 0, visits = [] } = {}){
      const archiveSubtitle = el('reportArchiveSubtitleText');

      if(archiveSubtitle){
        archiveSubtitle.textContent = visits.length
          ? formatText('reportArchiveSubtitleWithCount', { count: visits.length })
          : t('reportArchiveEmptyHelp');
      }
    }

    function buildVisitArchiveRecords(logs = []){
      const visitMap = new Map();

      logs.forEach((log) => {
        const visitId = String(log.visitId || '').trim();
        if(!visitId){
          return;
        }

        const existing = visitMap.get(visitId) || {
          id: visitId,
          date: log.visitDate || '',
          engineer: log.visitEngineer || '',
          client: log.visitClient || '',
          site: log.visitSite || '',
          signature: log.visitSignature || '',
          startedAt: '',
          endedAt: '',
          sortTime: '',
          logs: []
        };

        existing.date = existing.date || log.visitDate || '';
        existing.engineer = existing.engineer || log.visitEngineer || '';
        existing.client = existing.client || log.visitClient || '';
        existing.site = existing.site || log.visitSite || '';
        existing.signature = existing.signature || log.visitSignature || '';
        existing.logs.push(log);

        const timeValue = String(log.sortTime || log.time || '');
        if(!existing.sortTime || timeValue > existing.sortTime){
          existing.sortTime = timeValue;
        }

        if(log.actionType === 'visit_closed'){
          existing.endedAt = existing.endedAt || log.time || '';
        } else if(!existing.startedAt){
          existing.startedAt = log.time || '';
        }

        visitMap.set(visitId, existing);
      });

      return [...visitMap.values()]
        .map((visit) => {
          const actionableLogs = visit.logs.filter((log) => ['register_new', 'register_update', 'check'].includes(log.actionType));
          const newCount = actionableLogs.filter((log) => log.actionType === 'register_new').length;
          const checkedCount = actionableLogs.filter((log) => log.actionType === 'check' || log.actionType === 'register_update').length;
          return {
            ...visit,
            itemCount: new Set(actionableLogs.map((log) => normalizeTagId(log.tagId)).filter(Boolean)).size,
            newCount,
            checkedCount
          };
        })
        .sort((a, b) => String(b.sortTime || '').localeCompare(String(a.sortTime || '')));
    }

    function isVisitWithinRange(visit, fromDate, toDate){
      const visitDate = normalizeRegistrationDate(visit.date) || normalizeRegistrationDate(visit.startedAt);
      if(!visitDate){
        return false;
      }
      if(fromDate && visitDate < fromDate) return false;
      if(toDate && visitDate > toDate) return false;
      return true;
    }

    function getReportArchiveSiteValue(){
      return String(el('reportArchiveSiteFilter')?.value || 'all').trim() || 'all';
    }

    function updateReportArchiveButtonState(){
      const button = el('reportArchiveLoadBtn');
      if(!button){
        return;
      }
      const hasActiveFilter = !!(
        String(reportArchiveState.from || '').trim()
        || String(reportArchiveState.to || '').trim()
        || (String(reportArchiveState.site || 'all').trim() && String(reportArchiveState.site || 'all').trim() !== 'all')
      );
      button.classList.toggle('is-filtered', hasActiveFilter);
    }

    function populateReportArchiveSiteOptions(visits = [], preferredSite = getReportArchiveSiteValue()){
      const select = el('reportArchiveSiteFilter');
      if(!select){
        return;
      }

      const uniqueSites = [...new Set(
        visits
          .map((visit) => String(visit?.site || '').trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, currentLang));

      select.innerHTML = [
        `<option value="all">${escapeHtml(t('reportArchiveAllSitesOption'))}</option>`,
        ...uniqueSites.map((site) => `<option value="${escapeHtml(site)}">${escapeHtml(site)}</option>`)
      ].join('');

      const nextValue = uniqueSites.includes(preferredSite) ? preferredSite : 'all';
      select.value = nextValue;
      reportArchiveState.site = nextValue;
    }

    function getArchiveVisitEntries(visitId, logs, items){
      const previousVisit = activeVisit;
      const previousCache = dataCache.logs.value;
      activeVisit = { id: visitId };
      dataCache.logs.value = logs;
      const entries = buildVisitEntries(logs, items);
      activeVisit = previousVisit;
      dataCache.logs.value = previousCache;
      return entries;
    }

    async function openArchivedVisitReport(visitId){
      const reportWindow = openReportWindow(t('visitReportTitle'));
      try {
        const [logs, items, reportLogoSrc] = await Promise.all([getLogs(true), getItems(), getReportLogoDataUrl()]);
        const visit = buildVisitArchiveRecords(logs).find((entry) => entry.id === visitId);
        if(!visit){
          if(reportWindow && !reportWindow.closed){
            reportWindow.close();
          }
          el('reportArchiveStatus').textContent = t('reportArchiveEmpty');
          return;
        }

        const entries = getArchiveVisitEntries(visitId, logs, items);
        const newEntries = entries.filter((entry) => entry.actionType === 'register_new');
        const checkedEntries = entries.filter((entry) => entry.actionType !== 'register_new');
        const generatedAt = formatDisplayDateTime(new Date());
        const printLabel = rt('reportSavePdf');

        const renderRows = (rows) => rows.length ? rows.map((entry) => `
          <tr>
            <td>${escapeHtml(entry.tagId || '-')}</td>
            <td>${escapeHtml(entry.actionLabel)}</td>
            <td>${escapeHtml(translateType(entry.itemType))}</td>
            <td>${escapeHtml(entry.description || '-')}</td>
            <td>${escapeHtml(entry.serialNumber || '-')}</td>
            <td>${escapeHtml(entry.engineerAssessment?.reportNumber || '-')}</td>
            <td>${escapeHtml(entry.engineerAssessment?.manufacturer || '-')}</td>
            <td>${escapeHtml(entry.engineerAssessment?.model || '-')}</td>
            <td>${escapeHtml(t(`engineerResult${capitalize(entry.engineerAssessment?.result || '')}`) || entry.engineerAssessment?.result || '-')}</td>
            <td>${escapeHtml(entry.engineerAssessment?.failureReason || '-')}</td>
            <td>${escapeHtml(formatReportDate(entry.engineerAssessment?.validityUntil || ''))}</td>
            <td>${escapeHtml(entry.contractor || '-')}</td>
            <td>${escapeHtml(entry.wll || '-')}</td>
            <td>${escapeHtml(entry.siteName || '-')}</td>
            <td>${escapeHtml(translateStatus(entry.status || ''))}</td>
            <td>${escapeHtml(formatReportDate(entry.nextInspection))}</td>
            <td>${escapeHtml(entry.notes || '-')}</td>
            <td>${escapeHtml(entry.engineerAssessment?.professionalNotes || '-')}</td>
          </tr>
        `).join('') : `<tr><td colspan="18">${escapeHtml(t('visitReportEmpty'))}</td></tr>`;

        const html = `
          <html dir="${currentLang === 'en' ? 'ltr' : 'rtl'}" lang="${escapeHtml(currentLang)}">
          <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(t('visitReportTitle'))}</title>
            <style>
              @page { size:A4 portrait; margin:10mm; }
              * { box-sizing:border-box; }
              html, body { margin:0; padding:0; background:#fff; }
              body { font-family: Arial, sans-serif; color:#0f172a; font-size:12px; line-height:1.45; }
              .report-shell { width:190mm; max-width:100%; margin:0 auto; }
              .header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
              .header-copy { flex:1; min-width:0; }
              .logo { width:96px; height:96px; object-fit:contain; flex:0 0 auto; }
              h1 { margin:0 0 6px; font-size:24px; color:#0f766e; line-height:1.2; }
              h2 { margin:0 0 10px; font-size:18px; line-height:1.25; }
              p { margin:0 0 8px; line-height:1.55; }
              .meta, .section { border:1px solid #dbe4ea; border-radius:16px; padding:14px; margin-bottom:12px; overflow:hidden; break-inside:avoid; page-break-inside:avoid; }
              .meta-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px 14px; }
              .meta-row { min-width:0; }
              .meta-row strong { display:block; margin-bottom:2px; color:#475569; }
              table { width:100%; border-collapse:collapse; margin-top:10px; table-layout:fixed; font-size:10px; }
              th, td { border:1px solid #dbe4ea; padding:6px 5px; text-align:${currentLang === 'en' ? 'left' : 'right'}; vertical-align:top; word-break:break-word; overflow-wrap:anywhere; }
              th { background:#f8fafc; font-size:10px; line-height:1.25; }
              .signature { margin-top:18px; padding-top:14px; border-top:2px solid #cbd5e1; break-inside:avoid; page-break-inside:avoid; }
              .footer { margin-top:14px; color:#64748b; font-size:11px; }
              .no-print { margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; }
              @media print {
                .no-print { display:none !important; }
                .report-shell { width:auto; max-width:none; }
              }
            </style>
          </head>
          <body>
            <div class="report-shell">
            <div class="header">
              <div class="header-copy">
                <h1>${escapeHtml(t('visitReportTitle'))}</h1>
                <p>${escapeHtml(t('visitReportIntro'))}</p>
                <p>${escapeHtml(formatText('visitReportGenerated', { date: generatedAt }))}</p>
              </div>
              ${reportLogoSrc ? `<img class="logo" src="${reportLogoSrc}" alt="Logo">` : ''}
            </div>
            <div class="meta">
              <div class="meta-grid">
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaDate'))}</strong>${escapeHtml(formatDisplayDate(visit.date || '-'))}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaEngineer'))}</strong>${escapeHtml(visit.engineer || '-')}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaClient'))}</strong>${escapeHtml(visit.client || '-')}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaSite'))}</strong>${escapeHtml(visit.site || '-')}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaStarted'))}</strong>${escapeHtml(formatDisplayDateTime(visit.startedAt || '-'))}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaEnded'))}</strong>${escapeHtml(formatDisplayDateTime(visit.endedAt || '-'))}</div>
              </div>
            </div>
            <div class="section">
              <h2>${escapeHtml(t('visitReportNewSection'))}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(t('tagId'))}</th>
                    <th>${escapeHtml(t('actions'))}</th>
                    <th>${escapeHtml(t('itemType'))}</th>
                    <th>${escapeHtml(t('description'))}</th>
                    <th>${escapeHtml(t('serial'))}</th>
                    <th>${escapeHtml(t('engineerReportNumber'))}</th>
                    <th>${escapeHtml(t('engineerManufacturer'))}</th>
                    <th>${escapeHtml(t('engineerModel'))}</th>
                    <th>${escapeHtml(t('engineerResult'))}</th>
                    <th>${escapeHtml(t('engineerFailureReason'))}</th>
                    <th>${escapeHtml(t('engineerValidityUntil'))}</th>
                    <th>${escapeHtml(t('contractor'))}</th>
                    <th>${escapeHtml(t('wll'))}</th>
                    <th>${escapeHtml(t('siteName'))}</th>
                    <th>${escapeHtml(t('status'))}</th>
                    <th>${escapeHtml(t('nextInspection'))}</th>
                    <th>${escapeHtml(t('notes'))}</th>
                    <th>${escapeHtml(t('engineerProfessionalNotes'))}</th>
                  </tr>
                </thead>
                <tbody>${renderRows(newEntries)}</tbody>
              </table>
            </div>
            <div class="section">
              <h2>${escapeHtml(t('visitReportCheckedSection'))}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(t('tagId'))}</th>
                    <th>${escapeHtml(t('actions'))}</th>
                    <th>${escapeHtml(t('itemType'))}</th>
                    <th>${escapeHtml(t('description'))}</th>
                    <th>${escapeHtml(t('serial'))}</th>
                    <th>${escapeHtml(t('engineerReportNumber'))}</th>
                    <th>${escapeHtml(t('engineerManufacturer'))}</th>
                    <th>${escapeHtml(t('engineerModel'))}</th>
                    <th>${escapeHtml(t('engineerResult'))}</th>
                    <th>${escapeHtml(t('engineerFailureReason'))}</th>
                    <th>${escapeHtml(t('engineerValidityUntil'))}</th>
                    <th>${escapeHtml(t('contractor'))}</th>
                    <th>${escapeHtml(t('wll'))}</th>
                    <th>${escapeHtml(t('siteName'))}</th>
                    <th>${escapeHtml(t('status'))}</th>
                    <th>${escapeHtml(t('nextInspection'))}</th>
                    <th>${escapeHtml(t('notes'))}</th>
                    <th>${escapeHtml(t('engineerProfessionalNotes'))}</th>
                  </tr>
                </thead>
                <tbody>${renderRows(checkedEntries)}</tbody>
              </table>
            </div>
            <div class="signature">
              <strong>${escapeHtml(t('visitReportSignature'))}</strong>
              <p>${escapeHtml(visit.signature || visit.engineer || '-')}</p>
            </div>
            <div class="footer">${escapeHtml(t('visitReportFooter'))}</div>
            </div>
          </body>
          </html>
        `;

        const printableHtml = `<!doctype html>${html}`.replace(
          '<body>',
          `<body><div class="no-print"><button onclick="window.print()" style="border:none;border-radius:12px;padding:12px 16px;background:#0f766e;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">${escapeHtml(printLabel)}</button></div>`
        );
        if(!renderReportWindow(reportWindow, printableHtml)){
          el('reportArchiveStatus').textContent = t('reportArchiveLoadError');
        }
      } catch (error) {
        if(reportWindow && !reportWindow.closed){
          reportWindow.close();
        }
        pushDebugLine(`Archived visit report error: ${error.message}`);
        el('reportArchiveStatus').textContent = t('reportArchiveLoadError');
      }
    }

    async function renderReportArchive(){
      const list = el('reportArchiveList');
      const status = el('reportArchiveStatus');
      if(!list || !status){
        return;
      }

      const fromDate = normalizeRegistrationDate(el('reportDateFrom')?.value);
      const toDate = normalizeRegistrationDate(el('reportDateTo')?.value);
      const selectedSite = getReportArchiveSiteValue();
      if(fromDate && toDate && fromDate > toDate){
        status.textContent = t('reportArchiveInvalidRange');
        list.innerHTML = '';
        updateReportArchiveButtonState();
        return;
      }

      status.textContent = t('reportArchiveLoading');
      list.innerHTML = `<div class="empty-text">${t('reportArchiveLoading')}</div>`;

      try {
        const logs = await getLogs();
        const allVisits = buildVisitArchiveRecords(logs);
        populateReportArchiveSiteOptions(allVisits, selectedSite);
        const activeSite = getReportArchiveSiteValue();
        const visits = allVisits.filter((visit) => {
          const visitSite = String(visit.site || '').trim();
          return isVisitWithinRange(visit, fromDate, toDate) && (activeSite === 'all' || visitSite === activeSite);
        });

        reportArchiveState.from = fromDate || '';
        reportArchiveState.to = toDate || '';
        reportArchiveState.site = activeSite;
        reportArchiveState.visits = visits;
        updateReportArchiveButtonState();
        updateLogsDashboardHeadings({
          totalLogs: dataCache.logs.value?.length || 0,
          shownLogs: dataCache.logs.value?.length || 0,
          visits
        });

        if(!visits.length){
          status.textContent = t('reportArchiveEmpty');
          list.innerHTML = `<div class="empty-text">${t('reportArchiveEmpty')}</div>`;
          return;
        }

        status.textContent = formatText('reportArchiveSummary', {
          count: visits.length,
          from: formatDisplayDate(fromDate || visits[visits.length - 1]?.date || ''),
          to: formatDisplayDate(toDate || visits[0]?.date || '')
        });

        list.innerHTML = visits.map((visit) => `
          <article class="report-archive-card">
            <div class="report-archive-card-top">
              <div>
                <div class="report-archive-card-title">${escapeHtml(formatDisplayDate(visit.date || '-'))}</div>
                <div class="report-archive-subtitle">${escapeHtml(visit.engineer || '-')}</div>
              </div>
              <div class="pill ${visit.endedAt ? 'pill-ok' : 'pill-warn'}">${escapeHtml(visit.endedAt ? t('visitStatusClosed') : t('visitStatusActive'))}</div>
            </div>
            <div class="report-archive-card-meta">
              <div><strong>${escapeHtml(t('reportArchiveMetaClient'))}</strong> ${escapeHtml(visit.client || '-')}</div>
              <div><strong>${escapeHtml(t('reportArchiveMetaSite'))}</strong> ${escapeHtml(visit.site || '-')}</div>
              <div><strong>${escapeHtml(t('reportArchiveMetaItems'))}</strong> ${escapeHtml(visit.itemCount || 0)}</div>
              <div><strong>${escapeHtml(t('reportArchiveMetaClosed'))}</strong> ${escapeHtml(formatDisplayDateTime(visit.endedAt || visit.startedAt || '-'))}</div>
            </div>
            <div class="report-archive-card-stats">
              <span class="mini-stat">${escapeHtml(t('visitActionNew'))}: ${escapeHtml(visit.newCount || 0)}</span>
              <span class="mini-stat">${escapeHtml(t('visitActionChecked'))}: ${escapeHtml(visit.checkedCount || 0)}</span>
            </div>
            <div class="report-archive-card-actions">
              <button class="mini-btn" type="button" onclick="openArchivedVisitReport('${escapeHtml(visit.id)}')">${escapeHtml(t('reportArchiveExport'))}</button>
            </div>
          </article>
        `).join('');
      } catch (error) {
        status.textContent = t('reportArchiveLoadError');
        list.innerHTML = `<div class="empty-text">${t('reportArchiveLoadError')}</div>`;
        pushDebugLine(`Report archive load error: ${error.message}`);
      }
    }

    function resetReportArchiveFilters(){
      if(el('reportDateFrom')) el('reportDateFrom').value = '';
      if(el('reportDateTo')) el('reportDateTo').value = '';
      if(el('reportArchiveSiteFilter')) el('reportArchiveSiteFilter').value = 'all';
      reportArchiveState.from = '';
      reportArchiveState.to = '';
      reportArchiveState.site = 'all';
      updateReportArchiveButtonState();
      renderReportArchive();
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

    function withCapturedLocation(item, locationSnapshot){
      if(!item || !locationSnapshot){
        return item;
      }

      return {
        ...item,
        lastSeenLocation: locationSnapshot,
        lastSeenAt: locationSnapshot.capturedAt,
        updatedAt: new Date().toLocaleString()
      };
    }

    function readFileAsDataUrl(file){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('File read failed'));
        reader.readAsDataURL(file);
      });
    }

    function sanitizeDecimalInput(value){
      const source = String(value || '').replace(/,/g, '.');
      let result = '';
      let hasDot = false;

      for(const char of source){
        if(char >= '0' && char <= '9'){
          result += char;
          continue;
        }

        if(char === '.' && !hasDot){
          result += '.';
          hasDot = true;
        }
      }

      return result;
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

    function updateBuildStamp(){
      const node = el('buildStampText');
      if(!node){
        return;
      }
      const assetVersion = window.__ASSET_VERSION || 'local';
      node.textContent = `Build ${assetVersion}`;
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

    function getSafetyTipKeys(type){
      if(type === '׳©׳׳§׳') return ['safety_shackle_1', 'safety_shackle_2', 'safety_shackle_3'];
      if(type === '׳¨׳¦׳•׳¢׳”') return ['safety_strap_1', 'safety_strap_2', 'safety_strap_3'];
      if(type === '׳©׳¨׳©׳¨׳×') return ['safety_chain_1', 'safety_chain_2', 'safety_chain_3'];
      if(type === '׳˜׳‘׳¢׳×') return ['safety_ring_1', 'safety_ring_2', 'safety_ring_3'];
      if(type === '׳•׳•') return ['safety_hook_1', 'safety_hook_2', 'safety_hook_3'];
      if(type === 'מטף כיבוי אש') return ['safety_fire_1', 'safety_fire_2', 'safety_fire_3'];
      if(type === 'מדחס אויר') return ['safety_aircomp_1', 'safety_aircomp_2', 'safety_aircomp_3'];
      return ['safety_other_1', 'safety_other_2', 'safety_other_3'];
    }

    function renderScanSafetyTips(itemType){
      el('scanSafetyTitle').textContent = t('scanSafetyTitle');
      el('scanSafetyIntro').textContent = t('scanSafetyIntro');
      el('scanSafetyList').innerHTML = getSafetyTipKeys(itemType)
        .map((key) => `<li>${escapeHtml(t(key))}</li>`)
        .join('');
    }

    function getSafetyTipsMarkup(itemType){
      return `
        <div class="scan-safety-intro">${escapeHtml(t('scanSafetyIntro'))}</div>
        <ul class="scan-safety-list">${getSafetyTipKeys(itemType)
        .map((key) => `<li>${escapeHtml(t(key))}</li>`)
        .join('')}</ul>
      `;
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

    function hideScanDemoGallery(){
      scanDemoGalleryMode = false;
      el('scanDemoGallery').classList.remove('active');
      el('scanDemoGallery').innerHTML = '';
    }

    function hasVisibleNote(value){
      return Boolean(String(value || '').trim());
    }

    function renderScanDemoGallery(items){
      const gallery = el('scanDemoGallery');
      const total = items.length;

      gallery.innerHTML = items.map((item, index) => {
        const demoItem = {
          ...item,
          lastSeenLocation: getDemoLocationSnapshot(index)
        };
        const statusClass = statusPillClass(item.status || '');
        const demoLocationUrl = getLocationMapUrl(demoItem.lastSeenLocation);
        const noteClass = hasVisibleNote(demoItem.notes) ? 'card-note-row has-note' : 'card-note-row';
        return `
          <article class="scan-demo-card">
            <div class="scan-demo-card-header">
              <div class="scan-demo-card-title">${escapeHtml(t('demoGalleryCard'))}</div>
              <div class="scan-demo-card-index">${escapeHtml(formatText('demoGalleryCount', { index: index + 1, total }))}</div>
            </div>
            <div class="result-grid">
              <div class="thumb"><img src="${escapeHtml(getDisplayImageSrc(demoItem))}" alt="Item image"></div>
              <div>
                <h3>${escapeHtml(translateType(demoItem.itemType))}</h3>
                <div>${escapeHtml(t('contractor'))}: ${escapeHtml(demoItem.contractor || '-')}</div>
                <div>${escapeHtml(t('siteName'))}: ${escapeHtml(demoItem.siteName || '-')}</div>
                <div>${escapeHtml(t('tagId'))}: <span class="mono">${escapeHtml(demoItem.tagId || '-')}</span></div>
                <div>${escapeHtml(t('description'))}: ${escapeHtml(demoItem.description || '-')}</div>
                <div>${escapeHtml(t('serial'))}: ${escapeHtml(demoItem.serialNumber || '-')}</div>
                <div>${escapeHtml(t('wll'))}: ${escapeHtml(demoItem.wll || '-')}</div>
                <div>${escapeHtml(t('nextInspection'))}: ${escapeHtml(formatDisplayDate(demoItem.nextInspection))}</div>
                <div>${escapeHtml(t('status'))}: <span class="${statusClass}">${escapeHtml(translateStatus(demoItem.status))}</span></div>
                <div class="${noteClass}">${escapeHtml(t('notes'))}: ${escapeHtml(demoItem.notes || '-')}</div>
                <div>${escapeHtml(lt('lastSeenLocation'))}: ${demoLocationUrl
                  ? `<a class="map-link" href="${escapeHtml(demoLocationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(getLastSeenLocationText(demoItem))}</a>`
                  : escapeHtml(getLastSeenLocationText(demoItem))}</div>
              </div>
            </div>
            <details class="scan-safety-card">
              <summary class="scan-safety-toggle">${escapeHtml(t('scanSafetyTitle'))}</summary>
              <div class="scan-safety-body">${getSafetyTipsMarkup(demoItem.itemType)}</div>
            </details>
          </article>
        `;
      }).join('');

      scanDemoGalleryMode = true;
      gallery.classList.add('active');
      el('scanResult').classList.remove('active');
      populateScanEditForm(null);
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

    function getRegisterScreenTitle(){
      if(registerAccessRole === 'foreman'){
        return t('foremanRegisterTitle');
      }
      if(isEngineerWorkspace()){
        return t('engineerWorkspaceTitle');
      }
      return t('registerTitle');
    }

    function updateRegisterAccessUi(){
      const canEdit = canEditRegister();
      const engineerWorkspace = isEngineerWorkspace();
      const registerTabButton = el('tabRegisterBtn');
      const registerPane = el('registerPane');
      const tableTabButton = el('tabTableBtn');
      const reportTabButton = el('tabReportBtn');
      const visitPanel = document.querySelector('.visit-panel');
      const visitEndPanel = el('visitEndPanel');
      const visitEndPlaceholder = el('visitEndPlaceholder');
      const registerTopbar = el('registerScreen')?.querySelector('.topbar');

      [
        'visitDate',
        'visitEngineer',
        'visitClient',
        'visitSite',
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

      [
        'engineerReportNumber',
        'engineerInspectorName',
        'engineerInspectionDate',
        'engineerManufacturer',
        'engineerModel',
        'engineerResult',
        'engineerFailureReason',
        'engineerValidityUntil',
        'engineerProfessionalNotes'
      ].forEach((id) => {
        if(el(id)){
          el(id).disabled = !canEdit || !engineerWorkspace;
        }
      });

      const canEditClosure = canEditVisitClosure();
      el('visitNotes').disabled = !canEditClosure;
      el('visitSignatureClearBtn').disabled = !canEditClosure;
      el('visitSignaturePad').classList.toggle('signature-pad-disabled', !canEditClosure);

      el('scanNewTagBtn').disabled = !canEdit;
      el('saveBtn').disabled = !canEdit;
      el('clearFormBtn').disabled = !canEdit;
      el('captureImageBtn').disabled = !canEdit;
      el('clearImageBtn').disabled = !canEdit;
      el('visitSaveBtn').disabled = !canEdit;
      el('visitCloseBtn').disabled = !canEdit || !activeVisit || activeVisit.status === 'closed';
      el('visitReportBtn').disabled = !canEdit || !activeVisit;
      el('visitReportBtn').hidden = !canEdit;
      el('scanNewTagBtn').hidden = !canEdit;
      if(el('saveAllTableChangesBtn')){
        el('saveAllTableChangesBtn').hidden = !canEdit;
        el('saveAllTableChangesBtn').style.display = canEdit ? '' : 'none';
      }
      if(reportTabButton){
        reportTabButton.hidden = !engineerWorkspace || !canEdit;
        reportTabButton.style.display = engineerWorkspace && canEdit ? '' : 'none';
      }
      registerTabButton.hidden = !canEdit;
      registerPane.hidden = !canEdit;
      registerTabButton.style.display = canEdit ? '' : 'none';
      registerPane.style.display = canEdit ? '' : 'none';
      if(canEdit){
        registerPane.hidden = false;
        registerPane.style.display = '';
      }
      if(visitPanel){
        visitPanel.hidden = !canEdit;
      }
      if(visitEndPanel){
        visitEndPanel.hidden = !activeVisit;
      }
      if(visitEndPlaceholder){
        visitEndPlaceholder.hidden = !!activeVisit || !canEdit;
      }
      if(registerTopbar){
        registerTopbar.classList.toggle('topbar-foreman', registerAccessRole === 'foreman');
      }
      document.querySelectorAll('.engineer-workspace-only').forEach((node) => {
        node.hidden = !engineerWorkspace;
      });
      el('registerScreenTitle').textContent = getRegisterScreenTitle();

      if(!canEdit){
        registerPane.classList.remove('active');
        if(tableTabButton){
          tableTabButton.classList.add('active');
        }
      }

      if(!canEdit && registerPane.classList.contains('active')){
        openRegisterTab('tablePane');
      }

      if(registerAccessRole === 'foreman'){
        el('registerStatus').textContent = t('scanReadOnlyNote');
      } else if(engineerWorkspace && canEdit){
        el('registerStatus').textContent = t('engineerWorkspaceReady');
      } else if(registerAccessRole === 'engineer' && el('registerStatus').textContent === t('scanReadOnlyNote')) {
        el('registerStatus').textContent = t('waitingForScan');
      }

      bindDateTextInputs();
      bindDecimalInputs();
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
        el('scanEditSiteName').value = '';
        el('scanEditNotes').value = '';
        return;
      }

      el('scanEditTagId').value = item.tagId || '';
      el('scanEditItemType').value = item.itemType || '׳©׳׳§׳';
      el('scanEditDescription').value = item.description || '';
      el('scanEditSerial').value = item.serialNumber || '';
      el('scanEditWll').value = item.wll || '';
      el('scanEditRegistrationDate').value = formatDateInputValue(getRegistrationDateValue(item));
      el('scanEditNextInspection').value = formatDateInputValue(item.nextInspection);
      el('scanEditStatus').value = item.status || '׳×׳§׳™׳';
      el('scanEditSiteName').value = item.siteName || '';
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
      const homeLangLabels = {
        he: { label: 'HE', aria: 'Hebrew' },
        en: { label: 'EN', aria: 'English' },
        ar: { label: 'AR', aria: 'Arabic' }
      };
      Object.entries(homeLangLabels).forEach(([code, copy]) => {
        const button = document.querySelector(`.flag-btn[data-lang="${code}"]`);
        if(!button){
          return;
        }
        button.setAttribute('aria-label', copy.aria);
        const label = button.querySelector('.flag-label');
        if(label){
          label.textContent = copy.label;
        }
      });

      const homeCopy = getHomeCopy();
      if(el('homeBusinessText')) el('homeBusinessText').textContent = t('homeBusiness');
      if(el('homeEngineerText')) el('homeEngineerText').textContent = t('homeEngineer');
      if(el('homeKickerText')) el('homeKickerText').textContent = homeCopy.kicker;
      if(el('homeTitleText')) el('homeTitleText').textContent = homeCopy.title;
      if(el('homeSubtitleText')) el('homeSubtitleText').textContent = homeCopy.subtitle;
      if(el('homeCheckText')) el('homeCheckText').textContent = t('homeCheck');
      if(el('homeCheckTextImage')){
        el('homeCheckTextImage').src = `./label-home-check-${currentLang}.png`;
        el('homeCheckTextImage').alt = t('homeCheck');
      }
      if(el('homeCheckHintText')) el('homeCheckHintText').textContent = isEngineerWorkspace() ? t('homeCheckHintEngineer') : homeCopy.primaryHint;
      const homeRegisterLabel = isEngineerWorkspace() ? t('homeRegister') : t('homeRegisterBusinessLabel');
      if(el('homeRegisterText')) el('homeRegisterText').textContent = homeRegisterLabel;
      if(el('homeRegisterTextImage')){
        el('homeRegisterTextImage').src = `./label-home-register-${currentLang}.png`;
        el('homeRegisterTextImage').alt = homeRegisterLabel;
      }
      if(el('homeRegisterHintText')) el('homeRegisterHintText').textContent = homeCopy.secondaryHint;
      if(el('homeEngineerHintText')) el('homeEngineerHintText').textContent = homeCopy.primaryHint;
      el('visitPanelTitleText').textContent = t('visitPanelTitle');
      el('visitPanelSubtitleText').textContent = t('visitPanelSubtitle');
      el('visitEndPanelTitleText').textContent = t('visitClose');
      el('visitEndPanelSubtitleText').textContent = t('visitReportIntro');
      if(el('visitEndPlaceholderTitle')) el('visitEndPlaceholderTitle').textContent = t('visitClose');
      if(el('visitEndPlaceholderText')) el('visitEndPlaceholderText').textContent = t('visitSummaryEmpty');
      el('visitDateLabelText').textContent = t('visitDateLabel');
      el('visitEngineerLabelText').textContent = t('visitEngineerLabel');
      el('visitClientLabelText').textContent = t('visitClientLabel');
      el('visitSiteLabelText').textContent = t('visitSiteLabel');
      el('visitSignaturePadLabelText').textContent = t('visitSignaturePadLabel');
      el('visitNotesLabelText').textContent = t('visitNotesLabel');
      el('visitCloseBtn').textContent = t('visitClose');
      el('visitReportBtn').textContent = t('visitReport');
      el('visitSignatureClearBtn').textContent = t('visitSignatureClear');
      el('visitEngineer').placeholder = t('visitEngineerPlaceholder');
      el('visitClient').placeholder = t('visitClientPlaceholder');
      el('visitSite').placeholder = t('visitSitePlaceholder');
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
      updateBuildStamp();

      el('passwordBackBtn').textContent = t('back');
      if(passwordContext === 'register'){
        el('passwordTitle').textContent = isEngineerWorkspace() ? t('engineerPasswordTitle') : t('businessPasswordTitle');
        el('passwordRoleHint').textContent = isEngineerWorkspace() ? t('engineerPasswordHint') : t('businessPasswordHint');
        el('engineerLoginTitleText').textContent = t('engineerLoginTitle');
        el('engineerRoleHintText').textContent = isEngineerWorkspace() ? t('engineerWorkspaceRoleHint') : t('engineerRoleHint');
        el('engineerPasswordLabelText').textContent = t('engineerPasswordLabel');
        el('engineerEnterBtn').textContent = t('passwordEnter');
        el('foremanLoginTitleText').textContent = t('foremanLoginTitle');
        el('foremanRoleHintText').textContent = t('foremanRoleHint');
        el('foremanPasswordLabelText').textContent = t('foremanPasswordLabel');
        el('foremanEnterBtn').textContent = t('passwordEnter');
      } else {
        el('passwordTitle').textContent = isEngineerWorkspace() ? t('engineerPasswordTitle') : t('businessPasswordTitle');
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
      el('scanNextInspectionPlus6Btn').textContent = t('nextInspectionPlus6');
      el('scanNextInspectionPlus12Btn').textContent = t('nextInspectionPlus12');
      el('scanEditStatusLabel').textContent = t('status');
      el('scanEditSiteNameLabel').textContent = t('siteName');
      el('scanEditNotesLabel').textContent = t('notes');
      el('scanSaveBtn').textContent = t('saveScanChanges');
      el('scanEditTagId').placeholder = t('tagPlaceholder');
      el('scanEditDescription').placeholder = t('descriptionPlaceholder');
      el('scanEditSerial').placeholder = t('serialPlaceholder');
      el('scanEditWll').placeholder = t('wllPlaceholder');
      el('scanEditSiteName').placeholder = t('siteNamePlaceholder');
      el('scanEditNotes').placeholder = t('notesPlaceholder');
      el('registerBackBtn').textContent = t('back');
      el('registerScreenTitle').textContent = getRegisterScreenTitle();
      el('tabRegisterBtn').textContent = isEngineerWorkspace() ? t('engineerTabInspection') : t('tabRegister');
      el('tabTableBtn').textContent = isEngineerWorkspace() ? t('engineerTabItems') : t('tabTable');
      el('tabReportBtn').textContent = isEngineerWorkspace() ? t('engineerTabReport') : t('tabReport');
      el('tabLogsBtn').textContent = isEngineerWorkspace() ? t('historicalReports') : t('tabLogs');
      el('scanNewTagBtn').textContent = t('scanNewTag');
      el('clearFormBtn').textContent = t('clearForm');
      if(el('saveAllTableChangesBtn')){
        el('saveAllTableChangesBtn').textContent = t('saveAllTableChanges');
      }

      el('tagIdLabel').textContent = t('tagId');
      el('itemTypeLabel').textContent = t('itemType');
      el('imageLabel').textContent = t('image');
      el('descriptionLabel').textContent = t('description');
      el('serialLabel').textContent = t('serial');
      if(el('contractorLabel')) el('contractorLabel').textContent = t('contractor');
      el('wllLabel').textContent = t('wll');
      el('registrationDateLabel').textContent = t('registrationDate');
      el('nextInspectionLabel').textContent = t('nextInspection');
      el('nextInspectionPlus6Btn').textContent = t('nextInspectionPlus6');
      el('nextInspectionPlus12Btn').textContent = t('nextInspectionPlus12');
      el('itemStatusLabel').textContent = t('status');
      if(el('siteNameLabel')) el('siteNameLabel').textContent = t('siteName');
      el('notesLabel').textContent = t('notes');
      if(el('engineerAssessmentTitleText')) el('engineerAssessmentTitleText').textContent = t('engineerAssessmentTitle');
      if(el('engineerAssessmentSubtitleText')) el('engineerAssessmentSubtitleText').textContent = t('engineerAssessmentSubtitle');
      if(el('engineerReportNumberLabelText')) el('engineerReportNumberLabelText').textContent = t('engineerReportNumber');
      if(el('engineerInspectorNameLabelText')) el('engineerInspectorNameLabelText').textContent = t('engineerInspectorName');
      if(el('engineerInspectionDateLabelText')) el('engineerInspectionDateLabelText').textContent = t('engineerInspectionDate');
      if(el('engineerValidityUntilLabelText')) el('engineerValidityUntilLabelText').textContent = t('engineerValidityUntil');
      if(el('engineerManufacturerLabelText')) el('engineerManufacturerLabelText').textContent = t('engineerManufacturer');
      if(el('engineerModelLabelText')) el('engineerModelLabelText').textContent = t('engineerModel');
      if(el('engineerResultLabelText')) el('engineerResultLabelText').textContent = t('engineerResult');
      if(el('engineerFailureReasonLabelText')) el('engineerFailureReasonLabelText').textContent = t('engineerFailureReason');
      if(el('engineerProfessionalNotesLabelText')) el('engineerProfessionalNotesLabelText').textContent = t('engineerProfessionalNotes');
      if(el('engineerResult')){
        el('engineerResult').innerHTML = `
          <option value="pass">${t('engineerResultPass')}</option>
          <option value="conditional">${t('engineerResultConditional')}</option>
          <option value="fail">${t('engineerResultFail')}</option>
        `;
      }
      el('saveBtn').textContent = t('saveItem');

      el('tagId').placeholder = t('tagPlaceholder');
      el('description').placeholder = t('descriptionPlaceholder');
      el('serialNumber').placeholder = t('serialPlaceholder');
      if(el('contractor')) el('contractor').placeholder = t('contractorPlaceholder');
      el('wll').placeholder = t('wllPlaceholder');
      if(el('engineerReportNumber')) el('engineerReportNumber').placeholder = t('engineerReportNumberPlaceholder');
      if(el('engineerInspectorName')) el('engineerInspectorName').placeholder = t('engineerInspectorNamePlaceholder');
      if(el('engineerManufacturer')) el('engineerManufacturer').placeholder = t('engineerManufacturerPlaceholder');
      if(el('engineerModel')) el('engineerModel').placeholder = t('engineerModelPlaceholder');
      if(el('engineerFailureReason')) el('engineerFailureReason').placeholder = t('engineerFailureReasonPlaceholder');
      if(el('engineerProfessionalNotes')) el('engineerProfessionalNotes').placeholder = t('engineerProfessionalNotesPlaceholder');
      if(el('siteName')) el('siteName').placeholder = t('siteNamePlaceholder');
      el('notes').placeholder = t('notesPlaceholder');

      el('lblContractor').textContent = t('contractor');
      el('lblTagId').textContent = t('tagId');
      el('lblDescription').textContent = t('description');
      el('lblSerial').textContent = t('serial');
      el('lblWll').textContent = t('wll');
      el('lblSiteName').textContent = t('siteName');
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
      el('reportPageTitleText').textContent = t('reportPageTitle');
      el('reportPageSubtitleText').textContent = t('reportPageSubtitle');
      if(el('reportPageExportBtn')){
        el('reportPageExportBtn').textContent = rt('reportSavePdf');
      }
      el('exportTableBtn').textContent = t('exportExcel');
      el('captureImageBtn').textContent = t('captureImage');
      el('clearImageBtn').textContent = t('clearImage');
      el('scanSafetyTitle').textContent = t('scanSafetyTitle');
      el('reportArchiveTitleText').textContent = t('reportArchiveTitle');
      el('reportArchiveSubtitleText').textContent = t('reportArchiveSubtitle');
      el('reportDateFromLabel').textContent = t('reportDateFrom');
      el('reportDateToLabel').textContent = t('reportDateTo');
      el('reportArchiveSiteLabel').textContent = t('reportArchiveSite');
      el('reportArchiveLoadBtn').textContent = t('reportArchiveLoad');
      el('reportArchiveResetBtn').textContent = t('reportArchiveReset');
      if(el('logsHistoryTitleText')) el('logsHistoryTitleText').textContent = t('logsHistoryTitle');
      const logsSubtitle = ensureLogsSubtitle();
      if(logsSubtitle){
        logsSubtitle.textContent = t('logsHistorySubtitle');
      }
      populateReportArchiveSiteOptions(reportArchiveState.visits, reportArchiveState.site || 'all');
      renderVisitStatus();

      updateTypeOptions();
      updateStatusOptions();
      updateScanEditOptions();
      fillEngineerAssessmentForm({ engineerAssessment: readEngineerAssessment() });
      updateRegisterAccessUi();
      updateTableFilterOptions();
      selectImageByType();
      if(scanDemoGalleryMode && dataCache.items.value?.length){
        renderScanDemoGallery([...dataCache.items.value].sort((a, b) => (a.tagId || '').localeCompare(b.tagId || '')));
      }
      refreshRegisterPaneContent();
      refreshDebugPanel();
      renderVisitStatus();

      if(!el('scanStatus').textContent.trim()) el('scanStatus').textContent = t('waitingForScan');
      if(!el('registerStatus').textContent.trim()) el('registerStatus').textContent = t('waitingForScan');
    }

    function refreshRegisterPaneContent(){
      if(!el('registerScreen')?.classList.contains('screen-open')){
        return;
      }

      if(el('tablePane')?.classList.contains('active')){
        renderItemsTable();
        return;
      }

      if(el('reportPane')?.classList.contains('active')){
        renderPresentationReportPage();
        return;
      }

      if(el('logsPane')?.classList.contains('active')){
        renderReportArchive();
        renderScanLogs();
      }
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
      updateSaveAllTableButton();
    }

    function updateSaveAllTableButton(state = 'idle'){
      const button = el('saveAllTableChangesBtn');
      if(!button){
        return;
      }

      const canEdit = canEditRegister();
      const pendingCount = pendingTableEdits.size;
      button.hidden = !canEdit;
      button.classList.remove('is-saving', 'is-done');

      if(state === 'saving'){
        button.disabled = true;
        button.classList.add('is-saving');
        button.textContent = t('saveAllTableChangesSaving');
        return;
      }

      if(state === 'done'){
        button.disabled = false;
        button.classList.add('is-done');
        button.textContent = t('saveAllTableChangesDoneShort');
        window.setTimeout(() => {
          updateSaveAllTableButton();
        }, 1200);
        return;
      }

      button.disabled = !canEdit || pendingCount === 0;
      button.textContent = pendingCount > 0
        ? `${t('saveAllTableChanges')} (${pendingCount})`
        : t('saveAllTableChanges');
    }

    function bindTableActionDelegation(){
      const container = el('itemsTableContainer');
      if(!container || container.dataset.actionsBound === '1'){
        return;
      }

      container.dataset.actionsBound = '1';
      const syncDraft = (target) => {
        if(!target?.dataset?.tagId){
          return;
        }

        const tagId = target.dataset.tagId;
        const draft = pendingTableEdits.get(tagId) || {};

        if(target.classList.contains('table-status-select')){
          draft.status = target.value;
          applySelectStatusClass(target, target.value);
        } else if(target.classList.contains('table-registration-date-input')){
          draft.registrationDate = target.value;
        } else if(target.classList.contains('table-date-input')){
          draft.nextInspection = target.value;
        } else if(target.classList.contains('table-site-name-input')){
          draft.siteName = target.value;
        } else if(target.classList.contains('table-notes-input')){
          draft.notes = target.value;
        } else {
          return;
        }

        pendingTableEdits.set(tagId, draft);
        updateSaveAllTableButton();
      };

      container.addEventListener('input', (event) => {
        syncDraft(event.target);
      });

      container.addEventListener('change', (event) => {
        syncDraft(event.target);
      });

      container.addEventListener('click', (event) => {
        const clearNoteButton = event.target.closest('.table-clear-note-btn');
        if(clearNoteButton){
          event.preventDefault();
          event.stopPropagation();
          const tagId = clearNoteButton.dataset.tagId || '';
          const safeTagId = CSS.escape(String(tagId));
          const notesInput = document.querySelector(`.table-notes-input[data-tag-id="${safeTagId}"]`);
          if(notesInput){
            notesInput.value = '';
            const draft = pendingTableEdits.get(tagId) || {};
            draft.notes = '';
            pendingTableEdits.set(tagId, draft);
            updateSaveAllTableButton();
            notesInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          return;
        }

        const saveButton = event.target.closest('.table-save-btn');
        if(saveButton){
          event.preventDefault();
          event.stopPropagation();
          saveTableRow(saveButton.dataset.tagId || '');
          return;
        }

        const deleteButton = event.target.closest('.table-delete-btn');
        if(deleteButton){
          event.preventDefault();
          event.stopPropagation();
          deleteTableRow(deleteButton.dataset.tagId || '', deleteButton);
        }
      });
    }

    function clearPendingDeleteIntent(){
      if(pendingDeleteResetTimer){
        clearTimeout(pendingDeleteResetTimer);
        pendingDeleteResetTimer = null;
      }

      if(!pendingDeleteTagId){
        return;
      }

      const safeTagId = CSS.escape(String(pendingDeleteTagId));
      const statusNode = document.querySelector(`.table-row-status[data-tag-id="${safeTagId}"]`);
      const deleteButton = document.querySelector(`.table-delete-btn[data-tag-id="${safeTagId}"]`);

      if(statusNode && statusNode.textContent === t('deleteItemPending')){
        statusNode.textContent = '';
      }

      if(deleteButton){
        deleteButton.classList.remove('delete-confirm');
      }

      pendingDeleteTagId = '';
    }

    function setPendingDeleteIntent(tagId, statusNode, deleteButton){
      clearPendingDeleteIntent();
      pendingDeleteTagId = tagId;
      statusNode.textContent = t('deleteItemPending');
      if(deleteButton){
        deleteButton.classList.add('delete-confirm');
      }
      pendingDeleteResetTimer = window.setTimeout(() => {
        clearPendingDeleteIntent();
      }, 5000);
    }

    function updateCachedItem(updatedItem){
      if(!dataCache.items.value){
        return;
      }

      const index = dataCache.items.value.findIndex((item) => item.tagId === updatedItem.tagId);
      if(index >= 0){
        dataCache.items.value[index] = updatedItem;
      }
    }

    function highlightSavedTableRow(tagId){
      const safeTagId = CSS.escape(String(tagId || ''));
      document.querySelectorAll('#itemsTableContainer tr.recently-saved-row').forEach((row) => {
        row.classList.remove('recently-saved-row');
      });
      const row = document.querySelector(`#itemsTableContainer tr[data-tag-id="${safeTagId}"]`);
      if(row){
        row.classList.add('recently-saved-row');
      }
    }

    async function saveTableRow(tagId){
      const safeTagId = CSS.escape(String(tagId || ''));
      const statusInput = document.querySelector(`.table-status-select[data-tag-id="${safeTagId}"]`);
      const registrationDateInput = document.querySelector(`.table-registration-date-input[data-tag-id="${safeTagId}"]`);
      const dateInput = document.querySelector(`.table-date-input[data-tag-id="${safeTagId}"]`);
      const siteNameInput = document.querySelector(`.table-site-name-input[data-tag-id="${safeTagId}"]`);
      const notesInput = document.querySelector(`.table-notes-input[data-tag-id="${safeTagId}"]`);
      const statusNode = document.querySelector(`.table-row-status[data-tag-id="${safeTagId}"]`);

      if(!statusInput || !registrationDateInput || !dateInput || !siteNameInput || !notesInput || !statusNode){
        return;
      }

      statusNode.textContent = t('saving');

      try {
        const existing = await getItemByTag(tagId);

        if(!existing){
          statusNode.textContent = t('itemNotFound');
          return;
        }

        const locationSnapshot = await getCurrentLocationSnapshot();
        const updatedItem = withCapturedLocation({
          ...existing,
          status: statusInput.value,
          registrationDate: normalizeRegistrationDate(registrationDateInput.value),
          nextInspection: normalizeRegistrationDate(dateInput.value),
          siteName: siteNameInput.value.trim(),
          notes: notesInput.value.trim(),
          updatedAt: new Date().toLocaleString()
        }, locationSnapshot);

        await saveItemToCloud(updatedItem);
        await saveScanLog(tagId, true, updatedItem, locationSnapshot, {
          actionType: 'register_update'
        });
        updateCachedItem(updatedItem);
        pendingTableEdits.delete(tagId);
        updateSaveAllTableButton();
        lastSavedTagId = tagId;
        applySelectStatusClass(statusInput, statusInput.value);
        highlightSavedTableRow(tagId);
        statusNode.textContent = t('tableRowUpdated');
      } catch (e) {
        pushDebugLine(`Inline table save error for ${tagId}: ${e.message}`);
        statusNode.textContent = t('cloudSaveError');
        console.error(e);
      }
    }

    async function deleteTableRow(tagId, triggerButton = null){
      const safeTagId = CSS.escape(String(tagId || ''));
      const statusNode = document.querySelector(`.table-row-status[data-tag-id="${safeTagId}"]`)
        || document.querySelector(`tr[data-tag-id="${safeTagId}"] .table-row-status`);
      const deleteButton = triggerButton || document.querySelector(`.table-delete-btn[data-tag-id="${safeTagId}"]`);

      if(!tagId || !statusNode){
        pushDebugLine(`Delete ignored for missing table row: ${tagId || 'empty tag'}.`);
        return;
      }

      if(!canEditRegister()){
        statusNode.textContent = t('scanEditNoPermission');
        return;
      }

      if(pendingDeleteTagId !== tagId){
        setPendingDeleteIntent(tagId, statusNode, deleteButton);
        pushDebugLine(`Delete armed for ${tagId}. Click again to confirm.`);
        return;
      }

      clearPendingDeleteIntent();
      statusNode.textContent = t('saving');

      try {
        await deleteDoc(doc(db, ITEMS_COLLECTION, tagId));
        invalidateItemsCache();
        pendingTableEdits.delete(tagId);
        updateSaveAllTableButton();
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
          t('siteName'),
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
          item.siteName || '',
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
      const normalizedDate = normalizeRegistrationDate(value);
      if(!normalizedDate) return null;
      const match = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
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
      return formatDisplayDate(value);
    }

    function formatDateInputValue(value){
      const normalizedDate = normalizeRegistrationDate(value);
      return normalizedDate ? formatDisplayDate(normalizedDate) : '';
    }

    function formatDisplayDate(value){
      const normalizedDate = normalizeRegistrationDate(value);
      if(!normalizedDate) return value || '-';
      const [year, month, day] = normalizedDate.split('-');
      return `${day}/${month}/${year}`;
    }

    function formatDisplayDateTime(value){
      const timeValue = toTimeValue(value);
      if(!timeValue) return value || '-';
      const parsed = new Date(timeValue);
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      const hours = String(parsed.getHours()).padStart(2, '0');
      const minutes = String(parsed.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function formatDateDigits(value){
      const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
      if(digits.length <= 2) return digits;
      if(digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    function getDatePickerLabel(){
      return currentLang === 'en'
        ? 'Open date picker'
        : currentLang === 'ar'
          ? 'افتح التقويم'
          : 'פתח תאריכון';
    }

    function syncDatePickerState(input, picker){
      if(!input || !picker){
        return;
      }
      picker.disabled = input.disabled;
      picker.value = normalizeRegistrationDate(input.value) || '';
    }

    function ensureDatePickerField(input){
      if(!input || input.dataset.datePickerBound === '1'){
        return;
      }

      input.dataset.datePickerBound = '1';
      const parent = input.parentElement;
      if(!parent){
        return;
      }

      let shell = input.closest('.date-input-shell');
      if(!shell){
        shell = document.createElement('div');
        shell.className = 'date-input-shell';
        parent.insertBefore(shell, input);
        shell.appendChild(input);
      }

      const triggerWrap = document.createElement('div');
      triggerWrap.className = 'date-picker-trigger-wrap';
      const triggerIcon = document.createElement('span');
      triggerIcon.className = 'date-picker-trigger';
      triggerIcon.textContent = '📅';
      const picker = document.createElement('input');
      picker.type = 'date';
      picker.className = 'native-date-picker';
      picker.tabIndex = -1;
      picker.setAttribute('aria-label', getDatePickerLabel());
      picker.title = getDatePickerLabel();
      triggerWrap.appendChild(triggerIcon);
      triggerWrap.appendChild(picker);
      shell.appendChild(triggerWrap);

      const refreshPicker = () => syncDatePickerState(input, picker);
      const openPicker = () => {
        refreshPicker();
        if(typeof picker.showPicker === 'function'){
          try {
            picker.showPicker();
            return;
          } catch (error) {
            pushDebugLine(`Date picker fallback used: ${error.message}`);
          }
        }
        picker.focus();
        picker.click();
      };

      triggerWrap.addEventListener('click', (event) => {
        if(input.disabled || picker.disabled){
          return;
        }
        event.preventDefault();
        openPicker();
      });

      picker.addEventListener('focus', refreshPicker);
      picker.addEventListener('pointerdown', refreshPicker);
      picker.addEventListener('click', refreshPicker);
      picker.addEventListener('change', () => {
        input.value = formatDateInputValue(picker.value);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      refreshPicker();
    }

    function bindDateTextInputs(){
      document.querySelectorAll('.date-text-input').forEach((input) => {
        if(input.dataset.dateBound === '1'){
          return;
        }
        input.dataset.dateBound = '1';
        input.addEventListener('input', () => {
          const formatted = formatDateDigits(input.value);
          if(input.value !== formatted){
            input.value = formatted;
          }
        });
        input.addEventListener('blur', () => {
          const normalizedDate = normalizeRegistrationDate(input.value);
          input.value = normalizedDate ? formatDisplayDate(normalizedDate) : String(input.value || '').trim();
        });
      });

      document.querySelectorAll('.date-text-input').forEach((input) => {
        ensureDatePickerField(input);
        const picker = input.parentElement?.querySelector('.native-date-picker');
        syncDatePickerState(input, picker);
      });

      document.querySelectorAll('.native-date-picker').forEach((picker) => {
        picker.setAttribute('aria-label', getDatePickerLabel());
        picker.title = getDatePickerLabel();
      });
    }

    function bindDecimalInputs(){
      document.querySelectorAll('[data-decimal-input="1"]').forEach((input) => {
        if(input.dataset.decimalBound === '1'){
          return;
        }

        input.dataset.decimalBound = '1';
        input.addEventListener('input', () => {
          const sanitized = sanitizeDecimalInput(input.value);
          if(input.value !== sanitized){
            input.value = sanitized;
          }
        });
        input.addEventListener('blur', () => {
          input.value = sanitizeDecimalInput(input.value);
        });
      });
    }

    let reportLogoDataUrlPromise = null;

    function getReportLogoDataUrl(){
      if(reportLogoDataUrlPromise){
        return reportLogoDataUrlPromise;
      }

      reportLogoDataUrlPromise = fetch('./logo-transparent.png')
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
      const displayMatch = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
      if(displayMatch){
        const [, dayText, monthText, year] = displayMatch;
        const day = String(dayText).padStart(2, '0');
        const month = String(monthText).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    function addMonthsToIsoDate(baseDate, monthsToAdd){
      const normalizedBaseDate = normalizeRegistrationDate(baseDate) || todayIsoDate();
      const [yearText, monthText, dayText] = normalizedBaseDate.split('-');
      const year = Number(yearText);
      const monthIndex = Number(monthText) - 1;
      const day = Number(dayText);
      const calculatedDate = new Date(year, monthIndex + monthsToAdd + 1, 0);
      calculatedDate.setDate(Math.min(day, calculatedDate.getDate()));
      const nextYear = calculatedDate.getFullYear();
      const nextMonth = String(calculatedDate.getMonth() + 1).padStart(2, '0');
      const nextDay = String(calculatedDate.getDate()).padStart(2, '0');
      return `${nextYear}-${nextMonth}-${nextDay}`;
    }

    function getNextInspectionBaseDate(targetId){
      const preferredRegistrationDate = targetId === 'scanEditNextInspection'
        ? normalizeRegistrationDate(el('scanEditRegistrationDate')?.value)
        : normalizeRegistrationDate(el('registrationDate')?.value);
      return normalizeRegistrationDate(el('visitDate')?.value)
        || preferredRegistrationDate
        || normalizeRegistrationDate(el('registrationDate')?.value)
        || normalizeRegistrationDate(el('scanEditRegistrationDate')?.value)
        || todayIsoDate();
    }

    function applyNextInspectionOffset(targetId, monthsToAdd){
      const target = el(targetId);
      if(!target) return;
      target.value = formatDisplayDate(addMonthsToIsoDate(getNextInspectionBaseDate(targetId), monthsToAdd));
    }

    function getInspectionBucket(item){
      const days = daysUntilInspection(item.nextInspection);
      if(days === null) return 'missing';
      if(days < 0) return 'overdue';
      if(days <= 30) return 'upcoming';
      return 'future';
    }

    function compareInspectionUrgency(itemA, itemB){
      const rankForDays = (days) => {
        if(days === null) return 2;
        if(days < 0) return 0;
        if(days <= 30) return 1;
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

    function buildPresentationPriorityRows(reportItems){
      return reportItems.length
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
    }

    async function renderPresentationReportPage(){
      const container = el('reportPageContent');
      const status = el('reportPageStatus');
      if(!container || !status){
        return;
      }

      container.innerHTML = `<div class="empty-text">Loading...</div>`;
      status.textContent = '';

      try {
        const allItems = await getItems();
        const items = sortItems(getFilteredItems(allItems));
        const total = items.length;
        const okCount = items.filter((item) => normalizeStatus(item.status) === 'ok').length;
        const reviewCount = items.filter((item) => normalizeStatus(item.status) === 'review').length;
        const disabledCount = items.filter((item) => normalizeStatus(item.status) === 'disabled').length;
        const overdueItems = items.filter((item) => getInspectionBucket(item) === 'overdue');
        const upcomingItems = items.filter((item) => getInspectionBucket(item) === 'upcoming');
        const missingDateItems = items.filter((item) => getInspectionBucket(item) === 'missing');
        const reportItems = [...items].sort(compareInspectionUrgency);
        const priorityRows = buildPresentationPriorityRows(reportItems);
        const cards = [
          { label: rt('reportTotalItems'), value: total, tone: 'teal' },
          { label: t('reportOkItems'), value: okCount, tone: 'green' },
          { label: t('reportReviewItems'), value: reviewCount, tone: 'amber' },
          { label: t('reportDisabledItems'), value: disabledCount, tone: 'slate' },
          { label: rt('reportOverdue'), value: overdueItems.length, tone: 'rose' },
          { label: t('reportMissingDate'), value: missingDateItems.length, tone: 'blue' }
        ];

        status.textContent = formatText('reportPageScope', {
          shown: total,
          total: allItems.length
        });

        if(!total){
          container.innerHTML = `<div class="report-page-empty">${escapeHtml(t('reportNoItems'))}</div>`;
          return;
        }

        container.innerHTML = `
          <div class="report-page-inline-summary" aria-label="${escapeHtml(rt('reportExecutiveSummary'))}">
            ${cards.map((card) => `
              <span class="report-page-inline-chip report-page-inline-chip-${card.tone}">
                <span class="report-page-inline-label">${escapeHtml(card.label)}</span>
                <span class="report-page-inline-value">${escapeHtml(card.value)}</span>
              </span>
            `).join('')}
          </div>

          <section class="report-page-section">
            <h3>${escapeHtml(rt('reportExecutiveSummary'))}</h3>
            <p class="report-page-summary">${escapeHtml(formatExecutiveSummaryText(items, {
              total,
              ok: okCount,
              review: reviewCount,
              disabled: disabledCount
            }))}</p>
            <ul class="report-page-points">
              <li>${escapeHtml(formatReportText('reportOverdueLine', { count: overdueItems.length }))}</li>
              <li>${escapeHtml(formatReportText('reportUpcomingLine', { count: upcomingItems.length }))}</li>
              <li>${escapeHtml(formatReportText('reportMissingDateLine', { count: missingDateItems.length }))}</li>
            </ul>
          </section>

          <section class="report-page-section">
            <h3>${escapeHtml(rt('reportPriorityTable'))}</h3>
            <div class="report-page-table-wrap">
              <table class="report-page-table">
                <thead>
                  <tr>
                    <th>${escapeHtml(t('tagId'))}</th>
                    <th>${escapeHtml(t('itemType'))}</th>
                    <th>${escapeHtml(t('description'))}</th>
                    <th>${escapeHtml(t('status'))}</th>
                    <th>${escapeHtml(t('registrationDate'))}</th>
                    <th>${escapeHtml(t('nextInspection'))}</th>
                    <th>${escapeHtml(t('reportPriorityStatus'))}</th>
                  </tr>
                </thead>
                <tbody>${priorityRows}</tbody>
              </table>
            </div>
          </section>
        `;
      } catch (error) {
        container.innerHTML = `<div class="empty-text">${escapeHtml(t('reportPageLoadError'))}</div>`;
        status.textContent = t('reportPageLoadError');
        pushDebugLine(`Report page load error: ${error.message}`);
      }
    }

    async function exportPresentationReport(){
      const reportWindow = openReportWindow(rt('reportTitle'));
      try {
        const items = sortItems(getFilteredItems(await getItems()));
        const reportLogoSrc = await getReportLogoDataUrl();
        const reportLogoUrl = new URL('./logo-transparent.png', window.location.href).href;
        const total = items.length;
        const okCount = items.filter((item) => normalizeStatus(item.status) === 'ok').length;
        const reviewCount = items.filter((item) => normalizeStatus(item.status) === 'review').length;
        const disabledCount = items.filter((item) => normalizeStatus(item.status) === 'disabled').length;
        const overdueItems = items.filter((item) => getInspectionBucket(item) === 'overdue');
        const upcomingItems = items.filter((item) => getInspectionBucket(item) === 'upcoming');
        const missingDateItems = items.filter((item) => getInspectionBucket(item) === 'missing');
        const reportItems = [...items].sort(compareInspectionUrgency);
        const generatedAt = formatDisplayDateTime(new Date());
        const printLabel = currentLang === 'en'
          ? 'Save PDF'
          : currentLang === 'ar'
            ? 'حفظ PDF'
            : 'שמור PDF';

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
              .subtitle { color:#475569; margin-bottom:18px; font-size:18px; line-height:1.75; font-weight:600; }
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
              @media (max-width: 700px) {
                body { padding:20px; }
                h1 { font-size:32px; line-height:1.2; }
                .subtitle { font-size:21px; line-height:1.9; }
              }
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
              <p>${escapeHtml(formatExecutiveSummaryText(items, {
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

        const reportHtml = buildReportHtml(reportLogoSrc || reportLogoUrl);
        const printableHtml = reportHtml.replace(
          '<body>',
          `<body><div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;"><button onclick="window.print()" style="border:none;border-radius:12px;padding:12px 16px;background:#0f766e;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">${escapeHtml(printLabel)}</button></div>`
        );
        renderReportWindow(reportWindow, printableHtml);
        pushDebugLine(`Exported presentation report for ${items.length} items.`);
      } catch (e) {
        if(reportWindow && !reportWindow.closed){
          reportWindow.close();
        }
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
          item.contractor,
          item.wll,
          item.siteName,
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

    async function saveScanLog(tagId, found, item = null, locationSnapshot = null, options = {}){
      pushDebugLine(`Writing scan log for ${tagId} (${found ? 'found' : 'not found'}).`);
      const visit = getCurrentVisitForLogs();
      await addDoc(collection(db, LOGS_COLLECTION), {
        tagId,
        found,
        actionType: options.actionType || '',
        itemStatus: item?.status || '',
        itemType: item?.itemType || '',
        itemDescription: item?.description || '',
        itemSerialNumber: item?.serialNumber || '',
        itemContractor: item?.contractor || '',
        itemWll: item?.wll || '',
        itemSiteName: item?.siteName || '',
        itemNextInspection: item?.nextInspection || '',
        itemNotes: item?.notes || '',
        engineerReportNumber: item?.engineerAssessment?.reportNumber || '',
        engineerInspectorName: item?.engineerAssessment?.engineerName || '',
        engineerInspectionDate: item?.engineerAssessment?.inspectionDate || '',
        engineerManufacturer: item?.engineerAssessment?.manufacturer || '',
        engineerModel: item?.engineerAssessment?.model || '',
        engineerResult: item?.engineerAssessment?.result || '',
        engineerFailureReason: item?.engineerAssessment?.failureReason || '',
        engineerValidityUntil: item?.engineerAssessment?.validityUntil || '',
        engineerProfessionalNotes: item?.engineerAssessment?.professionalNotes || '',
        lastSeenLocation: locationSnapshot || item?.lastSeenLocation || null,
        lastSeenAt: locationSnapshot?.capturedAt || item?.lastSeenAt || '',
        visitId: visit?.id || '',
        visitDate: visit?.date || '',
        visitEngineer: visit?.engineer || '',
        visitClient: visit?.client || '',
        visitSite: visit?.site || '',
        visitSignature: visit?.signature || '',
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
      ensureLogsDashboardShell();
      container.innerHTML = `<div class="empty-text">Loading...</div>`;

      try {
        const [logs, items] = await Promise.all([getLogs(), getItems()]);
        const itemMap = new Map(items.map((item) => [normalizeTagId(item.tagId), item]));
        const visits = buildVisitArchiveRecords(logs);
        renderLogsSummary(logs, visits);
        updateLogsDashboardHeadings({
          totalLogs: logs.length,
          shownLogs: logs.length,
          visits
        });

        if(!logs.length){
          container.innerHTML = `<div class="empty-text">${t('logTitleEmpty')}<br>${t('logsHistoryEmptyHelp')}</div>`;
          renderReportArchive();
          renderVisitStatus();
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
          const contractorText = log.itemContractor || fallbackItem?.contractor || '';
          const siteText = log.itemSiteName || fallbackItem?.siteName || '';
          const effectiveLocation = log.lastSeenLocation || fallbackItem?.lastSeenLocation || null;
          const locationText = effectiveLocation?.label || formatLocationSnapshot(effectiveLocation) || lt('locationUnavailable');
          const locationMapUrl = getLocationMapUrl(effectiveLocation);
          const actionText = formatLogAction(log);
          const nextInspectionText = log.itemNextInspection || fallbackItem?.nextInspection || '';
          return `
            <div class="${itemClass}">
              <div class="log-top">
                <div class="log-pill-row">
                  <span class="${foundClass}">${stateText}</span>
                  ${statusText ? `<span class="${statusClass}">${t('status')}: ${statusText}</span>` : ''}
                  ${actionText ? `<span class="pill pill-neutral">${escapeHtml(actionText)}</span>` : ''}
                </div>
                <span class="log-time">${escapeHtml(formatDisplayDateTime(log.time))}</span>
              </div>
              <div class="log-meta-grid">
                <div><strong>${t('logTag')}:</strong> <span class="mono">${log.tagId}</span></div>
                ${typeText ? `<div><strong>${t('itemType')}:</strong> ${typeText}</div>` : ''}
                ${contractorText ? `<div><strong>${t('contractor')}:</strong> ${escapeHtml(contractorText)}</div>` : ''}
                ${siteText ? `<div><strong>${t('siteName')}:</strong> ${escapeHtml(siteText)}</div>` : ''}
                ${nextInspectionText ? `<div><strong>${t('nextInspection')}:</strong> ${escapeHtml(formatDisplayDate(nextInspectionText))}</div>` : ''}
                ${locationText && locationText !== lt('locationUnavailable') ? `<div><strong>${lt('lastSeenLocation')}:</strong> ${locationMapUrl
                  ? `${escapeHtml(locationText)} <a class="map-link" href="${escapeHtml(locationMapUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('locationMapLink'))}</a>`
                  : escapeHtml(locationText)}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');
        renderReportArchive();
        renderVisitStatus();
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
                <th>${sortableHeader(t('contractor'), 'contractor')}</th>
                <th>${t('wll')}</th>
                <th>${sortableHeader(t('siteName'), 'siteName')}</th>
                <th>${sortableHeader(t('registrationDate'), 'registrationDate')}</th>
                <th>${sortableHeader(t('nextInspection'), 'nextInspection')}</th>
                <th>${t('notes')}</th>
                <th>${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.map(item => {
                const draft = pendingTableEdits.get(item.tagId) || {};
                const draftStatus = draft.status ?? item.status;
                const draftSiteName = draft.siteName ?? item.siteName ?? '';
                const draftRegistrationDate = draft.registrationDate ?? getRegistrationDateValue(item);
                const draftNextInspection = draft.nextInspection ?? item.nextInspection ?? '';
                const draftNotes = draft.notes ?? item.notes ?? '';
                return `
                <tr class="${item.tagId === lastSavedTagId ? 'recently-saved-row' : ''}" data-tag-id="${escapeHtml(item.tagId || '')}">
                  <td data-label="${t('image')}"><img class="small-thumb" src="${getDisplayImageSrc(item)}" alt="item"></td>
                  <td data-label="${t('tagId')}"><span class="mono">${item.tagId || ''}</span></td>
                  <td data-label="${t('status')}">
                    <select class="toolbar-input table-inline-input table-status-select" data-tag-id="${escapeHtml(item.tagId || '')}" ${canEditRegister() ? '' : 'disabled'}>
                      ${getStatusOptionsMarkup(draftStatus)}
                    </select>
                  </td>
                  <td data-label="${t('itemType')}">${translateType(item.itemType)}</td>
                  <td data-label="${t('description')}">${escapeHtml(item.description || '')}</td>
                  <td data-label="${t('serial')}">${escapeHtml(item.serialNumber || '')}</td>
                  <td data-label="${t('contractor')}">${escapeHtml(item.contractor || '')}</td>
                  <td data-label="${t('wll')}">${escapeHtml(item.wll || '')}</td>
                  <td class="table-edit-cell" data-label="${t('siteName')}">
                    <input class="toolbar-input table-inline-input table-site-name-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="text" value="${escapeHtml(draftSiteName)}" placeholder="${escapeHtml(t('siteNamePlaceholder'))}" ${canEditRegister() ? '' : 'disabled'}>
                  </td>
                  <td class="table-edit-cell" data-label="${t('registrationDate')}">
                    ${canEditRegister()
                      ? `<input class="toolbar-input table-inline-input table-registration-date-input date-text-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="text" inputmode="numeric" placeholder="DD/MM/YYYY" value="${escapeHtml(formatDateInputValue(draftRegistrationDate))}">`
                      : `<span>${escapeHtml(formatDisplayDate(draftRegistrationDate))}</span>`}
                  </td>
                  <td class="table-edit-cell" data-label="${t('nextInspection')}">
                    ${canEditRegister()
                      ? `<input class="toolbar-input table-inline-input table-date-input date-text-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="text" inputmode="numeric" placeholder="DD/MM/YYYY" value="${escapeHtml(formatDateInputValue(draftNextInspection))}">`
                      : `<span>${escapeHtml(formatDisplayDate(draftNextInspection))}</span>`}
                  </td>
                  <td class="table-edit-cell" data-label="${t('notes')}">
                    <div class="table-notes-wrap">
                      <input class="toolbar-input table-inline-input table-notes-input" data-tag-id="${escapeHtml(item.tagId || '')}" type="text" value="${escapeHtml(draftNotes)}" placeholder="${escapeHtml(t('notesPlaceholder'))}" ${canEditRegister() ? '' : 'disabled'}>
                      ${canEditRegister() ? `<button class="table-clear-note-btn" type="button" data-tag-id="${escapeHtml(item.tagId || '')}" aria-label="${escapeHtml(t('clearNote'))}" title="${escapeHtml(t('clearNote'))}">×</button>` : ''}
                    </div>
                  </td>
                  <td class="table-edit-cell" data-label="${t('actions')}">
                    <div class="table-actions-cell">
                      ${canEditRegister() ? `<button class="mini-btn table-save-btn" type="button" data-tag-id="${escapeHtml(item.tagId || '')}">${t('saveChanges')}</button>
                      <button class="mini-btn table-delete-btn" type="button" data-tag-id="${escapeHtml(item.tagId || '')}">${t('deleteItem')}</button>` : ''}
                      <div class="table-row-status muted" data-tag-id="${escapeHtml(item.tagId || '')}"></div>
                    </div>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        `;
        bindDateTextInputs();
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

    function openReportWindow(title = 'Report'){
      const reportWindow = window.open('', '_blank');
      if(!reportWindow){
        return null;
      }

      reportWindow.document.open();
      reportWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head><body style="font-family:Arial,sans-serif;padding:24px;color:#0f172a;">Loading report...</body></html>`);
      reportWindow.document.close();
      return reportWindow;
    }

    function renderReportWindow(reportWindow, html){
      if(!reportWindow || reportWindow.closed){
        return false;
      }

      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      reportWindow.focus();
      return true;
    }

    function openScreen(screenId){
      el('homeScreen').style.display = 'none';
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      el(screenId).classList.add('active');
      document.documentElement.classList.add('screen-open');
      document.body.classList.add('screen-open');
      clearStatuses();

      if(screenId === 'registerScreen'){
        const registerScreen = el('registerScreen');
        if(registerScreen){
          registerScreen.scrollTop = 0;
          registerScreen.scrollLeft = 0;
          requestAnimationFrame(() => registerScreen.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
        }
        renderVisitStatus();
      }

      if(screenId === 'scanScreen'){
        hideScanDemoGallery();
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
      document.documentElement.classList.remove('screen-open');
      document.body.classList.remove('screen-open');
      clearStatuses();
      hideScanDemoGallery();
      currentScannedItem = null;
      registerAccessRole = '';
      currentAppMode = APP_VARIANT;
      populateScanEditForm(null);
      fillEngineerAssessmentForm();
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
      if(el('foremanLoginCard')) el('foremanLoginCard').classList.remove('module-hidden');
      setLang(currentLang);
    }

    function checkPassword(role){
      pushDebugLine(`Register access granted for ${role}.`);
      registerAccessRole = role;
      el('engineerPasswordInput').value = '';
      el('foremanPasswordInput').value = '';
      el('passwordStatus').textContent = '';
      openScreen('registerScreen');
      openRegisterTab(role === 'engineer' ? 'registerPane' : 'tablePane');
      updateRegisterAccessUi();
      refreshVisitSignaturePad();
    }

    function openRegisterTab(tabId){
      if(tabId === 'registerPane' && !canEditRegister()){
        tabId = 'tablePane';
      }
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      el(tabId).classList.add('active');

      if(tabId === 'registerPane'){
        el('tabRegisterBtn').classList.add('active');
        refreshVisitSignaturePad();
      } else if(tabId === 'tablePane'){
        el('tabTableBtn').classList.add('active');
        renderItemsTable();
      } else if(tabId === 'reportPane'){
        el('tabReportBtn').classList.add('active');
        renderPresentationReportPage();
      } else {
        el('tabLogsBtn').classList.add('active');
        renderReportArchive();
        renderScanLogs();
      }
    }

    async function saveAllTableChanges(){
      if(!canEditRegister()){
        return;
      }

      const entries = [...pendingTableEdits.keys()];
      if(!entries.length){
        updateSaveAllTableButton();
        const container = el('itemsTableContainer');
        const statusNode = container?.querySelector('.table-row-status');
        if(statusNode){
          statusNode.textContent = t('tableNoPendingChanges');
        }
        return;
      }

      updateSaveAllTableButton('saving');
      let saved = 0;
      let failed = 0;

      for(const tagId of entries){
        try {
          await saveTableRow(tagId);
          if(!pendingTableEdits.has(tagId)){
            saved += 1;
          } else {
            failed += 1;
          }
        } catch (error) {
          failed += 1;
          pushDebugLine(`Bulk save error for ${tagId}: ${error.message}`);
        }
      }

      if(saved > 0 && failed === 0){
        updateSaveAllTableButton('done');
      } else {
        updateSaveAllTableButton();
      }
    }

    function saveVisitSession(){
      const draft = getVisitFormData();
      if(!draft.engineer){
        renderVisitStatus(t('visitStatusNeedEngineer'));
        return;
      }

      const now = new Date();
      const startNewVisit = !activeVisit || activeVisit.status === 'closed';
      activeVisit = {
        id: startNewVisit ? createVisitId() : activeVisit.id,
        status: 'active',
        date: draft.date,
        engineer: draft.engineer,
        client: draft.client,
        site: draft.site,
        signature: draft.signature || draft.engineer,
        notes: draft.notes,
        signatureDataUrl: getVisitSignatureDataUrl() || activeVisit?.signatureDataUrl || '',
        startedAt: startNewVisit ? now.toLocaleString() : activeVisit.startedAt,
        startedAtIso: startNewVisit ? now.toISOString() : activeVisit.startedAtIso,
        endedAt: '',
        endedAtIso: '',
        updatedAt: now.toLocaleString()
      };
      persistActiveVisit();
      populateVisitForm(activeVisit);
      renderVisitStatus(t(startNewVisit ? 'visitStatusStarted' : 'visitStatusUpdated'));
      updateRegisterAccessUi();
      pushDebugLine(`Visit ${activeVisit.id} saved for ${activeVisit.engineer}.`);
    }

    async function closeVisitSession(){
      if(!activeVisit){
        renderVisitStatus(t('visitStatusNoVisit'));
        return;
      }
      if(activeVisit.status === 'closed'){
        renderVisitStatus(t('visitStatusClosedMessage'));
        return;
      }

      const now = new Date();
      const draft = getVisitFormData();
      const closedVisit = {
        ...activeVisit,
        notes: draft.notes,
        signatureDataUrl: getVisitSignatureDataUrl() || activeVisit.signatureDataUrl || '',
        status: 'closed',
        endedAt: now.toLocaleString(),
        endedAtIso: now.toISOString(),
        updatedAt: now.toLocaleString()
      };
      activeVisit = closedVisit;

      try {
        await addDoc(collection(db, LOGS_COLLECTION), {
          tagId: `visit:${closedVisit.id}`,
          found: true,
          actionType: 'visit_closed',
          itemStatus: '',
          itemType: '',
          itemDescription: '',
          itemSerialNumber: '',
          itemContractor: '',
          itemWll: '',
          itemSiteName: '',
          itemNextInspection: '',
          itemNotes: closedVisit.notes || '',
          lastSeenLocation: null,
          lastSeenAt: '',
          visitId: closedVisit.id || '',
          visitDate: closedVisit.date || '',
          visitEngineer: closedVisit.engineer || '',
          visitClient: closedVisit.client || '',
          visitSite: closedVisit.site || '',
          visitSignature: closedVisit.signature || '',
          time: closedVisit.endedAt || new Date().toLocaleString(),
          sortTime: closedVisit.endedAtIso || new Date().toISOString()
        });
        invalidateLogsCache();
      } catch (error) {
        pushDebugLine(`Visit close log error: ${error.message}`);
      }

      persistActiveVisit();
      populateVisitForm(activeVisit);
      renderVisitStatus(t('visitStatusClosedMessage'));
      updateRegisterAccessUi();
      await renderReportArchive();
      await renderScanLogs();
      pushDebugLine(`Visit ${activeVisit.id} closed.`);
    }

    function clearForm(){
      el('tagId').value = '';
      el('itemType').value = '׳©׳׳§׳';
      el('description').value = '';
      el('serialNumber').value = '';
      el('contractor').value = getVisitClientValue();
      el('wll').value = '';
      el('registrationDate').value = formatDateInputValue(todayIsoDate());
      el('nextInspection').value = '';
      el('itemStatus').value = '׳×׳§׳™׳';
      el('siteName').value = getVisitSiteValue();
      el('notes').value = '';
      fillEngineerAssessmentForm();
      customImageSrc = '';
      pendingImageTask = null;
      el('itemImageInput').value = '';
      selectImageByType();
      updateStatusColorSelect();
      el('registerStatus').textContent = t('waitingForScan');
      el('saveStatus').textContent = '';
    }

    function buildVisitEntries(logs, items){
      const itemMap = new Map(items.map((item) => [normalizeTagId(item.tagId), item]));
      const relevantLogs = getVisitRelevantLogs(logs)
        .sort((a, b) => String(b.sortTime || '').localeCompare(String(a.sortTime || '')));
      const priority = { register_new: 3, register_update: 2, check: 1 };
      const entryMap = new Map();

      relevantLogs.forEach((log) => {
        const existing = entryMap.get(log.tagId);
        if(existing && (priority[existing.actionType] || 0) >= (priority[log.actionType] || 0)){
          return;
        }
        entryMap.set(log.tagId, log);
      });

      return [...entryMap.values()]
        .map((log) => {
          const fallbackItem = itemMap.get(normalizeTagId(log.tagId));
          const isNew = log.actionType === 'register_new';
          return {
            tagId: log.tagId || fallbackItem?.tagId || '',
            actionType: log.actionType || 'check',
            actionLabel: isNew ? t('visitActionNew') : t('visitActionChecked'),
            itemType: log.itemType || fallbackItem?.itemType || '',
            description: log.itemDescription || fallbackItem?.description || '',
            serialNumber: log.itemSerialNumber || fallbackItem?.serialNumber || '',
            wll: log.itemWll || fallbackItem?.wll || '',
            contractor: log.itemContractor || fallbackItem?.contractor || '',
            siteName: log.itemSiteName || fallbackItem?.siteName || '',
            status: log.itemStatus || fallbackItem?.status || '',
            nextInspection: log.itemNextInspection || fallbackItem?.nextInspection || '',
            notes: log.itemNotes || fallbackItem?.notes || '',
            engineerAssessment: {
              reportNumber: log.engineerReportNumber || fallbackItem?.engineerAssessment?.reportNumber || '',
              engineerName: log.engineerInspectorName || fallbackItem?.engineerAssessment?.engineerName || '',
              inspectionDate: log.engineerInspectionDate || fallbackItem?.engineerAssessment?.inspectionDate || '',
              manufacturer: log.engineerManufacturer || fallbackItem?.engineerAssessment?.manufacturer || '',
              model: log.engineerModel || fallbackItem?.engineerAssessment?.model || '',
              result: log.engineerResult || fallbackItem?.engineerAssessment?.result || '',
              failureReason: log.engineerFailureReason || fallbackItem?.engineerAssessment?.failureReason || '',
              validityUntil: log.engineerValidityUntil || fallbackItem?.engineerAssessment?.validityUntil || '',
              professionalNotes: log.engineerProfessionalNotes || fallbackItem?.engineerAssessment?.professionalNotes || ''
            },
            time: log.time || ''
          };
        })
        .sort((a, b) => a.tagId.localeCompare(b.tagId));
    }

    async function exportVisitReport(){
      const reportWindow = openReportWindow(t('visitReportTitle'));
      if(!activeVisit){
        if(reportWindow && !reportWindow.closed){
          reportWindow.close();
        }
        renderVisitStatus(t('visitReportNoVisit'));
        return;
      }

      try {
        const reportVisit = {
          ...activeVisit,
          notes: String(el('visitNotes')?.value || activeVisit.notes || '').trim(),
          signatureDataUrl: getVisitSignatureDataUrl() || activeVisit.signatureDataUrl || ''
        };
        const [logs, items, reportLogoSrc] = await Promise.all([getLogs(true), getItems(), getReportLogoDataUrl()]);
        const entries = buildVisitEntries(logs, items);
        const newEntries = entries.filter((entry) => entry.actionType === 'register_new');
        const checkedEntries = entries.filter((entry) => entry.actionType !== 'register_new');
        const generatedAt = formatDisplayDateTime(new Date());
        const printLabel = rt('reportSavePdf');

        const renderRows = (rows) => rows.length ? rows.map((entry) => `
          <tr>
            <td>${escapeHtml(entry.tagId || '-')}</td>
            <td>${escapeHtml(entry.actionLabel)}</td>
            <td>${escapeHtml(translateType(entry.itemType))}</td>
            <td>${escapeHtml(entry.description || '-')}</td>
            <td>${escapeHtml(entry.serialNumber || '-')}</td>
            <td>${escapeHtml(entry.wll || '-')}</td>
            <td>${escapeHtml(entry.contractor || '-')}</td>
            <td>${escapeHtml(entry.siteName || '-')}</td>
            <td>${escapeHtml(translateStatus(entry.status || ''))}</td>
            <td>${escapeHtml(formatReportDate(entry.nextInspection))}</td>
            <td>${escapeHtml(entry.notes || '-')}</td>
          </tr>
        `).join('') : `<tr><td colspan="12">${escapeHtml(t('visitReportEmpty'))}</td></tr>`;

        const html = `
          <html dir="${currentLang === 'en' ? 'ltr' : 'rtl'}" lang="${escapeHtml(currentLang)}">
          <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(t('visitReportTitle'))}</title>
            <style>
              @page { size:A4 portrait; margin:10mm; }
              * { box-sizing:border-box; }
              html, body { margin:0; padding:0; background:#fff; }
              body { font-family: Arial, sans-serif; color:#0f172a; font-size:12px; line-height:1.45; }
              .report-shell { width:190mm; max-width:100%; margin:0 auto; }
              .header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px; }
              .header-copy { flex:1; min-width:0; }
              .logo { width:96px; height:96px; object-fit:contain; flex:0 0 auto; }
              h1 { margin:0 0 6px; font-size:24px; color:#0f766e; line-height:1.2; }
              h2 { margin:0 0 10px; font-size:18px; line-height:1.25; }
              p { margin:0 0 8px; line-height:1.55; }
              .meta, .section { border:1px solid #dbe4ea; border-radius:16px; padding:14px; margin-bottom:12px; overflow:hidden; break-inside:avoid; page-break-inside:avoid; }
              .meta-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px 14px; }
              .meta-row { min-width:0; }
              .meta-row strong { display:block; margin-bottom:2px; color:#475569; }
              table { width:100%; border-collapse:collapse; margin-top:10px; table-layout:fixed; font-size:10px; }
              th, td { border:1px solid #dbe4ea; padding:6px 5px; text-align:${currentLang === 'en' ? 'left' : 'right'}; vertical-align:top; word-break:break-word; overflow-wrap:anywhere; }
              th { background:#f8fafc; font-size:10px; line-height:1.25; }
              .signature { margin-top:18px; padding-top:14px; border-top:2px solid #cbd5e1; break-inside:avoid; page-break-inside:avoid; }
              .footer { margin-top:14px; color:#64748b; font-size:11px; }
              .no-print { margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; }
              @media print {
                .no-print { display:none !important; }
                .report-shell { width:auto; max-width:none; }
              }
            </style>
          </head>
          <body>
            <div class="report-shell">
            <div class="header">
              <div class="header-copy">
                <h1>${escapeHtml(t('visitReportTitle'))}</h1>
                <p>${escapeHtml(t('visitReportIntro'))}</p>
                <p>${escapeHtml(formatText('visitReportGenerated', { date: generatedAt }))}</p>
              </div>
              ${reportLogoSrc ? `<img class="logo" src="${reportLogoSrc}" alt="Logo">` : ''}
            </div>

            <div class="meta">
              <div class="meta-grid">
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaDate'))}</strong>${escapeHtml(formatDisplayDate(reportVisit.date || '-'))}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaEngineer'))}</strong>${escapeHtml(reportVisit.engineer || '-')}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaClient'))}</strong>${escapeHtml(reportVisit.client || '-')}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaSite'))}</strong>${escapeHtml(reportVisit.site || '-')}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaStarted'))}</strong>${escapeHtml(formatDisplayDateTime(reportVisit.startedAt || '-'))}</div>
                <div class="meta-row"><strong>${escapeHtml(t('visitReportMetaEnded'))}</strong>${escapeHtml(formatDisplayDateTime(reportVisit.endedAt || '-'))}</div>
              </div>
              ${reportVisit.notes ? `<p><strong>${escapeHtml(t('visitNotesLabel'))}</strong><br>${escapeHtml(reportVisit.notes)}</p>` : ''}
            </div>

            <div class="section">
              <h2>${escapeHtml(t('visitReportNewSection'))}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(t('tagId'))}</th>
                    <th>${escapeHtml(t('actions'))}</th>
                    <th>${escapeHtml(t('itemType'))}</th>
                    <th>${escapeHtml(t('description'))}</th>
                    <th>${escapeHtml(t('serial'))}</th>
                    <th>${escapeHtml(t('contractor'))}</th>
                    <th>${escapeHtml(t('wll'))}</th>
                    <th>${escapeHtml(t('siteName'))}</th>
                    <th>${escapeHtml(t('status'))}</th>
                    <th>${escapeHtml(t('nextInspection'))}</th>
                    <th>${escapeHtml(t('notes'))}</th>
                  </tr>
                </thead>
                <tbody>${renderRows(newEntries)}</tbody>
              </table>
            </div>

            <div class="section">
              <h2>${escapeHtml(t('visitReportCheckedSection'))}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(t('tagId'))}</th>
                    <th>${escapeHtml(t('actions'))}</th>
                    <th>${escapeHtml(t('itemType'))}</th>
                    <th>${escapeHtml(t('description'))}</th>
                    <th>${escapeHtml(t('serial'))}</th>
                    <th>${escapeHtml(t('contractor'))}</th>
                    <th>${escapeHtml(t('wll'))}</th>
                    <th>${escapeHtml(t('siteName'))}</th>
                    <th>${escapeHtml(t('status'))}</th>
                    <th>${escapeHtml(t('nextInspection'))}</th>
                    <th>${escapeHtml(t('notes'))}</th>
                  </tr>
                </thead>
                <tbody>${renderRows(checkedEntries)}</tbody>
              </table>
            </div>

            <div class="signature">
              <strong>${escapeHtml(t('visitReportSignature'))}</strong>
              ${reportVisit.signatureDataUrl ? `<p><img src="${reportVisit.signatureDataUrl}" alt="Signature" style="max-width:280px;max-height:120px;display:block;margin-top:10px;margin-bottom:10px;"></p>` : ''}
              <p>${escapeHtml(reportVisit.signature || reportVisit.engineer || '-')}</p>
            </div>

            <div class="footer">${escapeHtml(t('visitReportFooter'))}</div>
            </div>
          </body>
          </html>
        `;

        const printableHtml = `<!doctype html>${html}`.replace(
          '<body>',
          `<body><div class="no-print"><button onclick="window.print()" style="border:none;border-radius:12px;padding:12px 16px;background:#0f766e;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">${escapeHtml(printLabel)}</button></div>`
        );
        renderReportWindow(reportWindow, printableHtml);
        renderVisitStatus();
      } catch (error) {
        if(reportWindow && !reportWindow.closed){
          reportWindow.close();
        }
        pushDebugLine(`Visit report export error: ${error.message}`);
        renderVisitStatus(t('cloudReadError'));
      }
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
      line.innerHTML = `<span id="lblLastSeenLocation"></span>: <a id="scanLastSeenLocation" class="map-link" href="#" target="_blank" rel="noopener noreferrer"></a>`;
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
      const demoParam = params.get('demo');

      if (langParam && LANG[langParam]) {
        setLang(langParam);
      }

      if (screenParam === 'password') {
        openPasswordScreen();
        return;
      }

      if (screenParam === 'scan') {
        openScreen('scanScreen');
        if(demoParam === '1'){
          await demoScan();
        }
        return;
      }

      if (screenParam === 'register') {
        openScreen('registerScreen');

        if (tabParam === 'table') {
          openRegisterTab('tablePane');
          await renderItemsTable();
          return;
        }

        if (tabParam === 'report') {
          openRegisterTab('reportPane');
          await renderPresentationReportPage();
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
      hideScanDemoGallery();
      currentScannedItem = item;
      el('scanEditPanel').hidden = true;
      el('scanItemImage').src = getDisplayImageSrc(item);
      el('scanItemType').textContent = translateType(item.itemType);
      el('scanContractor').textContent = item.contractor || '-';
      el('scanTagId').textContent = item.tagId || '-';
      el('scanDescription').textContent = item.description || '-';
      el('scanSerial').textContent = item.serialNumber || '-';
      el('scanWll').textContent = item.wll || '-';
      el('scanSiteName').textContent = item.siteName || '-';
      el('scanNextInspection').textContent = formatDisplayDate(item.nextInspection);
      el('scanItemStatus').textContent = translateStatus(item.status);
      applyStatusColor(el('scanItemStatus'), item.status);
      el('scanNotes').textContent = item.notes || '-';
      el('scanNotesRow').classList.toggle('has-note', hasVisibleNote(item.notes));
      updateLastSeenLocationLink(item);
      renderScanSafetyTips(item.itemType);
      el('scanResult').classList.add('active');
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

        const locationSnapshot = await getCurrentLocationSnapshot();
        const updatedItem = withCapturedLocation({
          ...currentScannedItem,
          tagId: nextTagId,
          itemType: el('scanEditItemType').value,
          description: el('scanEditDescription').value.trim(),
          serialNumber: el('scanEditSerial').value.trim(),
          wll: sanitizeDecimalInput(el('scanEditWll').value),
          registrationDate: normalizeRegistrationDate(el('scanEditRegistrationDate').value) || getRegistrationDateValue(currentScannedItem),
          nextInspection: normalizeRegistrationDate(el('scanEditNextInspection').value),
          status: el('scanEditStatus').value,
          siteName: el('scanEditSiteName').value.trim(),
          notes: el('scanEditNotes').value.trim(),
          updatedAt: new Date().toLocaleString()
        }, locationSnapshot);

        await saveItemToCloud(updatedItem);
        if(nextTagId !== originalTagId){
          await deleteDoc(doc(db, ITEMS_COLLECTION, originalTagId));
          invalidateItemsCache();
        }
        await saveScanLog(nextTagId, true, updatedItem, locationSnapshot, {
          actionType: 'register_update'
        });

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
      el('contractor').value = getVisitClientValue() || item.contractor || '';
      el('wll').value = item.wll || '';
      el('registrationDate').value = formatDateInputValue(getRegistrationDateValue(item));
      el('nextInspection').value = formatDateInputValue(item.nextInspection);
      el('itemStatus').value = item.status || '׳×׳§׳™׳';
      el('siteName').value = getVisitSiteValue() || item.siteName || '';
      el('notes').value = item.notes || '';
      fillEngineerAssessmentForm(item);
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
      const locationSnapshot = await getCurrentLocationSnapshot();
      const engineerAssessment = isEngineerWorkspace() ? readEngineerAssessment(existing) : (existing?.engineerAssessment || null);
      const item = withCapturedLocation({
        tagId,
        itemType: el('itemType').value,
        description: el('description').value.trim(),
        serialNumber: el('serialNumber').value.trim(),
        contractor: getVisitClientValue() || el('contractor').value.trim() || existing?.contractor || '',
        wll: sanitizeDecimalInput(el('wll').value),
        registrationDate: normalizeRegistrationDate(el('registrationDate').value) || getRegistrationDateValue(existing),
        nextInspection: normalizeRegistrationDate(el('nextInspection').value),
        status: el('itemStatus').value,
        siteName: getVisitSiteValue() || el('siteName').value.trim() || existing?.siteName || '',
        notes: el('notes').value.trim(),
        engineerAssessment,
        imageSrc: customImageSrc || getDefaultImageForType(el('itemType').value),
        lastSeenLocation: existing?.lastSeenLocation || null,
        lastSeenAt: existing?.lastSeenAt || '',
        createdAt: existing?.createdAt || new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      }, locationSnapshot);

      try {
        await saveItemToCloud(item);
        await saveScanLog(tagId, true, item, locationSnapshot, {
          actionType: existing ? 'register_update' : 'register_new'
        });
        pushDebugLine(`Save flow completed for ${tagId}.`);
        el('saveStatus').textContent = existing ? t('itemUpdated') : t('itemSaved');
        lastSavedTagId = tagId;
        fillRegisterForm(item);
        await renderItemsTable();
        await renderScanLogs();
        await renderReportArchive();
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
          hideScanDemoGallery();
          currentScannedItem = null;
          populateScanEditForm(null);
          el('scanResult').classList.remove('active');
          el('scanStatus').textContent = t('noItemsForDemo');
          return;
        }

        const sortedItems = [...items].sort((a, b) => (a.tagId || '').localeCompare(b.tagId || ''));
        renderScanDemoGallery(sortedItems);
        currentScannedItem = null;
        el('scanStatus').textContent = t('demoGalleryReady');
        pushDebugLine(`Demo gallery rendered with ${sortedItems.length} items.`);
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
            await saveScanLog(tagId, !!found, locatedItem, locationSnapshot, {
              actionType: mode === 'scan' ? 'check' : found ? 'register_update' : 'register_lookup'
            });

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
    if(el('reportArchiveSiteFilter')){
      el('reportArchiveSiteFilter').addEventListener('change', () => {
        renderReportArchive();
      });
    }

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
    window.openBusinessModule = openBusinessModule;
    window.openEngineerModule = openEngineerModule;
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
    window.saveVisitSession = saveVisitSession;
    window.closeVisitSession = closeVisitSession;
    window.exportVisitReport = exportVisitReport;
    window.clearVisitSignaturePad = clearVisitSignaturePad;
    window.applyNextInspectionOffset = applyNextInspectionOffset;
    window.saveScanItemEdits = saveScanItemEdits;
    window.saveTableRow = saveTableRow;
    window.deleteTableRow = deleteTableRow;
    window.triggerImagePicker = triggerImagePicker;
    window.clearCustomImage = clearCustomImage;
    window.toggleTableSort = toggleTableSort;
    window.exportTableCsv = exportTableCsv;
    window.saveAllTableChanges = saveAllTableChanges;
    window.renderPresentationReportPage = renderPresentationReportPage;
    window.exportPresentationReport = exportPresentationReport;
    window.demoScan = demoScan;
    window.startScan = startScan;
    window.renderItemsTable = renderItemsTable;
    window.renderScanLogs = renderScanLogs;
    window.renderReportArchive = renderReportArchive;
    window.resetReportArchiveFilters = resetReportArchiveFilters;
    window.openArchivedVisitReport = openArchivedVisitReport;

    async function bootApp(){
      ensureScanLocationRow();
      bindTableActionDelegation();
      bindDateTextInputs();
      bindDecimalInputs();
      setupVisitSignaturePad();
      loadActiveVisit();
      populateVisitForm();
      setLang(currentLang);
      clearStatuses();
      clearForm();
      selectImageByType();
      updateStatusColorSelect();
      updateRegisterAccessUi();
      await applyUrlTestState();
      refreshDebugPanel();
      pushDebugLine('App boot completed.');
    }

    bootApp();
