"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hyTranslations, enTranslations } from '@/lib/i18n';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';

type Case = {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  image_url?: string;
  details?: string;
  category?: string;
  client?: string;
  year?: string;
  created_at?: string;
};

type Font = {
  id: string;
  name_am: string;
  name_en: string;
  category: string;
  creator?: string;
  year?: string;
  description_am?: string;
  description_en?: string;
  downloadable: boolean;
  paid: boolean;
  price?: string;
  font_file_url: string;
  download_url?: string;
  purchase_url?: string;
  created_at?: string;
};

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

type Visit = {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  city: string;
  referrer: string;
  landing_page: string;
  created_at: string;
  updated_at: string;
};

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28CFE', '#FF6688'];

const GRADIENT_PRESETS = [
  { name: 'Կարմիր-Վարդագույն', value: 'linear-gradient(135deg, #ec407a 0%, #ab47bc 100%)' },
  { name: 'Մուգ Ինդիգո', value: 'linear-gradient(135deg, #311b92 0%, #1a237e 100%)' },
  { name: 'Թագավորական Կապույտ', value: 'linear-gradient(135deg, #0d47a1 0%, #00103a 100%)' },
  { name: 'Զմրուխտե Կանաչ', value: 'linear-gradient(135deg, #1b5e20 0%, #002706 100%)' },
  { name: 'Ոսկեգույն Շոկոլադ', value: 'linear-gradient(135deg, #2b1f1d 0%, #171110 100%)' },
  { name: 'Արքայական Ծիրանի', value: 'linear-gradient(135deg, #b71c1c 0%, #5f0909 100%)' },
  { name: 'Մուգ Գրաֆիտ', value: 'linear-gradient(135deg, #424242 0%, #151515 100%)' }
];

type CursorDef = {
  svg: string;
  hotspot_x: number;
  hotspot_y: number;
};

type PersonalizationSettings = {
  site_title_hy: string;
  site_title_en: string;
  site_desc_hy: string;
  site_desc_en: string;
  theme_hue: string;
  cursor_colors: string[];
  cursors: {
    default: CursorDef;
    pointer: CursorDef;
    text: CursorDef;
  };
};

const DEFAULT_COLORS = [
  "#d4907e", "#89b59a", "#7aa4b8", "#b09dba", "#d4b884",
  "#a07aa0", "#6fa8b3", "#a8ae7a", "#7b90a8", "#c9a07a"
];

const DEFAULT_CURSORS = {
  default: {
    svg: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="8" height="20" rx="4" fill="currentColor"/>
  <rect x="12" y="6" width="8" height="46" rx="4" fill="currentColor"/>
  <rect x="24" y="12" width="8" height="66" rx="4" fill="currentColor"/>
  <rect x="36" y="18" width="8" height="82" rx="4" fill="currentColor"/>
  <rect x="48" y="24" width="8" height="72" rx="4" fill="currentColor"/>
  <rect x="60" y="30" width="8" height="56" rx="4" fill="currentColor"/>
  <rect x="72" y="36" width="8" height="20" rx="4" fill="currentColor"/>
  <rect x="72" y="66" width="8" height="12" rx="4" fill="currentColor"/>
  <rect x="84" y="42" width="8" height="10" rx="4" fill="currentColor"/>
  <rect x="84" y="76" width="8" height="16" rx="4" fill="currentColor"/>
</svg>`,
    hotspot_x: 0,
    hotspot_y: 0
  },
  pointer: {
    svg: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="44" width="8" height="36" rx="4" fill="currentColor"/>
  <rect x="12" y="12" width="8" height="68" rx="4" fill="currentColor"/>
  <rect x="24" y="24" width="8" height="56" rx="4" fill="currentColor"/>
  <rect x="36" y="24" width="8" height="56" rx="4" fill="currentColor"/>
  <rect x="48" y="36" width="8" height="44" rx="4" fill="currentColor"/>
</svg>`,
    hotspot_x: 5,
    hotspot_y: 4
  },
  text: {
    svg: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Top segments -->
  <rect x="0" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="12" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="48" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="60" y="12" width="8" height="16" rx="4" fill="currentColor"/>
  
  <!-- Middle continuous segments -->
  <rect x="24" y="12" width="8" height="76" rx="4" fill="currentColor"/>
  <rect x="36" y="12" width="8" height="76" rx="4" fill="currentColor"/>
  
  <!-- Bottom segments -->
  <rect x="0" y="72" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="12" y="72" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="48" y="72" width="8" height="16" rx="4" fill="currentColor"/>
  <rect x="60" y="72" width="8" height="16" rx="4" fill="currentColor"/>
</svg>`,
    hotspot_x: 11,
    hotspot_y: 16
  }
};

function extractTidioWidgetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Try to match standard Tidio code URL pattern: code.tidio.co/{id}(.js)
  const match = trimmed.match(/code\.tidio\.co\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // If it's a raw alphanumeric ID
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to match any alphanumeric string of typical Tidio ID length (usually 32 chars)
  const fallbackMatch = trimmed.match(/[a-zA-Z0-9]{20,40}/);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }
  
  return trimmed;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'analytics' | 'cases' | 'fonts' | 'messages' | 'translations' | 'apis' | 'personalization' | 'settings'>('analytics');
  const [personalization, setPersonalization] = useState<PersonalizationSettings>({
    site_title_hy: 'HDesign',
    site_title_en: 'HDesign',
    site_desc_hy: 'Դիզայնի և Բրենդավորման Ստուդիա',
    site_desc_en: 'Design & Branding Studio',
    theme_hue: '172',
    cursor_colors: DEFAULT_COLORS,
    cursors: DEFAULT_CURSORS
  });
  const [activeCursorType, setActiveCursorType] = useState<'default' | 'pointer' | 'text'>('default');
  const [newCursorColor, setNewCursorColor] = useState('#ffffff');
  const [cases, setCases] = useState<Case[]>([]);
  const [fonts, setFonts] = useState<Font[]>([]);
  const [casesSubTab, setCasesSubTab] = useState<'branding' | 'gallery' | 'fonts'>('branding');

  // Slide-over drawer states
  const [drawerType, setDrawerType] = useState<'case_preview' | 'case_edit' | 'font_preview' | 'font_edit' | null>(null);
  
  // Drawer form states for Case
  const [drawerCaseId, setDrawerCaseId] = useState('');
  const [drawerCaseTitle, setDrawerCaseTitle] = useState('');
  const [drawerCaseSubtitle, setDrawerCaseSubtitle] = useState('');
  const [drawerCaseClient, setDrawerCaseClient] = useState('');
  const [drawerCaseYear, setDrawerCaseYear] = useState('');
  const [drawerCaseCategory, setDrawerCaseCategory] = useState('');
  const [drawerCaseBg, setDrawerCaseBg] = useState('');
  const [drawerCaseImageUrl, setDrawerCaseImageUrl] = useState('');
  const [drawerCaseOriginal, setDrawerCaseOriginal] = useState<Case | null>(null);

  // Drawer form states for Font
  const [drawerFontId, setDrawerFontId] = useState('');
  const [drawerFontNameAm, setDrawerFontNameAm] = useState('');
  const [drawerFontNameEn, setDrawerFontNameEn] = useState('');
  const [drawerFontCategory, setDrawerFontCategory] = useState('');
  const [drawerFontCreator, setDrawerFontCreator] = useState('');
  const [drawerFontYear, setDrawerFontYear] = useState('');
  const [drawerFontPrice, setDrawerFontPrice] = useState('');
  const [drawerFontPurchaseUrl, setDrawerFontPurchaseUrl] = useState('');
  const [drawerFontDownloadable, setDrawerFontDownloadable] = useState(true);
  const [drawerFontPaid, setDrawerFontPaid] = useState(false);
  const [drawerFontFileUrl, setDrawerFontFileUrl] = useState('');
  const [drawerFontOriginal, setDrawerFontOriginal] = useState<Font | null>(null);

  // Sandbox text state inside drawer font preview
  const [drawerFontSandboxText, setDrawerFontSandboxText] = useState('Մուտքագրեք փորձարկվող տեքստը այստեղ...');
  const [drawerFontSize, setDrawerFontSize] = useState(32);

  // View mode states
  const [casesViewMode, setCasesViewMode] = useState<'grid' | 'list'>('grid');
  const [fontsViewMode, setFontsViewMode] = useState<'grid' | 'list'>('grid');

  // Sorting states
  const [casesSortBy, setCasesSortBy] = useState<'title' | 'year' | 'category' | 'newest'>('newest');
  const [fontsSortBy, setFontsSortBy] = useState<'name' | 'year' | 'category' | 'price'>('name');

  const sortedCases = useMemo(() => {
    let copy = [...cases];
    if (casesSortBy === 'title') {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else if (casesSortBy === 'year') {
      copy.sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    } else if (casesSortBy === 'category') {
      copy.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else if (casesSortBy === 'newest') {
      copy.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }
    return copy;
  }, [cases, casesSortBy]);

  const filteredCasesForAdmin = useMemo(() => {
    return sortedCases.filter(c => {
      const isPort = String(c.id).startsWith('port-');
      if (casesSubTab === 'branding') {
        return !isPort;
      } else {
        return isPort;
      }
    });
  }, [sortedCases, casesSubTab]);

  const sortedFonts = useMemo(() => {
    let copy = [...fonts];
    if (fontsSortBy === 'name') {
      copy.sort((a, b) => a.name_en.localeCompare(b.name_en));
    } else if (fontsSortBy === 'year') {
      copy.sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    } else if (fontsSortBy === 'category') {
      copy.sort((a, b) => (a.category || 'Sans-Serif').localeCompare(b.category || 'Sans-Serif'));
    } else if (fontsSortBy === 'price') {
      copy.sort((a, b) => {
        const pa = a.paid ? parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0') : 0;
        const pb = b.paid ? parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0') : 0;
        return pb - pa;
      });
    }
    return copy;
  }, [fonts, fontsSortBy]);

  // Behance-style project block states
  const [caseBlocks, setCaseBlocks] = useState<any[]>([]);
  const [fontBlocks, setFontBlocks] = useState<any[]>([]);

  // Case Blocks Helpers
  const addCaseBlock = (type: string) => {
    const newBlock: any = { type };
    if (type === 'text') {
      newBlock.title_am = '';
      newBlock.title_en = '';
      newBlock.content_am = '';
      newBlock.content_en = '';
    } else if (type === 'image') {
      newBlock.image_url = '';
      newBlock.caption_am = '';
      newBlock.caption_en = '';
      newBlock.fullWidth = false;
    } else if (type === 'embed') {
      newBlock.embed_url = '';
    } else if (type === 'color_palette') {
      newBlock.colors = ['#ffffff'];
    } else if (type === 'typography_showcase') {
      newBlock.fonts = ['Outfit'];
      newBlock.previewText = 'Հրանտ Հակոբյան Դիզայն 2026';
    }
    setCaseBlocks(prev => [...prev, newBlock]);
  };

  const updateCaseBlock = (idx: number, updated: any) => {
    setCaseBlocks(prev => prev.map((b, i) => i === idx ? updated : b));
  };

  const deleteCaseBlock = (idx: number) => {
    setCaseBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const moveCaseBlock = (idx: number, dir: 'up' | 'down') => {
    setCaseBlocks(prev => {
      const copy = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target >= 0 && target < copy.length) {
        const temp = copy[idx];
        copy[idx] = copy[target];
        copy[target] = temp;
      }
      return copy;
    });
  };

  // Font Blocks Helpers
  const addFontBlock = (type: string) => {
    const newBlock: any = { type };
    if (type === 'text') {
      newBlock.title_am = '';
      newBlock.title_en = '';
      newBlock.content_am = '';
      newBlock.content_en = '';
    } else if (type === 'image') {
      newBlock.image_url = '';
      newBlock.caption_am = '';
      newBlock.caption_en = '';
    } else if (type === 'specimen_banner') {
      newBlock.previewText = 'Աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցուփքևօֆ';
      newBlock.size = 72;
    } else if (type === 'weights_comparison') {
      newBlock.title_am = 'Հաստության ցուցադրում';
      newBlock.title_en = 'Weights Comparison';
      newBlock.previewText = 'Հրանտ Հակոբյան Դիզայն 2026';
      newBlock.weights = [300, 400, 700];
    } else if (type === 'glyph_showcase') {
      newBlock.title_am = 'Գլիֆների ցուցադրում';
      newBlock.title_en = 'Key Glyphs Detail';
      newBlock.letters = 'Ա Բ Գ Դ';
    }
    setFontBlocks(prev => [...prev, newBlock]);
  };

  const updateFontBlock = (idx: number, updated: any) => {
    setFontBlocks(prev => prev.map((b, i) => i === idx ? updated : b));
  };

  const deleteFontBlock = (idx: number) => {
    setFontBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const moveFontBlock = (idx: number, dir: 'up' | 'down') => {
    setFontBlocks(prev => {
      const copy = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target >= 0 && target < copy.length) {
        const temp = copy[idx];
        copy[idx] = copy[target];
        copy[target] = temp;
      }
      return copy;
    });
  };

  const [showFontForm, setShowFontForm] = useState(false);
  const [editingFont, setEditingFont] = useState<Font | null>(null);
  const [fontForm, setFontForm] = useState<Partial<Font>>({
    id: '',
    name_am: '',
    name_en: '',
    category: 'Sans-Serif',
    creator: '',
    year: '',
    description_am: '',
    description_en: '',
    downloadable: true,
    paid: false,
    price: '',
    font_file_url: '',
    download_url: '',
    purchase_url: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // API Settings State
  const [apiSettings, setApiSettings] = useState({
    tildo_enabled: false,
    tildo_widget_id: '',
    google_analytics_enabled: false,
    google_analytics_id: '',
    custom_head_script: '',
    custom_footer_script: '',
    supabase_url: '',
    supabase_key: ''
  });

  // Dynamic Translations State
  const [dynamicTranslations, setDynamicTranslations] = useState<{
    hy: Record<string, Record<string, string>>;
    en: Record<string, Record<string, string>>;
  }>({ hy: {}, en: {} });

  // General Settings State
  const [upcomingMode, setUpcomingMode] = useState(false);
  const [upcomingTitleHy, setUpcomingTitleHy] = useState('Շուտով');
  const [upcomingTitleEn, setUpcomingTitleEn] = useState('Coming Soon');
  const [upcomingDescHy, setUpcomingDescHy] = useState('Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։');
  const [upcomingDescEn, setUpcomingDescEn] = useState('Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.');
  const [upcomingEmail, setUpcomingEmail] = useState('info@hdesign.am');
  const [upcomingTel, setUpcomingTel] = useState('+374 99 00 00 00');
  const [savingSettings, setSavingSettings] = useState(false);

  // Password Change Form State
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Transition States
  const [prevTab, setPrevTab] = useState<'analytics' | 'cases' | 'fonts' | 'messages' | 'translations' | 'apis' | 'personalization' | 'settings'>('analytics');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const tabIndices = useMemo(() => ({
    analytics: 0,
    cases: 1,
    fonts: 2,
    messages: 3,
    translations: 4,
    apis: 5,
    personalization: 6,
    settings: 7
  }), []);

  useEffect(() => {
    const prevIdx = tabIndices[prevTab];
    const currIdx = tabIndices[activeTab];

    if (prevIdx !== currIdx) {
      setSlideDirection(currIdx > prevIdx ? 'left' : 'right');
      setPrevTab(activeTab);
    }
  }, [activeTab, prevTab, tabIndices]);

  const getTabClass = (tabName: string) => {
    if (tabName !== activeTab) return '';
    if (!slideDirection) return 'tab-content-fade';
    return slideDirection === 'left' ? 'tab-content-slide-left' : 'tab-content-slide-right';
  };

  // API Lock States
  const [isApiUnlocked, setIsApiUnlocked] = useState(false);
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);
  const [unlockPasscode, setUnlockPasscode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('hdesign_api_unlocked') === 'true';
      setIsApiUnlocked(unlocked);
    }
  }, []);

  const handleEyeClick = () => {
    if (isApiUnlocked) {
      setIsApiUnlocked(false);
      sessionStorage.removeItem('hdesign_api_unlocked');
    } else {
      if (sessionStorage.getItem('hdesign_api_unlocked') === 'true') {
        setIsApiUnlocked(true);
      } else {
        setShowPasscodePrompt(true);
      }
    }
  };

  const handleVerifyUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: unlockPasscode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsApiUnlocked(true);
        sessionStorage.setItem('hdesign_api_unlocked', 'true');
        setShowPasscodePrompt(false);
        setUnlockPasscode('');
      } else {
        setUnlockError(data.error || 'Գաղտնաբառը սխալ է:');
      }
    } catch (err) {
      setUnlockError('Հաստատումը ձախողվեց:');
    }
  };

  // Translations form states
  const [editingTrans, setEditingTrans] = useState<Record<string, { hy: string; en: string }>>({});
  const [newTransSection, setNewTransSection] = useState('common');
  const [newTransCustomSection, setNewTransCustomSection] = useState('');
  const [newTransKey, setNewTransKey] = useState('');
  const [newTransHy, setNewTransHy] = useState('');
  const [newTransEn, setNewTransEn] = useState('');
  const [showAddTrans, setShowAddTrans] = useState(false);

  // Translations search/filter
  const [transSearch, setTransSearch] = useState('');
  const [transSectionFilter, setTransSectionFilter] = useState('all');
  const [visibleTransCount, setVisibleTransCount] = useState(50);

  // Cases Management
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [caseForm, setCaseForm] = useState<Partial<Case>>({
    id: '', title: '', subtitle: '', bg: 'linear-gradient(135deg, #ec407a 0%, #ab47bc 100%)',
    image_url: '', details: '', category: '', client: '', year: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Message View
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Try auto login on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('hdesign_admin_token');
      if (savedToken) {
        setToken(savedToken);
        setIsLoggedIn(true);
      }
      setLoadingAuth(false);
    }
  }, []);

  // Fetch data when logged in
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    async function fetchData() {
      setLoadingData(true);
      setDataError(null);
      try {
        const headers = { 'Authorization': token || '' };

        // 1. Fetch Cases
        const casesRes = await fetch('/api/cases', { headers });
        if (!casesRes.ok) throw new Error('Failed to fetch cases');
        const casesData = await casesRes.json();

        // 2. Fetch Messages
        const msgRes = await fetch('/api/contact', { headers });
        if (!msgRes.ok) throw new Error('Failed to fetch messages');
        const msgData = await msgRes.json();

        // 3. Fetch Visits/Analytics
        const visitsRes = await fetch('/api/analytics', { headers });
        if (!visitsRes.ok) throw new Error('Failed to fetch analytics');
        const visitsData = await visitsRes.json();

        // 4. Fetch API Settings
        const apiSettingsRes = await fetch('/api/api-settings', { headers });
        if (!apiSettingsRes.ok) throw new Error('Failed to fetch API settings');
        const apiSettingsData = await apiSettingsRes.json();

        // 5. Fetch Translations
        const translationsRes = await fetch('/api/translations', { headers });
        if (!translationsRes.ok) throw new Error('Failed to fetch translations');
        const translationsData = await translationsRes.json();

        // 6. Fetch Personalization Settings
        const personalizationRes = await fetch('/api/personalization', { headers });
        if (!personalizationRes.ok) throw new Error('Failed to fetch personalization settings');
        const personalizationData = await personalizationRes.json();

        // 7. Fetch General Settings
        const generalSettingsRes = await fetch('/api/general-settings', { headers });
        if (!generalSettingsRes.ok) throw new Error('Failed to fetch general settings');
        const generalSettingsData = await generalSettingsRes.json();

        // 8. Fetch Fonts
        const fontsRes = await fetch('/api/fonts', { headers });
        if (!fontsRes.ok) throw new Error('Failed to fetch fonts');
        const fontsData = await fontsRes.json();

        // Seed list with loaded values, filter out seed items from dynamic listing if desired
        setCases(casesData || []);
        setFonts(fontsData || []);
        setMessages(msgData || []);
        setVisits(visitsData || []);
        setApiSettings(apiSettingsData ? {
          ...apiSettingsData,
          tildo_widget_id: extractTidioWidgetId(apiSettingsData.tildo_widget_id || '')
        } : {
          tildo_enabled: false,
          tildo_widget_id: '',
          google_analytics_enabled: false,
          google_analytics_id: '',
          custom_head_script: '',
          custom_footer_script: '',
          supabase_url: '',
          supabase_key: ''
        });
        setDynamicTranslations(translationsData || { hy: {}, en: {} });
        setPersonalization(personalizationData || {
          site_title_hy: 'HDesign',
          site_title_en: 'HDesign',
          site_desc_hy: 'Դիզայնի և Բրենդավորման Ստուդիա',
          site_desc_en: 'Design & Branding Studio',
          theme_hue: '172',
          cursor_colors: DEFAULT_COLORS,
          cursors: DEFAULT_CURSORS
        });
        setUpcomingMode(generalSettingsData.upcoming_mode || false);
        setUpcomingTitleHy(generalSettingsData.upcoming_title_hy || 'Շուտով');
        setUpcomingTitleEn(generalSettingsData.upcoming_title_en || 'Coming Soon');
        setUpcomingDescHy(generalSettingsData.upcoming_desc_hy || 'Մեր կորպորատիվ կայքը ժամանակավորապես անցանց է ստեղծարար փոփոխությունների և նորացման պատճառով։ Շուտով կվերադառնանք նորացված տեսքով։');
        setUpcomingDescEn(generalSettingsData.upcoming_desc_en || 'Our website is temporarily offline for maintenance and creative updates. We will be back soon with a fresh experience.');
        setUpcomingEmail(generalSettingsData.upcoming_email || 'info@hdesign.am');
        setUpcomingTel(generalSettingsData.upcoming_tel || '+374 99 00 00 00');
      } catch (err: any) {
        setDataError(err.message || 'Տվյալների բեռնումը ձախողվեց:');
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [isLoggedIn, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('hdesign_admin_token', data.token);
        setToken(data.token);
        setIsLoggedIn(true);
        setPasscode('');
      } else {
        setAuthError(data.error || 'Գաղտնաբառը սխալ է:');
      }
    } catch (err: any) {
      setAuthError('Մուտքը ձախողվեց:');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hdesign_admin_token');
    setToken(null);
    setIsLoggedIn(false);
    setActiveTab('analytics');
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // CASES OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': token || '' },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCaseForm(prev => ({ ...prev, image_url: data.url }));
      } else {
        setUploadError(data.error || 'Ֆայլի վերբեռնումը ձախողվեց:');
      }
    } catch (err: any) {
      setUploadError('Կապի սխալ վերբեռնման ընթացքում:');
    } finally {
      setUploading(false);
    }
  };

  const openAddCase = () => {
    const newId = 'case-' + Math.random().toString(36).substring(2, 8);
    router.push(`/admin/editor/case/${newId}?new=true`);
  };

  const openCaseDrawer = (c: Case, type: 'case_preview' | 'case_edit') => {
    setDrawerCaseOriginal(c);
    setDrawerCaseId(c.id);
    setDrawerCaseTitle(c.title || '');
    setDrawerCaseSubtitle(c.subtitle || '');
    setDrawerCaseClient(c.client || '');
    setDrawerCaseYear(c.year || '');
    setDrawerCaseCategory(c.category || '');
    setDrawerCaseBg(c.bg || '');
    setDrawerCaseImageUrl(c.image_url || '');
    setDrawerType(type);
  };

  const handleSaveCaseDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !drawerCaseId || !drawerCaseTitle || !drawerCaseSubtitle) {
      alert('Լրացրեք բոլոր պարտադիր դաշտերը:');
      return;
    }

    try {
      const mergedCase = {
        ...drawerCaseOriginal,
        id: drawerCaseId,
        title: drawerCaseTitle,
        subtitle: drawerCaseSubtitle,
        client: drawerCaseClient,
        year: drawerCaseYear,
        category: drawerCaseCategory,
        bg: drawerCaseBg,
        image_url: drawerCaseImageUrl,
      };

      const res = await fetch(`/api/cases/${drawerCaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(mergedCase)
      });

      const data = await res.json();
      if (res.ok) {
        setCases(prev => prev.map(x => x.id === drawerCaseId ? data.case : x));
        alert('Քեյսը հաջողությամբ թարմացվեց:');
        setDrawerType(null);
      } else {
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել:');
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս քեյսը:')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });
      if (res.ok) {
        setCases(prev => prev.filter(x => x.id !== id));
        alert('Քեյսը հաջողությամբ ջնջվեց:');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err: any) {
      alert('Չհաջողվեց ջնջել քեյսը:');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // FONTS OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const [fontUploading, setFontUploading] = useState(false);
  const [fontUploadError, setFontUploadError] = useState<string | null>(null);

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setFontUploading(true);
    setFontUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': token || '' },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFontForm(prev => ({
          ...prev,
          font_file_url: data.url,
          download_url: prev.download_url || data.url
        }));
      } else {
        setFontUploadError(data.error || 'Տառատեսակի վերբեռնումը ձախողվեց:');
      }
    } catch (err: any) {
      setFontUploadError('Կապի սխալ վերբեռնման ընթացքում:');
    } finally {
      setFontUploading(false);
    }
  };

  const openAddFont = () => {
    const newId = 'font-' + Math.random().toString(36).substring(2, 8);
    router.push(`/admin/editor/font/${newId}?new=true`);
  };

  const openFontDrawer = (f: Font, type: 'font_preview' | 'font_edit') => {
    setDrawerFontOriginal(f);
    setDrawerFontId(f.id);
    setDrawerFontNameAm(f.name_am || '');
    setDrawerFontNameEn(f.name_en || '');
    setDrawerFontCategory(f.category || 'Sans-Serif');
    setDrawerFontCreator(f.creator || '');
    setDrawerFontYear(f.year || '');
    setDrawerFontPrice(f.price || '');
    setDrawerFontPurchaseUrl(f.purchase_url || '');
    setDrawerFontDownloadable(f.downloadable !== false);
    setDrawerFontPaid(!!f.paid);
    setDrawerFontFileUrl(f.font_file_url || '');
    setDrawerType(type);
  };

  const handleSaveFontDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !drawerFontId || !drawerFontNameAm || !drawerFontNameEn) {
      alert('Լրացրեք բոլոր պարտադիր դաշտերը:');
      return;
    }

    try {
      const mergedFont = {
        ...drawerFontOriginal,
        id: drawerFontId,
        name_am: drawerFontNameAm,
        name_en: drawerFontNameEn,
        category: drawerFontCategory,
        creator: drawerFontCreator,
        year: drawerFontYear,
        price: drawerFontPrice,
        purchase_url: drawerFontPurchaseUrl,
        downloadable: drawerFontDownloadable,
        paid: drawerFontPaid,
        font_file_url: drawerFontFileUrl
      };

      const res = await fetch(`/api/fonts/${drawerFontId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(mergedFont)
      });

      const data = await res.json();
      if (res.ok) {
        setFonts(prev => prev.map(x => x.id === drawerFontId ? data.font : x));
        alert('Տառատեսակը հաջողությամբ թարմացվեց:');
        setDrawerType(null);
      } else {
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել:');
    }
  };

  const handleDeleteFont = async (id: string) => {
    if (!confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս տառատեսակը:')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/fonts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });
      if (res.ok) {
        setFonts(prev => prev.filter(x => x.id !== id));
        alert('Տառատեսակը հաջողությամբ ջնջվեց:');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err: any) {
      alert('Չհաջողվեց ջնջել տառատեսակը:');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // MESSAGES OPERATIONS

  // ══════════════════════════════════════════════════════════════════════════════

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս նամակը:')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(x => x.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
        alert('Նամակը հաջողությամբ ջնջվեց:');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err: any) {
      alert('Չհաջողվեց ջնջել նամակը:');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // TRANSLATIONS & API SETTINGS OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const allTranslationsList = useMemo(() => {
    const list: { section: string; key: string; hy: string; en: string; isCustom: boolean }[] = [];
    const seen = new Set<string>();

    // 1. Add from dynamicTranslations
    const hyDyn = dynamicTranslations.hy || {};
    const enDyn = dynamicTranslations.en || {};

    for (const section in hyDyn) {
      for (const key in hyDyn[section]) {
        const uniqueKey = `${section}::${key}`;
        seen.add(uniqueKey);
        list.push({
          section,
          key,
          hy: hyDyn[section][key] || '',
          en: enDyn[section]?.[key] || '',
          isCustom: true
        });
      }
    }

    // 2. Add from default translations
    for (const section in hyTranslations) {
      for (const key in hyTranslations[section]) {
        const uniqueKey = `${section}::${key}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          list.push({
            section,
            key,
            hy: hyTranslations[section][key] || '',
            en: enTranslations[section]?.[key] || '',
            isCustom: false
          });
        }
      }
    }

    return list;
  }, [dynamicTranslations]);

  const filteredTranslations = useMemo(() => {
    return allTranslationsList.filter(item => {
      const matchesSection = transSectionFilter === 'all' || item.section === transSectionFilter;
      const matchesSearch = transSearch === '' || 
        item.key.toLowerCase().includes(transSearch.toLowerCase()) ||
        item.hy.toLowerCase().includes(transSearch.toLowerCase()) ||
        item.en.toLowerCase().includes(transSearch.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [allTranslationsList, transSectionFilter, transSearch]);

  const transSections = useMemo(() => {
    return Array.from(new Set(allTranslationsList.map(item => item.section)));
  }, [allTranslationsList]);

  const handleEditRow = (section: string, key: string, lang: 'hy' | 'en', value: string) => {
    const rowKey = `${section}::${key}`;
    const original = allTranslationsList.find(x => x.section === section && x.key === key);
    if (!original) return;

    setEditingTrans(prev => {
      const current = prev[rowKey] || { hy: original.hy, en: original.en };
      const updatedRow = { ...current, [lang]: value };
      return { ...prev, [rowKey]: updatedRow };
    });
  };

  const handleSaveTranslation = async (section: string, key: string, hyVal: string, enVal: string) => {
    if (!token) return;

    const updated = {
      hy: { ...dynamicTranslations.hy },
      en: { ...dynamicTranslations.en }
    };

    if (!updated.hy[section]) updated.hy[section] = {};
    if (!updated.en[section]) updated.en[section] = {};

    updated.hy[section][key] = hyVal;
    updated.en[section][key] = enVal;

    try {
      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setDynamicTranslations(updated);
        // Remove from editing state
        const rowKey = `${section}::${key}`;
        setEditingTrans(prev => {
          const next = { ...prev };
          delete next[rowKey];
          return next;
        });
        alert('Թարգմանությունը պահպանվեց։');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել թարգմանությունը։');
    }
  };

  const handleDeleteTranslation = async (section: string, key: string) => {
    if (!confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս թարգմանությունը։ (Եթե այն լռելյայն համակարգային թարգմանություն է, կվերականգնվի սկզբնական արժեքը)')) return;
    if (!token) return;

    const updated = {
      hy: { ...dynamicTranslations.hy },
      en: { ...dynamicTranslations.en }
    };

    if (updated.hy[section]) {
      delete updated.hy[section][key];
      if (Object.keys(updated.hy[section]).length === 0) {
        delete updated.hy[section];
      }
    }
    if (updated.en[section]) {
      delete updated.en[section][key];
      if (Object.keys(updated.en[section]).length === 0) {
        delete updated.en[section];
      }
    }

    try {
      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setDynamicTranslations(updated);
        // Clear edits
        const rowKey = `${section}::${key}`;
        setEditingTrans(prev => {
          const next = { ...prev };
          delete next[rowKey];
          return next;
        });
        alert('Թարգմանությունը ջնջվեց/վերականգնվեց։');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց ջնջել թարգմանությունը։');
    }
  };

  const handleCreateTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    const section = newTransSection === 'new' ? newTransCustomSection.trim() : newTransSection;
    const key = newTransKey.trim();
    const hyVal = newTransHy.trim();
    const enVal = newTransEn.trim();

    if (!section || !key || !hyVal || !enVal) {
      alert('Խնդրում ենք լրացնել բոլոր դաշտերը։');
      return;
    }

    await handleSaveTranslation(section, key, hyVal, enVal);
    
    // Clear form states
    setNewTransKey('');
    setNewTransHy('');
    setNewTransEn('');
    setNewTransCustomSection('');
    setShowAddTrans(false);
  };

  const handleSaveApiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const cleanedWidgetId = extractTidioWidgetId(apiSettings.tildo_widget_id);
    const cleanedSettings = {
      ...apiSettings,
      tildo_widget_id: cleanedWidgetId
    };
    setApiSettings(cleanedSettings);

    try {
      const res = await fetch('/api/api-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(cleanedSettings)
      });

      if (res.ok) {
        alert('API կարգավորումները հաջողությամբ պահպանվեցին։');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել API կարգավորումները։');
    }
  };

  const handleSavePersonalization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/personalization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(personalization)
      });

      if (res.ok) {
        alert('Անհատականացման կարգավորումները հաջողությամբ պահպանվեցին։');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել անհատականացման կարգավորումները։');
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSavingSettings(true);
    try {
      const res = await fetch('/api/general-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ 
          upcoming_mode: upcomingMode,
          upcoming_title_hy: upcomingTitleHy,
          upcoming_title_en: upcomingTitleEn,
          upcoming_desc_hy: upcomingDescHy,
          upcoming_desc_en: upcomingDescEn,
          upcoming_email: upcomingEmail,
          upcoming_tel: upcomingTel
        })
      });

      if (res.ok) {
        alert('Կայքի կարգավորումները հաջողությամբ պահպանվեցին։');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել կարգավորումները։');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPasscode || !newPasscode || !confirmPasscode) {
      setPasswordError('Խնդրում ենք լրացնել բոլոր դաշտերը։');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setPasswordError('Նոր գաղտնաբառերը չեն համընկնում։');
      return;
    }

    if (newPasscode.length < 4) {
      setPasswordError('Նոր գաղտնաբառը պետք է լինի առնվազն 4 նիշ։');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/general-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          current_passcode: currentPasscode,
          new_passcode: newPasscode
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess('Գաղտնաբառը հաջողությամբ փոխվեց։');
        
        // Sync local auth token so session doesn't expire
        if (data.newToken) {
          localStorage.setItem('hdesign_admin_token', data.newToken);
          setToken(data.newToken);
        }
        
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
      } else {
        setPasswordError(data.error || 'Գաղտնաբառի փոփոխումը ձախողվեց։');
      }
    } catch (err) {
      setPasswordError('Կապի սխալ։ Չհաջողվեց փոխել գաղտնաբառը։');
    } finally {
      setChangingPassword(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ANALYTICS CALCULATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const stats = useMemo(() => {
    if (!visits.length) return null;

    const visitsByDate: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const locations: Record<string, number> = {};
    
    let totalStayDuration = 0;
    const uniqueSessionIds = new Set<string>();

    for (const v of visits) {
      uniqueSessionIds.add(v.session_id);

      // Date string format for chart (visits count)
      const dateObj = new Date(v.created_at);
      const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      visitsByDate[dateStr] = (visitsByDate[dateStr] || 0) + 1;

      // Browser, OS, Device
      browsers[v.browser] = (browsers[v.browser] || 0) + 1;
      os[v.os] = (os[v.os] || 0) + 1;
      devices[v.device] = (devices[v.device] || 0) + 1;

      // Referrer
      const domain = v.referrer;
      referrers[domain] = (referrers[domain] || 0) + 1;

      // Geolocation Country, City
      const loc = v.country !== 'Unknown'
        ? (v.city !== 'Unknown' ? `${v.city}, ${v.country}` : v.country)
        : 'Անհայտ';
      locations[loc] = (locations[loc] || 0) + 1;

      // Stay duration
      const durationMs = new Date(v.updated_at).getTime() - new Date(v.created_at).getTime();
      const durationSec = Math.max(0, Math.floor(durationMs / 1000));
      totalStayDuration += durationSec;
    }

    // Calculations
    const totalSessions = uniqueSessionIds.size;
    const avgStayDurationSec = totalSessions > 0 ? Math.floor(totalStayDuration / totalSessions) : 0;
    const minutes = Math.floor(avgStayDurationSec / 60);
    const seconds = avgStayDurationSec % 60;
    const avgStayStr = minutes > 0 ? `${minutes}ր ${seconds}վ` : `${seconds}վ`;

    // Recharts formats
    const visitsChartData = Object.entries(visitsByDate)
      .map(([date, count]) => ({ date, count }))
      .reverse(); // Chronological order

    const browserChartData = Object.entries(browsers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const osChartData = Object.entries(os)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const deviceChartData = Object.entries(devices)
      .map(([name, value]) => ({ name, value }));

    const topReferrers = Object.entries(referrers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topLocations = Object.entries(locations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalViews: visits.length,
      uniqueVisitors: totalSessions,
      avgStayStr,
      visitsChartData,
      browserChartData,
      osChartData,
      deviceChartData,
      topReferrers,
      topLocations
    };
  }, [visits]);

  // Loading indicator for login verify
  if (loadingAuth) {
    return (
      <div style={{ background: '#083f39', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'HDesign, sans-serif' }}>
        <h3>Ստուգվում է լիազորումը...</h3>
      </div>
    );
  }

  // Passcode entry form
  if (!isLoggedIn) {
    return (
      <main style={{ 
        background: 'linear-gradient(135deg, #083f39 0%, #031c19 100%)', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'HDesign, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '50px', marginBottom: '12px', objectFit: 'contain' }} />
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>HDesign Ադմին</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', marginTop: '6px' }}>Մուտք գործելու համար ներմուծեք գաղտնաբառը</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <hd-input 
              type="password"
              placeholder="Մուտքագրեք գաղտնաբառը..."
              value={passcode}
              onInput={(e: any) => setPasscode(e.target.value)}
              data-width="100%"
              data-height="46px"
              data-thickness="1px"
            />

            {authError && (
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#ff6b6b', 
                background: 'rgba(255, 107, 107, 0.1)', 
                padding: '8px 12px', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 107, 107, 0.2)' 
              }}>
                {authError}
              </div>
            )}

            <hd-button 
              type="submit"
              data-width="100%" 
              data-height="46px"
              data-thickness="2px"
            >
              Մուտք
            </hd-button>
          </form>
        </div>
      </main>
    );
  }

  // Dashboard UI View
  return (
    <main style={{ 
      background: 'var(--bg)', 
      color: 'var(--text)', 
      minHeight: '100vh',
      fontFamily: 'HDesign, sans-serif',
      paddingBottom: '120px'
    }}>
      <style>{`
        .nav-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(0px);
          background: rgba(8, 63, 57, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #fff;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: none;
          z-index: 10000;
        }
        .nav-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(8, 63, 57, 0.95);
        }
        .nav-btn:hover .nav-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-10px);
        }
        .tab-content-slide-left {
          animation: slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tab-content-slide-right {
          animation: slideInFromLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .tab-content-fade {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInFromRight {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromLeft {
          0% { transform: translateX(-30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 768px) {
          .admin-header {
            padding: 12px 16px !important;
          }
          .admin-header h1 {
            font-size: 1rem !important;
          }
          .admin-header span {
            display: none !important;
          }
          .admin-main-container {
            padding: 0 16px !important;
            margin: 20px auto 0 !important;
          }
          .case-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .personalization-form-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .hotspot-edit-layout {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            justify-items: center;
          }
          .admin-modal-container {
            padding: 20px !important;
            border-radius: 16px !important;
            max-height: 95vh !important;
          }
        }
        @media (max-width: 480px) {
          .admin-floating-nav {
            width: calc(100% - 24px) !important;
            height: 60px !important;
            bottom: 12px !important;
            gap: 6px !important;
            padding: 0 6px !important;
          }
          .admin-floating-nav .nav-btn {
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
          }
          .admin-floating-nav .nav-btn span {
            font-size: 1.1rem !important;
          }
          .admin-modal-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .admin-modal-actions > * {
            width: 100% !important;
          }
        }
      `}</style>
      {/* Top Navbar Header */}
      <header className="admin-header" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: 'var(--panel)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--panel-border)', 
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '36px', borderRadius: '6px' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>HDesign Ադմին</h1>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Կառավարման Համակարգ</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <hd-button 
              data-color="rgba(255,255,255,0.06)" 
              data-width="120px" 
              data-height="36px"
              data-font-size="0.82rem"
            >
              Դեպի Կայք
            </hd-button>
          </Link>

          <hd-button 
            onClick={handleLogout}
            data-color="#ff6b6b" 
            data-width="110px" 
            data-height="36px"
            data-font-size="0.82rem"
          >
            Դուրս գալ
          </hd-button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="admin-main-container" style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 40px' }}>
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <h3>Բեռնվում է...</h3>
          </div>
        ) : dataError ? (
          <div style={{ padding: '24px', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', color: '#ff6b6b', borderRadius: '16px' }}>
            {dataError}
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 1: ANALYTICS
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
              <div className={getTabClass('analytics')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Ընդհանուր Դիտումներ</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.totalViews || 0}</div>
                  </div>
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Միջին Stay տևողություն</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00C49F' }}>{stats?.avgStayStr || '0վ'}</div>
                  </div>
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Սեանսներ / Unique Visitors</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats?.uniqueVisitors || 0}</div>
                  </div>
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Ստացված Նամակներ</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#FFBB28' }}>{messages.length}</div>
                  </div>
                </div>

                {/* Main Graph (Visits Over Time) */}
                {stats && stats.visitsChartData.length > 0 && (
                  <section style={{ background: 'var(--panel)', padding: '30px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 600 }}>Այցելություններն ըստ օրերի</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      <ResponsiveContainer>
                        <LineChart data={stats.visitsChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--muted)" tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                          <Line type="monotone" dataKey="count" name="Այցելություններ" stroke="#00C49F" strokeWidth={3} dot={{ r: 4, fill: '#00C49F' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* Subcharts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {/* Traffic Sources */}
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', maxHeight: '380px', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Տրաֆիկի Աղբյուրներ (Referrers)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats?.topReferrers.map((ref, idx) => (
                        <div key={ref.name} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                            {idx + 1}. {ref.name}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{ref.value} այցելու</span>
                        </div>
                      ))}
                      {(!stats?.topReferrers || stats.topReferrers.length === 0) && (
                        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>Տվյալներ չկան</div>
                      )}
                    </div>
                  </div>

                  {/* Geolocation countries/cities */}
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', maxHeight: '380px', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Տեղագրություն (Աշխարհագրություն)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats?.topLocations.map((loc, idx) => (
                        <div key={loc.name} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                            {idx + 1}. {loc.name}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{loc.value} դիտում</span>
                        </div>
                      ))}
                      {(!stats?.topLocations || stats.topLocations.length === 0) && (
                        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>Տվյալներ չկան</div>
                      )}
                    </div>
                  </div>

                  {/* Browsers Pie Chart */}
                  {stats && stats.browserChartData.length > 0 && (
                    <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>Օգտագործվող Բրաուզերներ</h3>
                      <div style={{ height: '220px' }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={stats.browserChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                              {stats.browserChartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ background: '#111', border: 'none', color: '#fff' }} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Session Logs */}
                <div style={{ background: 'var(--panel)', padding: '30px', borderRadius: '16px', border: '1px solid var(--panel-border)', overflowX: 'auto' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 600 }}>Վերջին Այցելությունները</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--muted)' }}>
                        <th style={{ padding: '12px' }}>Ամսաթիվ</th>
                        <th style={{ padding: '12px' }}>Սարք</th>
                        <th style={{ padding: '12px' }}>ՕՀ / Բրաուզեր</th>
                        <th style={{ padding: '12px' }}>Տեղանք</th>
                        <th style={{ padding: '12px' }}>Աղբյուր</th>
                        <th style={{ padding: '12px' }}>Տևողություն</th>
                        <th style={{ padding: '12px' }}>IP հասցե</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.slice(0, 30).map(visit => {
                        const durationMs = new Date(visit.updated_at).getTime() - new Date(visit.created_at).getTime();
                        const durationSec = Math.max(0, Math.floor(durationMs / 1000));
                        const minutes = Math.floor(durationSec / 60);
                        const seconds = durationSec % 60;
                        const durationStr = minutes > 0 ? `${minutes}ր ${seconds}վ` : `${seconds}վ`;

                        return (
                          <tr key={visit.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(visit.created_at).toLocaleString()}</td>
                            <td style={{ padding: '12px', textTransform: 'capitalize' }}>{visit.device}</td>
                            <td style={{ padding: '12px' }}>{visit.os} • {visit.browser}</td>
                            <td style={{ padding: '12px' }}>{visit.country !== 'Unknown' ? `${visit.city} (${visit.country})` : 'Անհայտ'}</td>
                            <td style={{ padding: '12px', color: '#00C49F' }}>{visit.referrer}</td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>{durationStr}</td>
                            <td style={{ padding: '12px', opacity: 0.7 }}>{visit.ip_address}</td>
                          </tr>
                        );
                      })}
                      {visits.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)' }}>Այցելություններ դեռևս չեն գրանցվել</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 2: CASES MANAGEMENT
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'cases' && (
              <div className={getTabClass('cases')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                    {casesSubTab === 'fonts' ? 'Աշխատանքներ / Տառատեսակներ' : 'Աշխատանքներ / Քեյսեր'}
                  </h2>
                  <hd-button 
                    onClick={casesSubTab === 'fonts' ? openAddFont : openAddCase}
                    data-width={casesSubTab === 'fonts' ? "200px" : "180px"} 
                    data-height="42px"
                    data-thickness="2px"
                  >
                    {casesSubTab === 'fonts' ? 'Ավելացնել Տառատեսակ' : 'Ավելացնել Քեյս'}
                  </hd-button>
                </div>

                {/* Sub-tabs for Branding vs Gallery vs Fonts */}
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                  <button
                    onClick={() => setCasesSubTab('branding')}
                    style={{
                      background: casesSubTab === 'branding' ? 'var(--switcher-capsule-bg)' : 'transparent',
                      color: casesSubTab === 'branding' ? '#fff' : 'var(--muted)',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Բրենդինգի Քեյսեր
                  </button>
                  <button
                    onClick={() => setCasesSubTab('gallery')}
                    style={{
                      background: casesSubTab === 'gallery' ? 'var(--switcher-capsule-bg)' : 'transparent',
                      color: casesSubTab === 'gallery' ? '#fff' : 'var(--muted)',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Պատկերասրահ
                  </button>
                  <button
                    onClick={() => setCasesSubTab('fonts')}
                    style={{
                      background: casesSubTab === 'fonts' ? 'var(--switcher-capsule-bg)' : 'transparent',
                      color: casesSubTab === 'fonts' ? '#fff' : 'var(--muted)',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    Տառատեսակներ
                  </button>
                </div>

                {casesSubTab !== 'fonts' ? (
                  <>
                    {/* Sorting and View Switcher bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-border)', padding: '10px 16px', borderRadius: '12px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Դասավորել ըստ՝</span>
                        <select 
                          value={casesSortBy} 
                          onChange={(e: any) => setCasesSortBy(e.target.value)}
                          style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', outline: 'none', fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          <option value="newest">Նորագույն</option>
                          <option value="title">Անուն (A-Z)</option>
                          <option value="year">Տարեթիվ</option>
                          <option value="category">Կատեգորիա</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => setCasesViewMode('grid')}
                          style={{
                            background: casesViewMode === 'grid' ? 'var(--switcher-capsule-bg)' : 'transparent',
                            border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: casesViewMode === 'grid' ? 'bold' : 'normal'
                          }}
                        >
                          Grid
                        </button>
                        <button 
                          onClick={() => setCasesViewMode('list')}
                          style={{
                            background: casesViewMode === 'list' ? 'var(--switcher-capsule-bg)' : 'transparent',
                            border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: casesViewMode === 'list' ? 'bold' : 'normal'
                          }}
                        >
                          List
                        </button>
                      </div>
                    </div>

                    {/* Main Split Layout: Cards Left, Quick Panel Right */}
                    <div style={{ display: 'grid', gridTemplateColumns: drawerType && drawerType.startsWith('case_') ? '1fr 400px' : '1fr', gap: '30px', alignItems: 'start' }}>
                      
                      {/* Left Column: Cards List */}
                      <div style={{ display: 'grid', gridTemplateColumns: casesViewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', gap: '20px' }}>
                        {filteredCasesForAdmin.map(c => {
                          return (
                            <div 
                              key={c.id} 
                              style={{ 
                                background: 'var(--panel)', 
                                border: '1px solid var(--panel-border)', 
                                borderRadius: '16px', 
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: casesViewMode === 'grid' ? 'column' : 'row',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                alignItems: casesViewMode === 'grid' ? 'stretch' : 'center'
                              }}
                            >
                              {/* Case Card Preview */}
                              <div style={{ 
                                background: c.bg, 
                                height: casesViewMode === 'grid' ? '160px' : '90px', 
                                width: casesViewMode === 'grid' ? '100%' : '140px',
                                flexShrink: 0,
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                position: 'relative' 
                              }}>
                                {c.image_url ? (
                                   <img src={c.image_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.3)', padding: '6px 12px', borderRadius: '4px' }}>
                                    Default SVG
                                  </span>
                                )}
                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', color: '#fff' }}>
                                  {c.category || 'Portfolio'}
                                </div>
                              </div>

                              {/* Case Content */}
                              <div style={{ 
                                padding: '16px', 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: casesViewMode === 'grid' ? 'column' : 'row', 
                                alignItems: casesViewMode === 'grid' ? 'stretch' : 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                width: '100%'
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0' }}>{c.title}</h3>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{c.subtitle}</span>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    {c.client && <span><strong>Հաճախորդ՝</strong> {c.client}</span>}
                                    {c.year && <span><strong>Տարի՝</strong> {c.year}</span>}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: casesViewMode === 'grid' ? '12px' : '0' }}>
                                  <a href={`/admin/editor/case/${c.id}`} style={{ textDecoration: 'none' }}>
                                    <hd-button 
                                      data-color="var(--accent)"
                                      data-width="120px"
                                      data-height="30px"
                                      data-font-size="0.7rem"
                                    >
                                      ✏ WYSIWYG
                                    </hd-button>
                                  </a>
                                  <hd-button 
                                    onClick={() => openCaseDrawer(c, 'case_preview')}
                                    data-color="#2196f3" 
                                    data-width="110px" 
                                    data-height="30px"
                                    data-font-size="0.7rem"
                                  >
                                    👁 Դիտում
                                  </hd-button>
                                  <hd-button 
                                    onClick={() => openCaseDrawer(c, 'case_edit')}
                                    data-color="#FFBB28" 
                                    data-width="130px" 
                                    data-height="30px"
                                    data-font-size="0.7rem"
                                  >
                                    ⚙ Խմբագրել
                                  </hd-button>
                                  <hd-button 
                                    onClick={() => handleDeleteCase(c.id)}
                                    data-color="#ff6b6b" 
                                    data-width="90px" 
                                    data-height="30px"
                                    data-font-size="0.7rem"
                                  >
                                    ✕ Ջնջել
                                  </hd-button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {filteredCasesForAdmin.length === 0 && (
                          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--muted)', border: '1px dashed var(--panel-border)', borderRadius: '16px' }}>
                            Քեյսեր գոյություն չունեն
                          </div>
                        )}
                      </div>

                      {/* Right Column: Sticky Quick Sidebar */}
                      {drawerType && drawerType.startsWith('case_') && drawerCaseOriginal && (
                        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: '24px', padding: '24px', position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                              {drawerType === 'case_preview' ? '👁 Արագ Դիտում' : '⚙ Արագ Խմբագրում'}
                            </h4>
                            <button onClick={() => setDrawerType(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                          </div>

                          {drawerType === 'case_preview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {drawerCaseImageUrl && (
                                <div style={{ borderRadius: '12px', overflow: 'hidden', height: '150px', border: '1px solid var(--panel-border)' }}>
                                  <img src={drawerCaseImageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Վերնագիր</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{drawerCaseTitle}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Ենթավերնագիր</span>
                                <div style={{ fontSize: '0.88rem', color: '#ccc', marginTop: '2px' }}>{drawerCaseSubtitle}</div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Հաճախորդ</span>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{drawerCaseClient || 'N/A'}</div>
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Տարեթիվ</span>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{drawerCaseYear || 'N/A'}</div>
                                </div>
                              </div>
                              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '8px' }}>
                                <a href={`/admin/editor/case/${drawerCaseId}`} style={{ textDecoration: 'none' }}>
                                  <hd-button data-width="100%" data-height="36px" data-thickness="1px">✏ Բացել WYSIWYG խմբագրիչը</hd-button>
                                </a>
                              </div>
                            </div>
                          )}

                          {drawerType === 'case_edit' && (
                            <form onSubmit={handleSaveCaseDrawer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Վերնագիր*</label>
                                <hd-input value={drawerCaseTitle} onInput={(e: any) => setDrawerCaseTitle(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ենթավերնագիր*</label>
                                <hd-input value={drawerCaseSubtitle} onInput={(e: any) => setDrawerCaseSubtitle(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Հաճախորդ</label>
                                <hd-input value={drawerCaseClient} onInput={(e: any) => setDrawerCaseClient(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Տարի</label>
                                  <hd-input value={drawerCaseYear} onInput={(e: any) => setDrawerCaseYear(e.target.value)} data-width="100%" data-height="36px" />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Կատեգորիա</label>
                                  <hd-input value={drawerCaseCategory} onInput={(e: any) => setDrawerCaseCategory(e.target.value)} data-width="100%" data-height="36px" />
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ֆոնի CSS</label>
                                <hd-input value={drawerCaseBg} onInput={(e: any) => setDrawerCaseBg(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Cover URL</label>
                                <hd-input value={drawerCaseImageUrl} onInput={(e: any) => setDrawerCaseImageUrl(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div style={{ marginTop: '10px' }}>
                                <hd-button type="submit" data-width="100%" data-height="38px" data-thickness="2px">💾 Պահպանել</hd-button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}

                    </div>
                  </>
                ) : (
                  <>
                    {/* Sorting and View Switcher bar for Fonts */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-border)', padding: '10px 16px', borderRadius: '12px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Դասավորել ըստ՝</span>
                        <select 
                          value={fontsSortBy} 
                          onChange={(e: any) => setFontsSortBy(e.target.value)}
                          style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', outline: 'none', fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          <option value="name">Անուն (A-Z)</option>
                          <option value="year">Տարեթիվ</option>
                          <option value="category">Կատեգորիա</option>
                          <option value="price">Գին</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => setFontsViewMode('grid')}
                          style={{
                            background: fontsViewMode === 'grid' ? 'var(--switcher-capsule-bg)' : 'transparent',
                            border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: fontsViewMode === 'grid' ? 'bold' : 'normal'
                          }}
                        >
                          Grid
                        </button>
                        <button 
                          onClick={() => setFontsViewMode('list')}
                          style={{
                            background: fontsViewMode === 'list' ? 'var(--switcher-capsule-bg)' : 'transparent',
                            border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: fontsViewMode === 'list' ? 'bold' : 'normal'
                          }}
                        >
                          List
                        </button>
                      </div>
                    </div>

                    {/* Main Split Layout: Cards Left, Quick Panel Right for Fonts */}
                    <div style={{ display: 'grid', gridTemplateColumns: drawerType && drawerType.startsWith('font_') ? '1fr 400px' : '1fr', gap: '30px', alignItems: 'start' }}>
                      
                      {/* Left Column: Fonts List */}
                      <div style={{ display: 'grid', gridTemplateColumns: fontsViewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '20px' }}>
                        {sortedFonts.map(f => {
                          return (
                            <div 
                              key={f.id} 
                              style={{ 
                                background: 'var(--panel)', 
                                border: '1px solid var(--panel-border)', 
                                borderRadius: '16px', 
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: fontsViewMode === 'grid' ? 'column' : 'row',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                alignItems: fontsViewMode === 'grid' ? 'stretch' : 'center'
                              }}
                            >
                              {/* Font Card Preview */}
                              <div style={{ 
                                background: 'rgba(0,0,0,0.15)', 
                                padding: fontsViewMode === 'grid' ? '24px' : '16px', 
                                height: fontsViewMode === 'grid' ? 'auto' : '90px',
                                width: fontsViewMode === 'grid' ? 'auto' : '180px',
                                flexShrink: 0,
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                position: 'relative', 
                                borderBottom: fontsViewMode === 'grid' ? '1px solid var(--panel-border)' : 'none',
                                borderRight: fontsViewMode === 'grid' ? 'none' : '1px solid var(--panel-border)'
                              }}>
                                <style dangerouslySetInnerHTML={{ __html: `
                                  @font-face {
                                    font-family: 'admin-preview-${f.id}';
                                    src: url('${f.font_file_url}') format('${f.font_file_url.endsWith('.otf') ? 'opentype' : f.font_file_url.endsWith('.woff') ? 'woff' : f.font_file_url.endsWith('.woff2') ? 'woff2' : 'truetype'}');
                                    font-weight: normal;
                                    font-style: normal;
                                  }
                                `}} />
                                
                                <div style={{ 
                                  fontFamily: `admin-preview-${f.id}, sans-serif`, 
                                  fontSize: fontsViewMode === 'grid' ? '1.8rem' : '1.4rem', 
                                  color: 'var(--text)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  textAlign: 'center',
                                  margin: '8px 0'
                                }}>
                                  {f.name_en}
                                </div>
                                
                                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: '#fff' }}>
                                  {f.category}
                                </div>
                              </div>

                              {/* Font Content */}
                              <div style={{ 
                                padding: '16px', 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: fontsViewMode === 'grid' ? 'column' : 'row', 
                                alignItems: fontsViewMode === 'grid' ? 'stretch' : 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                width: '100%'
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0' }}>
                                    {f.name_am} <span style={{ opacity: 0.5, fontSize: '0.85rem', fontWeight: 'normal' }}>({f.name_en})</span>
                                  </h3>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: '1', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {f.description_am || f.description_en}
                                  </span>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    {f.creator && <span><strong>Հեղինակ՝</strong> {f.creator}</span>}
                                    {f.year && <span><strong>Տարեթիվ՝</strong> {f.year}</span>}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: fontsViewMode === 'grid' ? '12px' : '0' }}>
                                  <a href={`/admin/editor/font/${f.id}`} style={{ textDecoration: 'none' }}>
                                    <hd-button 
                                      data-color="var(--accent)"
                                      data-width="120px"
                                      data-height="30px"
                                      data-font-size="0.7rem"
                                    >
                                      ✏ WYSIWYG
                                    </hd-button>
                                  </a>
                                  <hd-button 
                                    onClick={() => openFontDrawer(f, 'font_preview')}
                                    data-color="#2196f3" 
                                    data-width="110px" 
                                    data-height="30px"
                                    data-font-size="0.7rem"
                                  >
                                    👁 Դիտում
                                  </hd-button>
                                  <hd-button 
                                    onClick={() => openFontDrawer(f, 'font_edit')}
                                    data-color="#FFBB28" 
                                    data-width="130px" 
                                    data-height="30px"
                                    data-font-size="0.7rem"
                                  >
                                    ⚙ Խմբագրել
                                  </hd-button>
                                  <hd-button 
                                    onClick={() => handleDeleteFont(f.id)}
                                    data-color="#ff6b6b" 
                                    data-width="90px" 
                                    data-height="30px"
                                    data-font-size="0.7rem"
                                  >
                                    ✕ Ջնջել
                                  </hd-button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Column: Sticky Quick Sidebar for Fonts */}
                      {drawerType && drawerType.startsWith('font_') && drawerFontOriginal && (
                        <div style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: '24px', padding: '24px', position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                          <style dangerouslySetInnerHTML={{ __html: `
                            @font-face {
                              font-family: 'drawer-preview-${drawerFontId}';
                              src: url('${drawerFontFileUrl}') format('truetype');
                              font-weight: normal;
                              font-style: normal;
                            }
                          ` }} />
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                              {drawerType === 'font_preview' ? '👁 Արագ Դիտում' : '⚙ Արագ Խմբագրում'}
                            </h4>
                            <button onClick={() => setDrawerType(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                          </div>

                          {drawerType === 'font_preview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Դասակարգում</span>
                                <div style={{ fontSize: '0.88rem', color: '#fff', marginTop: '2px' }}>{drawerFontCategory} • {drawerFontCreator}</div>
                              </div>

                              {/* Live Sandbox */}
                              <div style={{ background: '#0a0a0c', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '16px' }}>
                                <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Փորձարկման Դաշտ (Live Sandbox)</label>
                                <textarea 
                                  value={drawerFontSandboxText}
                                  onChange={e => setDrawerFontSandboxText(e.target.value)}
                                  style={{
                                    width: '100%', minHeight: '60px', background: 'transparent', border: 'none', outline: 'none',
                                    color: '#fff', fontFamily: `drawer-preview-${drawerFontId}, sans-serif`,
                                    fontSize: `${drawerFontSize}px`, resize: 'vertical'
                                  }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '8px' }}>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>Տառաչափս՝ {drawerFontSize}px</span>
                                  <input 
                                    type="range" min="14" max="72" value={drawerFontSize}
                                    onChange={e => setDrawerFontSize(Number(e.target.value))}
                                    style={{ width: '100px', accentColor: 'var(--accent)' }}
                                  />
                                </div>
                              </div>

                              {/* Waterfall */}
                              <div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Waterfall Test</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: `drawer-preview-${drawerFontId}, sans-serif` }}>
                                  <div style={{ fontSize: '12px', opacity: 0.6 }}>12px: Quick brown fox jumps over.</div>
                                  <div style={{ fontSize: '18px', opacity: 0.8 }}>18px: Quick brown fox jumps.</div>
                                  <div style={{ fontSize: '24px' }}>24px: Quick brown fox.</div>
                                </div>
                              </div>

                              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '8px' }}>
                                <a href={`/admin/editor/font/${drawerFontId}`} style={{ textDecoration: 'none' }}>
                                  <hd-button data-width="100%" data-height="36px" data-thickness="1px">✏ Բացել WYSIWYG խմբագրիչը</hd-button>
                                </a>
                              </div>
                            </div>
                          )}

                          {drawerType === 'font_edit' && (
                            <form onSubmit={handleSaveFontDrawer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Անուն (Հայերեն)*</label>
                                <hd-input value={drawerFontNameAm} onInput={(e: any) => setDrawerFontNameAm(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Name (English)*</label>
                                <hd-input value={drawerFontNameEn} onInput={(e: any) => setDrawerFontNameEn(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                                <div>
                                  <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Կատեգորիա</label>
                                  <select 
                                    value={drawerFontCategory}
                                    onChange={e => setDrawerFontCategory(e.target.value)}
                                    style={{ width: '100%', height: '36px', background: 'var(--panel-border)', border: '1px solid var(--panel-border)', borderRadius: '12px', color: '#fff', padding: '0 8px', outline: 'none' }}
                                  >
                                    <option value="Sans-Serif">Sans-Serif</option>
                                    <option value="Serif">Serif</option>
                                    <option value="Display">Display</option>
                                    <option value="Monospace">Monospace</option>
                                    <option value="Variable">Variable</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Տարեթիվ</label>
                                  <hd-input value={drawerFontYear} onInput={(e: any) => setDrawerFontYear(e.target.value)} data-width="100%" data-height="36px" />
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Հեղինակ</label>
                                <hd-input value={drawerFontCreator} onInput={(e: any) => setDrawerFontCreator(e.target.value)} data-width="100%" data-height="36px" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ֆայլի հղում</label>
                                <hd-input value={drawerFontFileUrl} onInput={(e: any) => setDrawerFontFileUrl(e.target.value)} data-width="100%" data-height="36px" />
                              </div>

                              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" checked={drawerFontDownloadable}
                                    onChange={e => setDrawerFontDownloadable(e.target.checked)}
                                    style={{ accentColor: 'var(--accent)' }}
                                  />
                                  Անվճար ներբեռնելի (Downloadable)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" checked={drawerFontPaid}
                                    onChange={e => setDrawerFontPaid(e.target.checked)}
                                    style={{ accentColor: 'var(--accent)' }}
                                  />
                                  Վճարովի (Commercial)
                                </label>
                              </div>

                              {drawerFontPaid && (
                                <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '10px' }}>
                                  <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Գին</label>
                                    <hd-input value={drawerFontPrice} onInput={(e: any) => setDrawerFontPrice(e.target.value)} data-width="100%" data-height="36px" />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Գնման հղում</label>
                                    <hd-input value={drawerFontPurchaseUrl} onInput={(e: any) => setDrawerFontPurchaseUrl(e.target.value)} data-width="100%" data-height="36px" />
                                  </div>
                                </div>
                              )}

                              <div style={{ marginTop: '10px' }}>
                                <hd-button type="submit" data-width="100%" data-height="38px" data-thickness="2px">💾 Պահպանել</hd-button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Case modal markup fully cleaned up */}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 3: MESSAGES INBOX
                ══════════════════════════════════════════════════════════════════════════ */}

            {activeTab === 'messages' && (
              <div className={getTabClass('messages')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Հետադարձ Կապի Նամակներ</h2>

                {/* Messages Listing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {messages.map(msg => (
                    <div 
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      style={{
                        background: 'var(--panel)',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '16px',
                        padding: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '20px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{msg.name}</span>
                          <span style={{ fontSize: '0.85rem', color: '#00C49F', textDecoration: 'underline' }}>{msg.email}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          color: 'var(--text)', 
                          opacity: 0.8,
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {msg.message}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                        <a 
                          href={`mailto:${msg.email}`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                            background: 'rgba(0,196,159,0.1)', border: '1px solid rgba(0,196,159,0.2)', borderRadius: '10px',
                            color: '#00C49F', width: '38px', height: '38px', fontSize: '1rem', transition: 'background 0.2s'
                          }}
                          title="Պատասխանել էլ. փոստով"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,196,159,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,196,159,0.1)'}
                        >
                          <span className="icon-Mail" />
                        </a>
                        <div
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px',
                            color: '#ff6b6b', width: '38px', height: '38px', fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          title="Ջնջել նամակը"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                        >
                          <span className="icon-Trash" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', border: '1px dashed var(--panel-border)', borderRadius: '16px' }}>
                      Նամակների արկղը դատարկ է
                    </div>
                  )}
                </div>

                {/* Message detail modal viewer */}
                {selectedMessage && (
                  <div 
                    onClick={() => setSelectedMessage(null)}
                    style={{
                      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                  >
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="admin-modal-container"
                      style={{
                        background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: '24px',
                        width: '100%', maxWidth: '600px', padding: '36px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px' }}>{selectedMessage.name}</h3>
                          <span style={{ fontSize: '0.85rem', color: '#00C49F' }}>{selectedMessage.email}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {new Date(selectedMessage.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ 
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
                        padding: '20px', color: '#fff', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', maxHeight: '350px', overflowY: 'auto'
                      }}>
                        {selectedMessage.message}
                      </div>

                      <div className="admin-modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <hd-button 
                          onClick={() => setSelectedMessage(null)}
                          data-color="rgba(255,255,255,0.1)"
                          data-width="100px"
                          data-height="40px"
                        >
                          Փակել
                        </hd-button>
                        <a 
                          href={`mailto:${selectedMessage.email}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <hd-button 
                            data-width="150px"
                            data-height="40px"
                            data-thickness="2px"
                          >
                            Պատասխանել
                          </hd-button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 4: TRANSLATIONS
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'translations' && (
              <div className={getTabClass('translations')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Թարգմանությունների Կառավարում</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>Խմբագրեք կամ ավելացրեք նոր տեքստային թարգմանություններ կայքի և ադմին դաշբորդի համար</p>
                  </div>
                  <hd-button 
                    onClick={() => setShowAddTrans(true)}
                    data-width="220px" 
                    data-height="42px"
                    data-thickness="2px"
                  >
                    Ավելացնել Թարգմանություն
                  </hd-button>
                </div>

                {/* Filter and Search Bar */}
                <div style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Որոնում</label>
                    <hd-input 
                      placeholder="Որոնել ըստ բանալու կամ արժեքի..."
                      value={transSearch}
                      onInput={(e: any) => { setTransSearch(e.target.value); setVisibleTransCount(50); }}
                      data-width="100%"
                      data-height="40px"
                    />
                  </div>

                  <div style={{ width: '200px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Բաժին</label>
                    <hd-select
                      value={transSectionFilter}
                      onChange={(e: any) => { setTransSectionFilter(e.target.value); setVisibleTransCount(50); }}
                      data-width="100%"
                      data-height="40px"
                    >
                      <span value="all" {...(transSectionFilter === 'all' ? {selected: true} : {})}>Բոլոր Բաժինները</span>
                      {transSections.map(sec => (
                        <span key={sec} value={sec} {...(transSectionFilter === sec ? {selected: true} : {})}>{sec}</span>
                      ))}
                    </hd-select>
                  </div>
                </div>

                {/* Translations Grid/List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredTranslations.slice(0, visibleTransCount).map(item => {
                    const rowKey = `${item.section}::${item.key}`;
                    const hasLocalEdits = editingTrans[rowKey] !== undefined && (
                      editingTrans[rowKey].hy !== item.hy || editingTrans[rowKey].en !== item.en
                    );
                    return (
                      <div 
                        key={rowKey}
                        style={{
                          background: 'var(--panel)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '16px',
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              background: 'rgba(0,196,159,0.08)', 
                              border: '1px solid rgba(0,196,159,0.15)', 
                              color: '#00C49F',
                              padding: '4px 10px', 
                              borderRadius: '8px', 
                              fontSize: '0.75rem', 
                              fontWeight: 700 
                            }}>
                              [{item.section}]
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>
                              {item.key}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.isCustom ? (
                              <span style={{ 
                                fontSize: '0.72rem', 
                                background: 'rgba(255, 187, 40, 0.08)', 
                                border: '1px solid rgba(255, 187, 40, 0.15)', 
                                color: '#FFBB28', 
                                padding: '3px 8px', 
                                borderRadius: '6px',
                                fontWeight: 600
                              }}>
                                Փոփոխված
                              </span>
                            ) : (
                              <span style={{ 
                                fontSize: '0.72rem', 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--muted)', 
                                padding: '3px 8px', 
                                borderRadius: '6px',
                                fontWeight: 500
                              }}>
                                Համակարգային
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Textareas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Հայերեն (Armenian)</label>
                            <hd-textarea
                              value={editingTrans[rowKey]?.hy ?? item.hy}
                              onInput={(e: any) => handleEditRow(item.section, item.key, 'hy', e.target.value)}
                              data-width="100%"
                              data-disable-horizontal-resize="true"
                              style={{ minHeight: '60px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Անգլերեն (English)</label>
                            <hd-textarea
                              value={editingTrans[rowKey]?.en ?? item.en}
                              onInput={(e: any) => handleEditRow(item.section, item.key, 'en', e.target.value)}
                              data-width="100%"
                              data-disable-horizontal-resize="true"
                              style={{ minHeight: '60px' }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
                          {(item.isCustom || hasLocalEdits) && (
                            <hd-button
                              onClick={() => {
                                if (hasLocalEdits) {
                                  // Revert local changes
                                  setEditingTrans(prev => {
                                    const next = { ...prev };
                                    delete next[rowKey];
                                    return next;
                                  });
                                } else {
                                  handleDeleteTranslation(item.section, item.key);
                                }
                              }}
                              data-color="#ff6b6b"
                              data-width="120px"
                              data-height="32px"
                              data-font-size="0.78rem"
                            >
                              {hasLocalEdits ? 'Չեղարկել' : 'Ջնջել / Reset'}
                            </hd-button>
                          )}
                          <hd-button
                            onClick={() => handleSaveTranslation(
                              item.section, 
                              item.key, 
                              editingTrans[rowKey]?.hy ?? item.hy, 
                              editingTrans[rowKey]?.en ?? item.en
                            )}
                            disabled={!hasLocalEdits}
                            data-color={hasLocalEdits ? '#00C49F' : 'rgba(255,255,255,0.03)'}
                            data-width="110px"
                            data-height="32px"
                            data-font-size="0.78rem"
                          >
                            Պահպանել
                          </hd-button>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTranslations.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', border: '1px dashed var(--panel-border)', borderRadius: '16px' }}>
                      Որոնմանը համապատասխանող թարգմանություններ չգտնվեցին
                    </div>
                  )}

                  {filteredTranslations.length > visibleTransCount && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                      <hd-button
                        onClick={() => setVisibleTransCount(prev => prev + 50)}
                        data-width="200px"
                        data-height="40px"
                        data-color="rgba(255,255,255,0.06)"
                      >
                        Տեսնել ավելին (+50)
                      </hd-button>
                    </div>
                  )}
                </div>

                {/* Add Translation Modal */}
                {showAddTrans && (
                  <div 
                    onClick={() => setShowAddTrans(false)}
                    style={{
                      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                  >
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="admin-modal-container"
                      style={{
                        background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: '24px',
                        width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '36px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '24px'
                      }}
                    >
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Ավելացնել Նոր Թարգմանություն</h3>

                      <form onSubmit={handleCreateTranslation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Բաժին</label>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <hd-select
                              value={newTransSection}
                              onChange={(e: any) => setNewTransSection(e.target.value)}
                              data-width={newTransSection === 'new' ? '40%' : '100%'}
                              data-height="40px"
                            >
                              {transSections.map(sec => (
                                <span key={sec} value={sec} {...(newTransSection === sec ? {selected: true} : {})}>{sec}</span>
                              ))}
                              <span value="new" {...(newTransSection === 'new' ? {selected: true} : {})} style={{ color: '#FFBB28' }}>+ Ստեղծել նոր բաժին</span>
                            </hd-select>

                            {newTransSection === 'new' && (
                              <hd-input 
                                placeholder="Բաժնի անուն..."
                                value={newTransCustomSection}
                                onInput={(e: any) => setNewTransCustomSection(e.target.value)}
                                data-width="60%"
                                data-height="40px"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Բանալի (Key)*</label>
                          <hd-input 
                            placeholder="օրինակ՝ header_title..."
                            value={newTransKey}
                            onInput={(e: any) => setNewTransKey(e.target.value)}
                            data-width="100%"
                            data-height="40px"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Հայերեն Արժեք (Armenian)*</label>
                          <hd-textarea
                            placeholder="Տեքստը հայերենով..."
                            value={newTransHy}
                            onInput={(e: any) => setNewTransHy(e.target.value)}
                            data-width="100%"
                            data-disable-horizontal-resize="true"
                            style={{ minHeight: '60px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Անգլերեն Արժեք (English)*</label>
                          <hd-textarea
                            placeholder="Text in English..."
                            value={newTransEn}
                            onInput={(e: any) => setNewTransEn(e.target.value)}
                            data-width="100%"
                            data-disable-horizontal-resize="true"
                            style={{ minHeight: '60px' }}
                          />
                        </div>

                        <div className="admin-modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                          <hd-button 
                            type="button"
                            onClick={() => setShowAddTrans(false)}
                            data-color="rgba(255,255,255,0.1)"
                            data-width="120px"
                            data-height="42px"
                          >
                            Չեղարկել
                          </hd-button>
                          <hd-button 
                            type="submit"
                            data-width="150px"
                            data-height="42px"
                            data-thickness="2px"
                          >
                            Ավելացնել
                          </hd-button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 5: API SETTINGS
                ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'apis' && (
              <div className={getTabClass('apis')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>API-ների և Ինտեգրումների Կառավարում</h2>
                      <div
                        onClick={handleEyeClick}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: isApiUnlocked ? '#00C49F' : 'var(--muted)',
                          transition: 'all 0.2s'
                        }}
                        title={isApiUnlocked ? "Թաքցնել API բանալիները" : "Ցուցադրել API բանալիները"}
                      >
                        <span className={isApiUnlocked ? "icon-Eye" : "icon-Close-Eye"} style={{ fontSize: '1.1rem' }} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>Միացրեք արտաքին ծառայություններ կամ ավելացրեք սեփական սկրիպտեր կայքի աշխատանքի համար</p>
                  </div>
                </div>

                <form onSubmit={handleSaveApiSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Supabase Connection */}
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="icon-Earth" style={{ fontSize: '1.5rem', color: '#4a897c' }} />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Supabase Database Connection</h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Կապեք ձեր կայքը Supabase տվյալների բազայի հետ (կարգավորումները կթարմացվեն նաև .env ֆայլում)</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Supabase URL*</label>
                        <hd-input 
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="https://your-project.supabase.co"
                          value={apiSettings.supabase_url}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, supabase_url: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Anon Key / Publishable Key*</label>
                        <hd-input 
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="sb_publishable_..."
                          value={apiSettings.supabase_key}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, supabase_key: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tidio Integration */}
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="icon-Chat-Bubble" style={{ fontSize: '1.5rem', color: '#00C49F' }} />
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Tidio Chat Widget (Tildo)</h3>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Ավելացրեք օնլայն չատի պատուհան կայքի այցելուների համար</span>
                        </div>
                      </div>

                      <hd-switch 
                        checked={apiSettings.tildo_enabled} 
                        onChange={(e: any) => setApiSettings(prev => ({ ...prev, tildo_enabled: e.target.checked }))} 
                      />
                    </div>

                    {apiSettings.tildo_enabled && (
                      <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Tidio Widget ID / Project Key*</label>
                        <hd-input 
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="Ներմուծեք Tidio Widget ID-ն (օրինակ՝ abcd1234efgh5678)..."
                          value={apiSettings.tildo_widget_id}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, tildo_widget_id: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: '6px' }}>
                          Այս բանալին սովորաբար գտնվում է Tidio-ի կոդի մեջ՝ <code>//code.tidio.co/{"{widget_id}"}.js</code>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Google Analytics Integration */}
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="icon-Monitor" style={{ fontSize: '1.5rem', color: '#FFBB28' }} />
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Google Analytics</h3>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Հետևեք կայքի այցելություններին Google Analytics-ով (GA4)</span>
                        </div>
                      </div>

                      <hd-switch 
                        checked={apiSettings.google_analytics_enabled} 
                        onChange={(e: any) => setApiSettings(prev => ({ ...prev, google_analytics_enabled: e.target.checked }))} 
                      />
                    </div>

                    {apiSettings.google_analytics_enabled && (
                      <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Measurement ID (G-ID)*</label>
                        <hd-input 
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="Ներմուծեք Measurement ID-ն (օրինակ՝ G-XXXXXXXXXX)..."
                          value={apiSettings.google_analytics_id}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        />
                      </div>
                    )}
                  </div>

                  {/* Custom Header / Footer Scripts */}
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="icon-Settings" style={{ color: 'var(--text)' }} />
                      Սեփական Սկրիպտեր (Custom Scripts)
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          Head Script (ներարկվում է <code>&lt;head&gt;</code>-ում)
                        </label>
                        <textarea
                          placeholder={isApiUnlocked ? "օրինակ՝ <meta name='...' /> կամ <script>...</script>" : "Սկրիպտը թաքցված է: Տեսնելու համար բացեք API-ները վերևի աչքի նշանով:"}
                          value={isApiUnlocked ? apiSettings.custom_head_script : ""}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, custom_head_script: e.target.value }))}
                          disabled={!isApiUnlocked}
                          style={{
                            width: '100%',
                            minHeight: '120px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '12px',
                            color: isApiUnlocked ? '#fff' : 'var(--muted)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'monospace',
                            lineHeight: '1.4'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                          Footer Script (ներարկվում է <code>&lt;/body&gt;</code>-ից առաջ)
                        </label>
                        <textarea
                          placeholder={isApiUnlocked ? "օրինակ՝ <script>...</script>" : "Սկրիպտը թաքցված է: Տեսնելու համար բացեք API-ները վերևի աչքի նշանով:"}
                          value={isApiUnlocked ? apiSettings.custom_footer_script : ""}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, custom_footer_script: e.target.value }))}
                          disabled={!isApiUnlocked}
                          style={{
                            width: '100%',
                            minHeight: '120px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '12px',
                            color: isApiUnlocked ? '#fff' : 'var(--muted)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'monospace',
                            lineHeight: '1.4'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <hd-button 
                      type="submit"
                      data-width="220px"
                      data-height="46px"
                      data-thickness="2px"
                    >
                      Պահպանել API-ները
                    </hd-button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'personalization' && (
              <div className={getTabClass('personalization')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Կայքի Անհատականացում և Կուրսորներ</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>Փոփոխեք կայքի վիզուալ տեսքը, գունային երանգները և անհատականացրեք կուրսորները</p>
                  </div>
                </div>

                <form onSubmit={handleSavePersonalization} className="personalization-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                  {/* Left Column: Website Identity & Colors */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Site Text Fields */}
                    <div style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon-Earth" style={{ color: '#4a897c' }} />
                        Կայքի Տվյալներ (SEO & Identity)
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Կայքի Անվանում (Հայերեն)</label>
                          <hd-input 
                            type="text"
                            placeholder="Կայքի հայերեն վերնագիրը..."
                            value={personalization.site_title_hy}
                            onInput={(e: any) => setPersonalization(prev => ({ ...prev, site_title_hy: e.target.value }))}
                            data-width="100%"
                            data-height="40px"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Site Title (English)</label>
                          <hd-input 
                            type="text"
                            placeholder="English site title..."
                            value={personalization.site_title_en}
                            onInput={(e: any) => setPersonalization(prev => ({ ...prev, site_title_en: e.target.value }))}
                            data-width="100%"
                            data-height="40px"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Կայքի Նկարագրություն (Հայերեն)</label>
                          <textarea
                            placeholder="Մուտքագրեք կայքի նկարագրությունը..."
                            value={personalization.site_desc_hy}
                            onChange={(e) => setPersonalization(prev => ({ ...prev, site_desc_hy: e.target.value }))}
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '12px',
                              padding: '12px',
                              color: '#fff',
                              fontSize: '0.85rem',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Site Description (English)</label>
                          <textarea
                            placeholder="Enter English site description..."
                            value={personalization.site_desc_en}
                            onChange={(e) => setPersonalization(prev => ({ ...prev, site_desc_en: e.target.value }))}
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '12px',
                              padding: '12px',
                              color: '#fff',
                              fontSize: '0.85rem',
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* WYSIWYG Theme & Color Spectrum */}
                    <div style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon-Image" style={{ color: '#00C49F' }} />
                        Գունային Թեմա (WYSIWYG)
                      </h3>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Կայքի Ակցենտային Գույնը (Hue)</label>
                          <span style={{ fontSize: '0.8rem', color: '#00C49F', fontWeight: 700 }}>{personalization.theme_hue}°</span>
                        </div>
                        
                        {/* Interactive Range Slider */}
                        <hd-slider 
                          min="0" 
                          max="360" 
                          value={personalization.theme_hue} 
                          onInput={(e: any) => setPersonalization(prev => ({ ...prev, theme_hue: e.target.value }))}
                          data-width="100%"
                          style={{
                            background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
                            borderRadius: '3px',
                          }}
                        />

                        {/* Real-time preview card using theme_hue */}
                        <div style={{
                          marginTop: '20px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.06)',
                          background: 'rgba(0,0,0,0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          // Apply the local CSS variable to preview the theme in real time
                          ['--hue' as any]: personalization.theme_hue
                        }}>
                          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>Իրական ժամանակում նախադիտում (Live preview)</div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'hsl(var(--hue, 172), 35%, 16%)',
                            border: '1px solid hsl(var(--hue, 172), 35%, 22%)'
                          }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{personalization.site_title_hy || 'HDesign'}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', opacity: 0.5 }} />
                            </div>
                          </div>
                          <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'hsl(var(--hue, 172), 35%, 12%)',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.75rem',
                            lineHeight: '1.4'
                          }}>
                            {personalization.site_desc_hy || 'Դիզայնի և Բրենդավորման Ստուդիա'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Cursors, Colors & Hot Points */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Cursors Color Palette */}
                    <div style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon-Dashboard" style={{ color: '#FF8042' }} />
                        Կուրսորների Գունապնակ (Color Cycle)
                      </h3>

                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                          {personalization.cursor_colors.map((color, idx) => (
                            <div key={idx} style={{
                              position: 'relative',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: color,
                              border: '2px solid rgba(255,255,255,0.2)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <div
                                onClick={() => {
                                  setPersonalization(prev => ({
                                    ...prev,
                                    cursor_colors: prev.cursor_colors.filter((_, i) => i !== idx)
                                  }));
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  right: '-4px',
                                  background: '#ff4d4d',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '14px',
                                  height: '14px',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                }}
                                title="Ջնջել գույնը"
                              >
                                ✕
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add color color-picker bar */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <hd-color-picker 
                            value={newCursorColor}
                            onChange={(e: any) => setNewCursorColor(e.target.value)}
                          />
                          <hd-button
                            onClick={() => {
                              if (!personalization.cursor_colors.includes(newCursorColor)) {
                                setPersonalization(prev => ({
                                  ...prev,
                                  cursor_colors: [...prev.cursor_colors, newCursorColor]
                                }));
                              }
                            }}
                            data-height="40px"
                            data-thickness="1px"
                            data-font-size="0.8rem"
                          >
                            + Ավելացնել Գույն
                          </hd-button>
                        </div>
                      </div>
                    </div>

                    {/* Cursors & Hot Points Configurator */}
                    <div style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon-Settings" style={{ color: '#0088FE' }} />
                        Կուրսորներ և Hot Point-եր
                      </h3>

                      {/* Sub-tabs for Cursor selection */}
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '10px' }}>
                        {(['default', 'pointer', 'text'] as const).map(type => (
                          <div
                            key={type}
                            onClick={() => setActiveCursorType(type)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: activeCursorType === type ? 'var(--switcher-capsule-bg)' : 'transparent',
                              color: activeCursorType === type ? '#fff' : 'var(--muted)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                              textAlign: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            {type === 'default' ? 'Լռելյայն' : type === 'pointer' ? 'Pointer' : 'Տեքստ (Text)'}
                          </div>
                        ))}
                      </div>

                      {/* Hotspot edit layout */}
                      <div className="hotspot-edit-layout" style={{ display: 'grid', gridTemplateColumns: '128px 1fr', gap: '20px', alignItems: 'start' }}>
                        {/* Interactive grid for hotspot selection */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div 
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const y = e.clientY - rect.top;
                              const scaledX = Math.min(32, Math.max(0, Math.round((x / rect.width) * 32)));
                              const scaledY = Math.min(32, Math.max(0, Math.round((y / rect.height) * 32)));
                              
                              setPersonalization(prev => ({
                                ...prev,
                                cursors: {
                                  ...prev.cursors,
                                  [activeCursorType]: {
                                    ...prev.cursors[activeCursorType],
                                    hotspot_x: scaledX,
                                    hotspot_y: scaledY
                                  }
                                }
                              }));
                            }}
                            style={{
                              width: '128px',
                              height: '128px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              background: 'rgba(0,0,0,0.3)',
                              position: 'relative',
                              cursor: 'crosshair',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}
                            title="Կտտացրեք նախադիտման վրա՝ Hot Point-ը դնելու համար"
                          >
                            {/* Render current cursor SVG */}
                            <div 
                              style={{ width: '128px', height: '128px', pointerEvents: 'none' }}
                              dangerouslySetInnerHTML={{
                                __html: (personalization.cursors[activeCursorType]?.svg || '')
                                  .replace('width="32"', 'width="128"')
                                  .replace('height="32"', 'height="128"')
                                  .replaceAll('fill="currentColor"', `fill="${personalization.cursor_colors[0] || '#fff'}"`)
                                  .replaceAll('fill="none"', 'fill="none"')
                              }}
                            />

                            {/* Red crosshair indicator for hotspot */}
                            <div style={{
                              position: 'absolute',
                              left: `${((personalization.cursors[activeCursorType]?.hotspot_x || 0) / 32) * 128}px`,
                              top: `${((personalization.cursors[activeCursorType]?.hotspot_y || 0) / 32) * 128}px`,
                              width: '10px',
                              height: '10px',
                              marginLeft: '-5px',
                              marginTop: '-5px',
                              pointerEvents: 'none'
                            }}>
                              <div style={{ width: '10px', height: '2px', background: '#ff3333', position: 'absolute', top: '4px', left: '0' }} />
                              <div style={{ width: '2px', height: '10px', background: '#ff3333', position: 'absolute', top: '0', left: '4px' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center' }}>Կտտացրեք պատկերին՝ Hot Point-ը դնելու համար</span>
                        </div>

                        {/* Coordinates and SVG code fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Hotspot X (0-32)</label>
                              <hd-input 
                                type="number" 
                                value={(personalization.cursors[activeCursorType]?.hotspot_x ?? 0).toString()}
                                onInput={(e: any) => {
                                  const val = Math.min(32, Math.max(0, parseInt(e.target.value) || 0));
                                  setPersonalization(prev => ({
                                    ...prev,
                                    cursors: {
                                      ...prev.cursors,
                                      [activeCursorType]: {
                                        ...prev.cursors[activeCursorType],
                                        hotspot_x: val
                                      }
                                    }
                                  }));
                                }}
                                data-width="100%"
                                data-height="36px"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Hotspot Y (0-32)</label>
                              <hd-input 
                                type="number" 
                                value={(personalization.cursors[activeCursorType]?.hotspot_y ?? 0).toString()}
                                onInput={(e: any) => {
                                  const val = Math.min(32, Math.max(0, parseInt(e.target.value) || 0));
                                  setPersonalization(prev => ({
                                    ...prev,
                                    cursors: {
                                      ...prev.cursors,
                                      [activeCursorType]: {
                                        ...prev.cursors[activeCursorType],
                                        hotspot_y: val
                                      }
                                    }
                                  }));
                                }}
                                data-width="100%"
                                data-height="36px"
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>SVG Կոդ</label>
                            <hd-textarea
                              value={personalization.cursors[activeCursorType]?.svg || ''}
                              onInput={(e: any) => {
                                const val = e.target.value;
                                setPersonalization(prev => ({
                                  ...prev,
                                  cursors: {
                                    ...prev.cursors,
                                    [activeCursorType]: {
                                      ...prev.cursors[activeCursorType],
                                      svg: val
                                    }
                                  }
                                }));
                              }}
                              data-width="100%"
                              data-disable-horizontal-resize="true"
                              style={{
                                minHeight: '80px',
                                color: '#00C49F',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sandbox Area to test locally edited cursors instantly */}
                      <div style={{
                        // Generate temporary CSS vars for preview sandbox
                        ['--sandbox-default' as any]: `url("data:image/svg+xml,${encodeURIComponent((personalization.cursors.default?.svg || '').replaceAll("currentColor", personalization.cursor_colors[0] || "#fff"))}") ${personalization.cursors.default?.hotspot_x ?? 0} ${personalization.cursors.default?.hotspot_y ?? 0}, auto`,
                        ['--sandbox-pointer' as any]: `url("data:image/svg+xml,${encodeURIComponent((personalization.cursors.pointer?.svg || '').replaceAll("currentColor", personalization.cursor_colors[0] || "#fff"))}") ${personalization.cursors.pointer?.hotspot_x ?? 5} ${personalization.cursors.pointer?.hotspot_y ?? 4}, pointer`,
                        ['--sandbox-text' as any]: `url("data:image/svg+xml,${encodeURIComponent((personalization.cursors.text?.svg || '').replaceAll("currentColor", personalization.cursor_colors[0] || "#fff"))}") ${personalization.cursors.text?.hotspot_x ?? 11} ${personalization.cursors.text?.hotspot_y ?? 16}, text`,
                        border: '2px dashed rgba(255,255,255,0.15)',
                        borderRadius: '16px',
                        padding: '24px',
                        background: 'rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        alignItems: 'center',
                        cursor: 'var(--sandbox-default)'
                      }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700 }}>Կուրսորների Փորձարկման Գոտի (Hover to Test)</h4>
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                          <hd-button 
                            data-width="50%"
                            data-height="42px"
                            data-thickness="1px"
                            style={{
                              cursor: 'var(--sandbox-pointer)',
                              fontSize: '0.8rem',
                            }}
                          >
                            Հղում / Կոճակ (Pointer)
                          </hd-button>
                          <hd-input 
                            placeholder="Գրիր այստեղ (Text)" 
                            data-width="50%"
                            data-height="42px"
                            style={{
                              cursor: 'var(--sandbox-text)',
                              fontSize: '0.8rem',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit bar */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <hd-button 
                      type="submit"
                      data-width="260px"
                      data-height="46px"
                      data-thickness="2px"
                    >
                      Պահպանել Փոփոխությունները
                    </hd-button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className={getTabClass('settings')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Հիմնական Կարգավորումներ</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>Կառավարեք ադմինի գաղտնաբառը և կայքի աշխատանքային ռեժիմը</p>
                  </div>
                </div>

                <div className="personalization-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                  {/* Left Column wrapper */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Card 1: Maintenance Mode */}
                    <div style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon-Earth" style={{ color: '#ec407a' }} />
                        Կայքի Աշխատանքային Ռեժիմ (Maintenance Mode)
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                        Միացնելով «Upcoming» ռեժիմը՝ կայքի հիմնական այցելուներին կցուցադրվի ժամանակավոր սպասման էջ (Coming Soon), իսկ ադմինիստրատիվ համակարգը (/admin) կշարունակի գործել սովորական ռեժիմով։
                      </p>

                      <form onSubmit={handleSaveGeneralSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '12px',
                          border: '1px solid var(--panel-border)'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>Upcoming Mode Ռեժիմ</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                              {upcomingMode ? 'Ակտիվացված է (սպասման էջը միացված է)' : 'Անջատված է (կայքը բաց է բոլորի համար)'}
                            </span>
                          </div>
                          
                          <hd-switch 
                            checked={upcomingMode} 
                            onChange={(e: any) => setUpcomingMode(e.target.checked)} 
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <hd-button 
                            type="submit" 
                            data-thickness="2px"
                            data-width="160px"
                            data-height="40px"
                            data-font-size="0.85rem"
                            disabled={savingSettings}
                          >
                            {savingSettings ? 'Պահպանվում է...' : 'Պահպանել Ռեժիմը'}
                          </hd-button>
                        </div>
                      </form>
                    </div>

                    {/* Card 2: Coming Soon Texts Section */}
                    <div style={{
                      background: 'var(--panel)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon-Chat-Bubble" style={{ color: '#ffbb28' }} />
                        Coming Soon Էջի Տեքստեր
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                        Կարգավորեք սպասման էջի բոլոր տեքստային տվյալները հայերեն և անգլերեն տարբերակներով, ինչպես նաև կոնտակտային տվյալները։
                      </p>

                      <form onSubmit={handleSaveGeneralSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Վերնագիր (Armenian)</label>
                              <hd-input 
                                placeholder="Շուտով..."
                                value={upcomingTitleHy}
                                onInput={(e: any) => setUpcomingTitleHy(e.target.value)}
                                data-width="100%"
                                data-height="36px"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Վերնագիր (English)</label>
                              <hd-input 
                                placeholder="Coming Soon..."
                                value={upcomingTitleEn}
                                onInput={(e: any) => setUpcomingTitleEn(e.target.value)}
                                data-width="100%"
                                data-height="36px"
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Նկարագրություն (Armenian)</label>
                            <hd-textarea 
                              placeholder="Մանրամասներ..."
                              value={upcomingDescHy}
                              onInput={(e: any) => setUpcomingDescHy(e.target.value)}
                              data-width="100%"
                              data-disable-horizontal-resize="true"
                              style={{ minHeight: '60px' }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Նկարագրություն (English)</label>
                            <hd-textarea 
                              placeholder="Description..."
                              value={upcomingDescEn}
                              onInput={(e: any) => setUpcomingDescEn(e.target.value)}
                              data-width="100%"
                              data-disable-horizontal-resize="true"
                              style={{ minHeight: '60px' }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Էլ. հասցե (Email)</label>
                              <hd-input 
                                placeholder="info@hdesign.am"
                                value={upcomingEmail}
                                onInput={(e: any) => setUpcomingEmail(e.target.value)}
                                data-width="100%"
                                data-height="36px"
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Հեռախոս (Phone)</label>
                              <hd-input 
                                placeholder="+374 99 00 00 00"
                                value={upcomingTel}
                                onInput={(e: any) => setUpcomingTel(e.target.value)}
                                data-width="100%"
                                data-height="36px"
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <hd-button 
                            type="submit" 
                            data-thickness="2px"
                            data-width="180px"
                            data-height="40px"
                            data-font-size="0.85rem"
                            disabled={savingSettings}
                          >
                            {savingSettings ? 'Պահպանվում է...' : 'Պահպանել Տեքստերը'}
                          </hd-button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Passcode change settings */}
                  <div style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="icon-Profile" style={{ color: '#0088FE' }} />
                      Փոխել Ադմինիստրատորի Գաղտնաբառը
                    </h3>

                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Ընթացիկ գաղտնաբառ</label>
                        <hd-input 
                          type="password"
                          placeholder="Մուտքագրեք ընթացիկ գաղտնաբառը..."
                          value={currentPasscode}
                          onInput={(e: any) => setCurrentPasscode(e.target.value)}
                          data-width="100%"
                          data-height="40px"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Նոր գաղտնաբառ</label>
                        <hd-input 
                          type="password"
                          placeholder="Մուտքագրեք նոր գաղտնաբառը..."
                          value={newPasscode}
                          onInput={(e: any) => setNewPasscode(e.target.value)}
                          data-width="100%"
                          data-height="40px"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Հաստատել նոր գաղտնաբառը</label>
                        <hd-input 
                          type="password"
                          placeholder="Կրկնեք նոր գաղտնաբառը..."
                          value={confirmPasscode}
                          onInput={(e: any) => setConfirmPasscode(e.target.value)}
                          data-width="100%"
                          data-height="40px"
                        />
                      </div>

                      {passwordError && (
                        <div style={{
                          fontSize: '0.82rem', color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.08)',
                          padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 107, 107, 0.2)'
                        }}>
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div style={{
                          fontSize: '0.82rem', color: '#00c49f', background: 'rgba(0, 196, 159, 0.08)',
                          padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0, 196, 159, 0.2)'
                        }}>
                          {passwordSuccess}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <hd-button 
                          type="submit" 
                          data-thickness="2px"
                          data-width="180px"
                          data-height="40px"
                          data-font-size="0.85rem"
                          disabled={changingPassword}
                        >
                          {changingPassword ? 'Փոխվում է...' : 'Թարմացնել Գաղտնաբառը'}
                        </hd-button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bottom Navigation Tab Bar */}
      <nav 
        className="admin-floating-nav"
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          height: '68px',
          padding: '0 8px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--panel-border)',
          transition: 'all 0.3s ease'
        }}
      >
        <div 
          onClick={() => setActiveTab('analytics')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'analytics' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'analytics' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Dashboard" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">Վիճակագրություն</div>
        </div>

        <div 
          onClick={() => setActiveTab('cases')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'cases' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'cases' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Image" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">Քեյսեր</div>
        </div>


        <div 
          onClick={() => setActiveTab('messages')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'messages' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'messages' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Mail" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">Նամակներ</div>
        </div>

        <div 
          onClick={() => setActiveTab('translations')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'translations' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'translations' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Earth" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">Թարգմանություններ</div>
        </div>

        <div 
          onClick={() => setActiveTab('apis')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'apis' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'apis' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Settings" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">API-ներ</div>
        </div>

        <div 
          onClick={() => setActiveTab('personalization')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'personalization' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'personalization' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Cursor" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">Անհատականացում</div>
        </div>

        <div 
          onClick={() => setActiveTab('settings')}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'settings' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'settings' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Profile" style={{ fontSize: '1.4rem' }} />
          <div className="nav-tooltip">Կարգավորումներ</div>
        </div>
      </nav>

      {/* API Unlocks Passcode Prompt Modal */}
      {showPasscodePrompt && (
        <div 
          onClick={() => { setShowPasscodePrompt(false); setUnlockPasscode(''); setUnlockError(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="admin-modal-container"
            style={{
              background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: '24px',
              width: '100%', maxWidth: '400px', padding: '36px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '20px',
              textAlign: 'center'
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>API Կարգավորումների Ապակողպում</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Մուտքագրեք ադմինի գաղտնաբառը՝ API-ները և գաղտնի բանալիները տեսնելու համար</p>
            </div>

            <form onSubmit={handleVerifyUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <hd-input 
                type="password"
                placeholder="Մուտքագրեք գաղտնաբառը..."
                value={unlockPasscode}
                onInput={(e: any) => setUnlockPasscode(e.target.value)}
                data-width="100%"
                data-height="40px"
              />

              {unlockError && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#ff6b6b', 
                  background: 'rgba(255, 107, 107, 0.1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 107, 107, 0.2)' 
                }}>
                  {unlockError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
                <hd-button 
                  type="button"
                  onClick={() => { setShowPasscodePrompt(false); setUnlockPasscode(''); setUnlockError(null); }}
                  data-color="rgba(255,255,255,0.1)"
                  data-width="100px"
                  data-height="38px"
                  data-font-size="0.82rem"
                >
                  Չեղարկել
                </hd-button>
                <hd-button 
                  type="submit"
                  data-width="120px"
                  data-height="38px"
                  data-thickness="2px"
                  data-font-size="0.82rem"
                >
                  Հաստատել
                </hd-button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Fixed Drawer Overlay Removed */}
    </main>
  );
}
