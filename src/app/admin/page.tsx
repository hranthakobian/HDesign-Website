"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hyTranslations, enTranslations } from '@/lib/i18n';
import LoadingAnimation from '@/components/LoadingAnimation';
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

type MessageReply = {
  id: string;
  messageId: string;
  subject: string;
  message: string;
  sent_at: string;
};

type Message = {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
  read?: boolean;
  starred?: boolean;
  spam?: boolean;
  trash?: boolean;
  replied?: boolean;
  replies?: MessageReply[];
};

type Subscriber = {
  id: string;
  email: string;
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'cases' | 'fonts' | 'messages' | 'translations' | 'apis' | 'personalization' | 'settings' | 'subscribers'>('analytics');
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

  // Floating Nav Drag & Dock States
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dockState, setDockState] = useState<'bottom' | 'left' | 'right'>('bottom');
  const [snapPreview, setSnapPreview] = useState<'none' | 'left' | 'right' | 'center'>('none');
  
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const dockStateRef = useRef<'bottom' | 'left' | 'right'>('bottom');
  const lastSelectedIdRef = useRef<string | null>(null);

  // Sync states with refs
  useEffect(() => {
    offsetXRef.current = offsetX;
  }, [offsetX]);

  useEffect(() => {
    offsetYRef.current = offsetY;
  }, [offsetY]);

  useEffect(() => {
    dockStateRef.current = dockState;
  }, [dockState]);

  // Load saved position and dock state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDock = localStorage.getItem('hdesign_admin_nav_dock');
      const savedOffsetX = localStorage.getItem('hdesign_admin_nav_offset');
      const savedOffsetY = localStorage.getItem('hdesign_admin_nav_offset_y');
      if (savedDock) {
        setDockState(savedDock as any);
      }
      if (savedOffsetX) {
        setOffsetX(parseFloat(savedOffsetX));
      }
      if (savedOffsetY) {
        setOffsetY(parseFloat(savedOffsetY));
      }
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    hasDraggedRef.current = false;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    
    // Check dragging threshold to prevent micro-dragging on clicks
    if (Math.abs(e.clientX - startXRef.current) > 5 || Math.abs(e.clientY - startYRef.current) > 5) {
      if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        setIsDragging(true);
      }
    }
    
    if (hasDraggedRef.current) {
      // If docked as sidebar (left or right)
      if (dockStateRef.current !== 'bottom') {
        // Horizontal break-out threshold: e.g. pulling 60px away from the docked edge
        const isLeftBreakout = dockStateRef.current === 'left' && e.clientX > 100;
        const isRightBreakout = dockStateRef.current === 'right' && e.clientX < window.innerWidth - 100;
        
        if (isLeftBreakout || isRightBreakout) {
          // Break out to bottom dock
          setDockState('bottom');
          dockStateRef.current = 'bottom';
          
          const initialOffset = e.clientX - window.innerWidth / 2;
          setOffsetX(initialOffset);
          offsetXRef.current = initialOffset;
          setOffsetY(0);
          offsetYRef.current = 0;
          
          startXRef.current = e.clientX;
          startYRef.current = e.clientY;
        } else {
          // Drag vertically along the sidebar
          const newRawOffsetY = offsetYRef.current + deltaY;
          const maxOffsetY = typeof window !== 'undefined' ? window.innerHeight / 2 - 80 : 400;
          let clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newRawOffsetY));
          
          // Subtle magnetic snap to vertical center (within 12px)
          if (Math.abs(clampedOffsetY) < 12) {
            clampedOffsetY = 0;
            setSnapPreview('center');
          } else {
            setSnapPreview('none');
          }
          
          offsetYRef.current = clampedOffsetY;
          setOffsetY(clampedOffsetY);
          startYRef.current = e.clientY;
          startXRef.current = e.clientX; // keep track of horizontal positions for breakout
        }
      } else {
        // Floating bottom dragging (horizontal)
        const newRawOffsetX = offsetXRef.current + deltaX;
        const maxOffsetX = typeof window !== 'undefined' ? window.innerWidth / 2 - 100 : 500;
        let clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newRawOffsetX));
        
        // Subtle magnetic snap to center (within 12px)
        if (Math.abs(clampedOffsetX) < 12) {
          clampedOffsetX = 0;
        }
        
        offsetXRef.current = clampedOffsetX;
        setOffsetX(clampedOffsetX);
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        
        // Snapping zones based on 8% of window width for ease of docking
        const leftZoneLimit = window.innerWidth * 0.08;
        const rightZoneLimit = window.innerWidth * 0.92;
        
        if (e.clientX < leftZoneLimit) {
          setSnapPreview('left');
        } else if (e.clientX > rightZoneLimit) {
          setSnapPreview('right');
        } else if (clampedOffsetX === 0) {
          setSnapPreview('center');
        } else {
          setSnapPreview('none');
        }
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setSnapPreview('none');
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    if (hasDraggedRef.current && typeof window !== 'undefined') {
      const clientX = startXRef.current;
      const clientY = startYRef.current;
      
      let finalDock = dockStateRef.current;
      let finalOffsetX = offsetXRef.current;
      let finalOffsetY = offsetYRef.current;
      
      if (dockStateRef.current === 'bottom') {
        const leftZoneLimit = window.innerWidth * 0.08;
        const rightZoneLimit = window.innerWidth * 0.92;
        
        if (clientX < leftZoneLimit) {
          finalDock = 'left';
          finalOffsetX = 0;
          finalOffsetY = clientY - window.innerHeight / 2;
        } else if (clientX > rightZoneLimit) {
          finalDock = 'right';
          finalOffsetX = 0;
          finalOffsetY = clientY - window.innerHeight / 2;
        } else if (Math.abs(finalOffsetX) < 12) {
          finalOffsetX = 0;
        }
      } else {
        if (Math.abs(finalOffsetY) < 12) {
          finalOffsetY = 0;
        }
      }
      
      setDockState(finalDock);
      setOffsetX(finalOffsetX);
      setOffsetY(finalOffsetY);
      
      localStorage.setItem('hdesign_admin_nav_dock', finalDock);
      localStorage.setItem('hdesign_admin_nav_offset', finalOffsetX.toString());
      localStorage.setItem('hdesign_admin_nav_offset_y', finalOffsetY.toString());
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    hasDraggedRef.current = false;
    
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    
    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;
    
    if (Math.abs(clientX - startXRef.current) > 5 || Math.abs(clientY - startYRef.current) > 5) {
      if (!hasDraggedRef.current) {
        hasDraggedRef.current = true;
        setIsDragging(true);
      }
    }
    
    if (hasDraggedRef.current) {
      e.preventDefault(); // prevent scroll
      
      if (dockStateRef.current !== 'bottom') {
        const isLeftBreakout = dockStateRef.current === 'left' && clientX > 100;
        const isRightBreakout = dockStateRef.current === 'right' && clientX < window.innerWidth - 100;
        
        if (isLeftBreakout || isRightBreakout) {
          setDockState('bottom');
          dockStateRef.current = 'bottom';
          
          const initialOffset = clientX - window.innerWidth / 2;
          setOffsetX(initialOffset);
          offsetXRef.current = initialOffset;
          setOffsetY(0);
          offsetYRef.current = 0;
          
          startXRef.current = clientX;
          startYRef.current = clientY;
        } else {
          const newRawOffsetY = offsetYRef.current + deltaY;
          const maxOffsetY = typeof window !== 'undefined' ? window.innerHeight / 2 - 80 : 400;
          let clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newRawOffsetY));
          
          if (Math.abs(clampedOffsetY) < 12) {
            clampedOffsetY = 0;
            setSnapPreview('center');
          } else {
            setSnapPreview('none');
          }
          
          offsetYRef.current = clampedOffsetY;
          setOffsetY(clampedOffsetY);
          startYRef.current = clientY;
          startXRef.current = clientX;
        }
      } else {
        const newRawOffsetX = offsetXRef.current + deltaX;
        const maxOffsetX = typeof window !== 'undefined' ? window.innerWidth / 2 - 100 : 500;
        let clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newRawOffsetX));
        
        if (Math.abs(clampedOffsetX) < 12) {
          clampedOffsetX = 0;
        }
        
        offsetXRef.current = clampedOffsetX;
        setOffsetX(clampedOffsetX);
        startXRef.current = clientX;
        startYRef.current = clientY;
        
        const leftZoneLimit = window.innerWidth * 0.08;
        const rightZoneLimit = window.innerWidth * 0.92;
        
        if (clientX < leftZoneLimit) {
          setSnapPreview('left');
        } else if (clientX > rightZoneLimit) {
          setSnapPreview('right');
        } else if (clampedOffsetX === 0) {
          setSnapPreview('center');
        } else {
          setSnapPreview('none');
        }
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setSnapPreview('none');
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
    
    if (hasDraggedRef.current && typeof window !== 'undefined') {
      const clientX = startXRef.current;
      const clientY = startYRef.current;
      
      let finalDock = dockStateRef.current;
      let finalOffsetX = offsetXRef.current;
      let finalOffsetY = offsetYRef.current;
      
      if (dockStateRef.current === 'bottom') {
        const leftZoneLimit = window.innerWidth * 0.08;
        const rightZoneLimit = window.innerWidth * 0.92;
        
        if (clientX < leftZoneLimit) {
          finalDock = 'left';
          finalOffsetX = 0;
          finalOffsetY = clientY - window.innerHeight / 2;
        } else if (clientX > rightZoneLimit) {
          finalDock = 'right';
          finalOffsetX = 0;
          finalOffsetY = clientY - window.innerHeight / 2;
        } else if (Math.abs(finalOffsetX) < 12) {
          finalOffsetX = 0;
        }
      } else {
        if (Math.abs(finalOffsetY) < 12) {
          finalOffsetY = 0;
        }
      }
      
      setDockState(finalDock);
      setOffsetX(finalOffsetX);
      setOffsetY(finalOffsetY);
      
      localStorage.setItem('hdesign_admin_nav_dock', finalDock);
      localStorage.setItem('hdesign_admin_nav_offset', finalOffsetX.toString());
      localStorage.setItem('hdesign_admin_nav_offset_y', finalOffsetY.toString());
    }
  };

  const handleDoubleClick = () => {
    setDockState('bottom');
    setOffsetX(0);
    setOffsetY(0);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hdesign_admin_nav_dock');
      localStorage.removeItem('hdesign_admin_nav_offset');
      localStorage.removeItem('hdesign_admin_nav_offset_y');
    }
  };

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
  const [selectedMailFolder, setSelectedMailFolder] = useState<'inbox' | 'starred' | 'sent' | 'spam' | 'trash'>('inbox');
  const [mailSearchQuery, setMailSearchQuery] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);
  const [signature, setSignature] = useState('');
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [hoveredMailId, setHoveredMailId] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });
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
    supabase_key: '',
    smtp_host: '',
    smtp_port: '',
    smtp_secure: false,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: ''
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
  const [prevTab, setPrevTab] = useState<'analytics' | 'cases' | 'fonts' | 'messages' | 'translations' | 'apis' | 'personalization' | 'settings' | 'subscribers'>('analytics');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const tabIndices = useMemo(() => ({
    analytics: 0,
    cases: 1,
    fonts: 2,
    messages: 3,
    translations: 4,
    apis: 5,
    personalization: 6,
    settings: 7,
    subscribers: 8
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
  const [transFilterStatus, setTransFilterStatus] = useState<'all' | 'missing' | 'custom'>('all');
  const [transViewMode, setTransViewMode] = useState<'grid' | 'table'>('grid');
  const [translatingKeys, setTranslatingKeys] = useState<Record<string, boolean>>({});
  const [isTranslatingBulk, setIsTranslatingBulk] = useState(false);
  const [isSavingAllTrans, setIsSavingAllTrans] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

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

        // 9. Fetch Subscribers
        const subscribersRes = await fetch('/api/subscribers', { headers });
        if (!subscribersRes.ok) throw new Error('Failed to fetch subscribers');
        const subscribersData = await subscribersRes.json();

        // 10. Fetch Mail Signature
        let signatureData = '';
        try {
          const sigRes = await fetch('/api/contact/signature', { headers });
          if (sigRes.ok) {
            const sigJson = await sigRes.json();
            signatureData = sigJson.signature || '';
          }
        } catch (sigErr) {
          console.warn('Failed to fetch mail signature:', sigErr);
        }

        // Seed list with loaded values, filter out seed items from dynamic listing if desired
        setCases(casesData || []);
        setFonts(fontsData || []);
        setMessages(msgData || []);
        setVisits(visitsData || []);
        setSubscribers(subscribersData || []);
        setSignature(signatureData);
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
          supabase_key: '',
          smtp_host: '',
          smtp_port: '',
          smtp_secure: false,
          smtp_user: '',
          smtp_pass: '',
          smtp_from: ''
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
    const prefix = casesSubTab === 'gallery' ? 'port-' : 'case-';
    const newId = prefix + Math.random().toString(36).substring(2, 8);
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

  const handleSelectMessage = async (msg: Message, e?: React.MouseEvent) => {
    if (e && e.ctrlKey) {
      setSelectedMailIds(prev => {
        const isSel = prev.includes(msg.id!);
        if (isSel) {
          return prev.filter(id => id !== msg.id!);
        } else {
          lastSelectedIdRef.current = msg.id!;
          return [...prev, msg.id!];
        }
      });
    } else if (e && e.shiftKey && lastSelectedIdRef.current !== null) {
      const currentFilteredMails = messages.filter(m => {
        if (selectedMailFolder === 'inbox') return !m.spam && !m.trash;
        if (selectedMailFolder === 'starred') return !!m.starred && !m.trash;
        if (selectedMailFolder === 'sent') return !!m.replies && m.replies.length > 0 && !m.trash;
        if (selectedMailFolder === 'spam') return !!m.spam && !m.trash;
        if (selectedMailFolder === 'trash') return !!m.trash;
        return true;
      }).filter(m => {
        if (!mailSearchQuery.trim()) return true;
        const q = mailSearchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
      });

      const idxStart = currentFilteredMails.findIndex(m => m.id === lastSelectedIdRef.current);
      const idxEnd = currentFilteredMails.findIndex(m => m.id === msg.id);

      if (idxStart !== -1 && idxEnd !== -1) {
        const minIdx = Math.min(idxStart, idxEnd);
        const maxIdx = Math.max(idxStart, idxEnd);
        const rangeIds = currentFilteredMails.slice(minIdx, maxIdx + 1).map(m => m.id!);
        
        setSelectedMailIds(prev => {
          return Array.from(new Set([...prev, ...rangeIds]));
        });
      }
    } else {
      setSelectedMailIds([msg.id!]);
      lastSelectedIdRef.current = msg.id!;
    }

    setSelectedMessage(msg);
    setReplySubject(`Re: ${msg.name}-ի հաղորդագրությունը HDesign-ին`);
    setReplyStatus({ type: null, text: '' });

    const sigHtml = signature ? `<br><br><div style="color: #666; font-size: 0.9rem;">--<br>${signature.replace(/\n/g, '<br>')}</div>` : '<br><br>';
    setReplyBody(sigHtml);

    if (!msg.read && msg.id) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      try {
        await fetch(`/api/contact/${msg.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token || ''
          },
          body: JSON.stringify({ read: true })
        });
      } catch (err) {
        console.error('Failed to mark message as read:', err);
      }
    }
  };

  const handleToggleStar = async (msg: Message, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!msg.id) return;
    const newStarred = !msg.starred;

    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, starred: newStarred } : m));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(prev => prev ? { ...prev, starred: newStarred } : null);
    }

    try {
      const res = await fetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ starred: newStarred })
      });
      if (!res.ok) throw new Error('API failed');
    } catch (err) {
      console.error('Failed to toggle star:', err);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, starred: !newStarred } : m));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(prev => prev ? { ...prev, starred: !newStarred } : null);
      }
    }
  };

  const handleToggleSpam = async (msg: Message, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!msg.id) return;
    const newSpam = !msg.spam;

    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, spam: newSpam } : m));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(prev => prev ? { ...prev, spam: newSpam } : null);
    }

    try {
      const res = await fetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ spam: newSpam })
      });
      if (!res.ok) throw new Error('API failed');
    } catch (err) {
      console.error('Failed to toggle spam:', err);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, spam: !newSpam } : m));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(prev => prev ? { ...prev, spam: !newSpam } : null);
      }
    }
  };

  const handleToggleTrash = async (msg: Message, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!msg.id) return;
    const newTrash = !msg.trash;

    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, trash: newTrash } : m));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(prev => prev ? { ...prev, trash: newTrash } : null);
    }

    try {
      const res = await fetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ trash: newTrash })
      });
      if (!res.ok) throw new Error('API failed');
    } catch (err) {
      console.error('Failed to toggle trash:', err);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, trash: !newTrash } : m));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(prev => prev ? { ...prev, trash: !newTrash } : null);
      }
    }
  };

  const handleSendReply = async (msg: Message) => {
    if (!msg.id) return;
    if (!replySubject.trim() || !replyBody.trim()) {
      setReplyStatus({ type: 'error', text: 'Խնդրում ենք լրացնել վերնագիրը և հաղորդագրությունը:' });
      return;
    }

    setSendingReply(true);
    setReplyStatus({ type: null, text: '' });

    try {
      const res = await fetch(`/api/contact/${msg.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({
          subject: replySubject,
          message: replyBody
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReplyStatus({ type: 'success', text: 'Պատասխանն ուղարկվեց հաջողությամբ:' });
        setReplyBody('');

        const newReply = data.reply;
        setMessages(prev => prev.map(m => {
          if (m.id === msg.id) {
            const currentReplies = m.replies || [];
            return {
              ...m,
              replied: true,
              read: true,
              replies: [newReply, ...currentReplies]
            };
          }
          return m;
        }));

        setSelectedMessage(prev => {
          if (prev && prev.id === msg.id) {
            const currentReplies = prev.replies || [];
            return {
              ...prev,
              replied: true,
              read: true,
              replies: [newReply, ...currentReplies]
            };
          }
          return prev;
        });
      } else {
        setReplyStatus({ type: 'error', text: data.error || 'Չհաջողվեց ուղարկել պատասխանը:' });
      }
    } catch (err: any) {
      setReplyStatus({ type: 'error', text: err.message || 'Չհաջողվեց ուղարկել պատասխանը:' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleBulkMarkRead = async () => {
    const unreadInbox = messages.filter(m => !m.read && !m.spam && !m.trash);
    if (unreadInbox.length === 0) return;

    setMessages(prev => prev.map(m => (!m.read && !m.spam && !m.trash) ? { ...m, read: true } : m));

    try {
      await Promise.all(unreadInbox.map(m => 
        fetch(`/api/contact/${m.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token || ''
          },
          body: JSON.stringify({ read: true })
        })
      ));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleBulkEmptyTrash = async () => {
    const trashMessages = messages.filter(m => m.trash);
    if (trashMessages.length === 0) return;

    if (!confirm('Վստա՞հ եք, որ ցանկանում եք ընդմիշտ ջնջել աղբամանի բոլոր նամակները:')) return;

    setMessages(prev => prev.filter(m => !m.trash));
    if (selectedMessage && selectedMessage.trash) {
      setSelectedMessage(null);
    }

    try {
      await Promise.all(trashMessages.map(m => 
        fetch(`/api/contact/${m.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': token || '' }
        })
      ));
      alert('Աղբամանը հաջողությամբ դատարկվեց:');
    } catch (err) {
      console.error('Failed to empty trash:', err);
    }
  };

  const handleSaveSignature = async () => {
    if (!token) return;
    setSavingSignature(true);
    try {
      const res = await fetch('/api/contact/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ signature })
      });
      if (res.ok) {
        setIsEditingSignature(false);
        alert('Ստորագրությունը հաջողությամբ պահպանվեց:');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել ստորագրությունը:');
    } finally {
      setSavingSignature(false);
    }
  };

  const insertTagIntoSignature = (tag: 'b' | 'i') => {
    const textarea = document.getElementById('signature-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = `<${tag}>${selectedText}</${tag}>`;
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setSignature(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2 + selectedText.length);
    }, 0);
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'star' | 'unstar' | 'trash' | 'restore' | 'delete') => {
    if (selectedMailIds.length === 0) return;
    if (!token) return;

    if (action === 'delete') {
      if (!confirm(`Վստա՞հ եք, որ ցանկանում եք ընդմիշտ ջնջել ընտրված ${selectedMailIds.length} նամակները:`)) return;
    }

    setMessages(prev => {
      if (action === 'delete') {
        return prev.filter(m => !selectedMailIds.includes(m.id!));
      }
      return prev.map(m => {
        if (selectedMailIds.includes(m.id!)) {
          const u: any = {};
          if (action === 'read') u.read = true;
          if (action === 'unread') u.read = false;
          if (action === 'star') u.starred = true;
          if (action === 'unstar') u.starred = false;
          if (action === 'trash') u.trash = true;
          if (action === 'restore') u.trash = false;
          return { ...m, ...u };
        }
        return m;
      });
    });

    if (selectedMessage && selectedMailIds.includes(selectedMessage.id!)) {
      if (action === 'delete') {
        setSelectedMessage(null);
      } else {
        setSelectedMessage(prev => {
          if (!prev) return null;
          const u: any = {};
          if (action === 'read') u.read = true;
          if (action === 'unread') u.read = false;
          if (action === 'star') u.starred = true;
          if (action === 'unstar') u.starred = false;
          if (action === 'trash') u.trash = true;
          if (action === 'restore') u.trash = false;
          return { ...prev, ...u };
        });
      }
    }

    const idsToProcess = [...selectedMailIds];
    setSelectedMailIds([]);

    try {
      const res = await fetch('/api/contact/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ ids: idsToProcess, action })
      });
      if (!res.ok) throw new Error('Bulk API failed');
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
      alert('Չհաջողվեց կատարել խմբային գործողությունը:');
      const headers = { 'Authorization': token || '' };
      const msgRes = await fetch('/api/contact', { headers });
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData || []);
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // SUBSCRIBERS OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════════

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս բաժանորդին:')) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });
      if (res.ok) {
        setSubscribers(prev => prev.filter(x => x.id !== id));
        alert('Բաժանորդը հաջողությամբ ջնջվեց:');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err: any) {
      alert('Չհաջողվեց ջնջել բաժանորդին:');
    }
  };

  const handleSendEmailCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailMessage) {
      setEmailStatus({ type: 'error', text: 'Վերնագիրը և նամակը պարտադիր են։' });
      return;
    }

    setSendingEmail(true);
    setEmailStatus({ type: null, text: '' });

    try {
      const res = await fetch('/api/subscribers/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
          cc: emailCc,
          bcc: emailBcc
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEmailStatus({
          type: 'success',
          text: `Նամակը հաջողությամբ ուղարկվեց ${data.recipients_count} բաժանորդի։`
        });
        setEmailSubject('');
        setEmailMessage('');
        setEmailCc('');
        setEmailBcc('');
      } else {
        setEmailStatus({ type: 'error', text: data.error || 'Սխալ տեղի ունեցավ:' });
      }
    } catch (err: any) {
      setEmailStatus({ type: 'error', text: 'Կապի սխալ։ Խնդրում ենք փորձել կրկին։' });
    } finally {
      setSendingEmail(false);
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
      
      let matchesStatus = true;
      if (transFilterStatus === 'missing') {
        const rowKey = `${item.section}::${item.key}`;
        const hyVal = editingTrans[rowKey]?.hy ?? item.hy;
        const enVal = editingTrans[rowKey]?.en ?? item.en;
        matchesStatus = !hyVal.trim() || !enVal.trim();
      } else if (transFilterStatus === 'custom') {
        matchesStatus = item.isCustom;
      }
      
      return matchesSection && matchesSearch && matchesStatus;
    });
  }, [allTranslationsList, transSectionFilter, transSearch, transFilterStatus, editingTrans]);

  const translationStats = useMemo(() => {
    let totalKeys = allTranslationsList.length;
    let filledHy = 0;
    let filledEn = 0;
    let missingBoth = 0;
    let missingAny = 0;
    let totalCustom = 0;

    allTranslationsList.forEach(item => {
      const rowKey = `${item.section}::${item.key}`;
      const hyVal = editingTrans[rowKey]?.hy ?? item.hy;
      const enVal = editingTrans[rowKey]?.en ?? item.en;
      
      const hasHy = !!hyVal.trim();
      const hasEn = !!enVal.trim();
      if (hasHy) filledHy++;
      if (hasEn) filledEn++;
      if (!hasHy && !hasEn) missingBoth++;
      if (!hasHy || !hasEn) missingAny++;
      if (item.isCustom) totalCustom++;
    });

    const percentHy = totalKeys > 0 ? Math.round((filledHy / totalKeys) * 100) : 0;
    const percentEn = totalKeys > 0 ? Math.round((filledEn / totalKeys) * 100) : 0;

    return {
      totalKeys,
      filledHy,
      filledEn,
      missingBoth,
      missingAny,
      percentHy,
      percentEn,
      totalCustom
    };
  }, [allTranslationsList, editingTrans]);

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

  // AI and bulk translation helpers
  const translateText = async (text: string, sourceLang: 'hy' | 'en', targetLang: 'hy' | 'en'): Promise<string> => {
    if (!text.trim()) return '';
    try {
      const sl = sourceLang === 'hy' ? 'hy' : 'en';
      const tl = targetLang === 'hy' ? 'hy' : 'en';
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      if (data && data[0]) {
        return data[0].map((x: any) => x[0]).join('');
      }
      return '';
    } catch (err) {
      console.error('Translation error:', err);
      throw err;
    }
  };

  const handleAutoTranslateRow = async (section: string, key: string, fromLang: 'hy' | 'en', toLang: 'hy' | 'en') => {
    const rowKey = `${section}::${key}`;
    const item = allTranslationsList.find(x => x.section === section && x.key === key);
    if (!item) return;

    // Get current value of source language
    const currentSrcVal = editingTrans[rowKey]?.[fromLang] ?? item[fromLang];
    if (!currentSrcVal.trim()) {
      alert('Սկզբնաղբյուր տեքստը դատարկ է:');
      return;
    }

    setTranslatingKeys(prev => ({ ...prev, [rowKey]: true }));
    try {
      const translated = await translateText(currentSrcVal, fromLang, toLang);
      if (translated) {
        setEditingTrans(prev => ({
          ...prev,
          [rowKey]: {
            hy: prev[rowKey]?.hy ?? item.hy,
            en: prev[rowKey]?.en ?? item.en,
            [toLang]: translated
          }
        }));
      }
    } catch (err) {
      alert('Թարգմանությունը ձախողվեց: Խնդրում ենք փորձել կրկին կամ մուտքագրել ձեռքով:');
    } finally {
      setTranslatingKeys(prev => ({ ...prev, [rowKey]: false }));
    }
  };

  const handleBulkTranslateMissing = async () => {
    const targets = filteredTranslations.filter(item => {
      const rowKey = `${item.section}::${item.key}`;
      const hyVal = editingTrans[rowKey]?.hy ?? item.hy;
      const enVal = editingTrans[rowKey]?.en ?? item.en;
      return (!!hyVal.trim() && !enVal.trim()) || (!hyVal.trim() && !!enVal.trim());
    });

    if (targets.length === 0) {
      alert('Ավտոմատ թարգմանության ենթակա (միայն մեկ լեզվով լրացված) տողեր չգտնվեցին:');
      return;
    }

    const confirmMsg = `Գտնվել է ${targets.length} տող, որոնք ունեն թերի թարգմանություն: Ցանկանո՞ւմ եք ավտոմատ թարգմանել բոլորը (օգտագործելով Google Translate):`;
    if (!confirm(confirmMsg)) return;

    setIsTranslatingBulk(true);
    let successCount = 0;
    
    for (const item of targets) {
      const rowKey = `${item.section}::${item.key}`;
      const hyVal = editingTrans[rowKey]?.hy ?? item.hy;
      const enVal = editingTrans[rowKey]?.en ?? item.en;

      try {
        if (hyVal.trim() && !enVal.trim()) {
          const translated = await translateText(hyVal, 'hy', 'en');
          if (translated) {
            setEditingTrans(prev => ({
              ...prev,
              [rowKey]: {
                hy: prev[rowKey]?.hy ?? item.hy,
                en: translated
              }
            }));
            successCount++;
          }
        } else if (!hyVal.trim() && enVal.trim()) {
          const translated = await translateText(enVal, 'en', 'hy');
          if (translated) {
            setEditingTrans(prev => ({
              ...prev,
              [rowKey]: {
                hy: translated,
                en: prev[rowKey]?.en ?? item.en
              }
            }));
            successCount++;
          }
        }
      } catch (e) {
        console.error(`Failed to translate row ${rowKey}:`, e);
      }
      
      await new Promise(r => setTimeout(r, 80));
    }

    setIsTranslatingBulk(false);
    alert(`Հաջողությամբ թարգմանվեց ${successCount} / ${targets.length} դաշտ: Մի մոռացեք պահպանել փոփոխությունները:`);
  };

  const handleSaveAllTranslations = async () => {
    if (!token) return;

    const changedKeys = Object.keys(editingTrans);
    if (changedKeys.length === 0) {
      alert('Փոփոխված թարգմանություններ չկան:');
      return;
    }

    const confirmMsg = `Ցանկանո՞ւմ եք պահպանել բոլոր ${changedKeys.length} փոփոխությունները միանգամից:`;
    if (!confirm(confirmMsg)) return;

    setIsSavingAllTrans(true);

    const updated = {
      hy: { ...dynamicTranslations.hy },
      en: { ...dynamicTranslations.en }
    };

    for (const rowKey of changedKeys) {
      const [section, key] = rowKey.split('::');
      const edits = editingTrans[rowKey];
      if (!updated.hy[section]) updated.hy[section] = {};
      if (!updated.en[section]) updated.en[section] = {};

      updated.hy[section][key] = edits.hy;
      updated.en[section][key] = edits.en;
    }

    try {
      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setDynamicTranslations(updated);
        setEditingTrans({});
        alert('Բոլոր փոփոխությունները հաջողությամբ պահպանվեցին։');
      } else {
        const data = await res.json();
        alert('Սխալ՝ ' + data.error);
      }
    } catch (err) {
      alert('Չհաջողվեց պահպանել թարգմանությունները։');
    } finally {
      setIsSavingAllTrans(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      hy: {},
      en: {}
    } as any;

    allTranslationsList.forEach(item => {
      if (!exportData.hy[item.section]) exportData.hy[item.section] = {};
      if (!exportData.en[item.section]) exportData.en[item.section] = {};

      exportData.hy[item.section][item.key] = item.hy;
      exportData.en[item.section][item.key] = item.en;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `translations_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.hy || !parsed.en) {
        alert('Սխալ JSON ձևաչափ. Պետք է պարունակի "hy" և "en" դաշտեր:');
        return;
      }

      const updated = {
        hy: importMode === 'replace' ? {} : { ...dynamicTranslations.hy },
        en: importMode === 'replace' ? {} : { ...dynamicTranslations.en }
      } as any;

      for (const section in parsed.hy) {
        if (!updated.hy[section]) updated.hy[section] = {};
        for (const key in parsed.hy[section]) {
          updated.hy[section][key] = parsed.hy[section][key];
        }
      }

      for (const section in parsed.en) {
        if (!updated.en[section]) updated.en[section] = {};
        for (const key in parsed.en[section]) {
          updated.en[section][key] = parsed.en[section][key];
        }
      }

      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        setDynamicTranslations(updated);
        setShowImportModal(false);
        setImportJsonText('');
        alert('Թարգմանությունները հաջողությամբ ներմուծվեցին։');
      } else {
        const data = await res.json();
        alert('Ներմուծումը ձախողվեց՝ ' + data.error);
      }
    } catch (e: any) {
      alert('Անվավեր JSON: ' + e.message);
    }
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setImportJsonText(result);
      }
    };
    reader.readAsText(file);
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
              data-thickness="3px"
            data-font-size="14pt" />

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
              data-thickness="3px"
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
        .tooltip-left {
          position: absolute;
          left: 100% !important;
          top: 50% !important;
          bottom: auto !important;
          transform: translateY(-50%) translateX(0px) !important;
          opacity: 0;
          visibility: hidden;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        .tooltip-left::after {
          content: '' !important;
          position: absolute;
          right: 100% !important;
          top: 50% !important;
          left: auto !important;
          transform: translateY(-50%) !important;
          width: 0;
          height: 0;
          border-top: 6px solid transparent !important;
          border-bottom: 6px solid transparent !important;
          border-right: 6px solid rgba(8, 63, 57, 0.95) !important;
          border-left: none !important;
        }
        .nav-btn:hover .tooltip-left {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(-50%) translateX(10px) !important;
        }
        .tooltip-right {
          position: absolute;
          right: 100% !important;
          top: 50% !important;
          bottom: auto !important;
          left: auto !important;
          transform: translateY(-50%) translateX(0px) !important;
          opacity: 0;
          visibility: hidden;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        .tooltip-right::after {
          content: '' !important;
          position: absolute;
          left: 100% !important;
          top: 50% !important;
          right: auto !important;
          transform: translateY(-50%) !important;
          width: 0;
          height: 0;
          border-top: 6px solid transparent !important;
          border-bottom: 6px solid transparent !important;
          border-left: 6px solid rgba(8, 63, 57, 0.95) !important;
          border-right: none !important;
        }
        .nav-btn:hover .tooltip-right {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(-50%) translateX(-10px) !important;
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
      <div className="admin-main-container" style={{ maxWidth: '1500px', margin: '40px auto 0', padding: '0 40px' }}>
        {loadingData ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <LoadingAnimation fullPage={false} message="Բեռնվում է..." />
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
                    data-thickness="3px"
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
                                  <hd-button data-width="100%" data-height="36px" data-thickness="3px">✏ Բացել WYSIWYG խմբագրիչը</hd-button>
                                </a>
                              </div>
                            </div>
                          )}

                          {drawerType === 'case_edit' && (
                            <form onSubmit={handleSaveCaseDrawer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Վերնագիր*</label>
                                <hd-input value={drawerCaseTitle} onInput={(e: any) => setDrawerCaseTitle(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ենթավերնագիր*</label>
                                <hd-input value={drawerCaseSubtitle} onInput={(e: any) => setDrawerCaseSubtitle(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Հաճախորդ</label>
                                <hd-input value={drawerCaseClient} onInput={(e: any) => setDrawerCaseClient(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Տարի</label>
                                  <hd-input value={drawerCaseYear} onInput={(e: any) => setDrawerCaseYear(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Կատեգորիա</label>
                                  <hd-input value={drawerCaseCategory} onInput={(e: any) => setDrawerCaseCategory(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ֆոնի CSS</label>
                                <hd-input value={drawerCaseBg} onInput={(e: any) => setDrawerCaseBg(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Cover URL</label>
                                <hd-input value={drawerCaseImageUrl} onInput={(e: any) => setDrawerCaseImageUrl(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div style={{ marginTop: '10px' }}>
                                <hd-button type="submit" data-width="100%" data-height="38px" data-thickness="3px">💾 Պահպանել</hd-button>
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
                                    font-weight: 100 900;
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
                              font-weight: 100 900;
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
                                  className="preview-font-container"
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
                                <div className="preview-font-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: `drawer-preview-${drawerFontId}, sans-serif` }}>
                                  <div style={{ fontSize: '12px', opacity: 0.6 }}>12px: Quick brown fox jumps over.</div>
                                  <div style={{ fontSize: '18px', opacity: 0.8 }}>18px: Quick brown fox jumps.</div>
                                  <div style={{ fontSize: '24px' }}>24px: Quick brown fox.</div>
                                </div>
                              </div>

                              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '8px' }}>
                                <a href={`/admin/editor/font/${drawerFontId}`} style={{ textDecoration: 'none' }}>
                                  <hd-button data-width="100%" data-height="36px" data-thickness="3px">✏ Բացել WYSIWYG խմբագրիչը</hd-button>
                                </a>
                              </div>
                            </div>
                          )}

                          {drawerType === 'font_edit' && (
                            <form onSubmit={handleSaveFontDrawer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Անուն (Հայերեն)*</label>
                                <hd-input value={drawerFontNameAm} onInput={(e: any) => setDrawerFontNameAm(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Name (English)*</label>
                                <hd-input value={drawerFontNameEn} onInput={(e: any) => setDrawerFontNameEn(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
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
                                  <hd-input value={drawerFontYear} onInput={(e: any) => setDrawerFontYear(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Հեղինակ</label>
                                <hd-input value={drawerFontCreator} onInput={(e: any) => setDrawerFontCreator(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Ֆայլի հղում</label>
                                <hd-input value={drawerFontFileUrl} onInput={(e: any) => setDrawerFontFileUrl(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
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
                                    <hd-input value={drawerFontPrice} onInput={(e: any) => setDrawerFontPrice(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Գնման հղում</label>
                                    <hd-input value={drawerFontPurchaseUrl} onInput={(e: any) => setDrawerFontPurchaseUrl(e.target.value)} data-width="100%" data-height="36px" data-font-size="14pt" />
                                  </div>
                                </div>
                              )}

                              <div style={{ marginTop: '10px' }}>
                                <hd-button type="submit" data-width="100%" data-height="38px" data-thickness="3px">💾 Պահպանել</hd-button>
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

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 3: MESSAGES INBOX
                ══════════════════════════════════════════════════════════════════════════ */}

            {activeTab === 'messages' && (() => {
              const unreadInboxCount = messages.filter(m => !m.read && !m.spam && !m.trash).length;
              const unreadSpamCount = messages.filter(m => !m.read && m.spam && !m.trash).length;
              const unreadTrashCount = messages.filter(m => !m.read && m.trash).length;

              const filteredMails = messages.filter(msg => {
                if (selectedMailFolder === 'inbox') return !msg.spam && !msg.trash;
                if (selectedMailFolder === 'starred') return !!msg.starred && !msg.trash;
                if (selectedMailFolder === 'sent') return !!msg.replies && msg.replies.length > 0 && !msg.trash;
                if (selectedMailFolder === 'spam') return !!msg.spam && !msg.trash;
                if (selectedMailFolder === 'trash') return !!msg.trash;
                return true;
              }).filter(msg => {
                if (!mailSearchQuery.trim()) return true;
                const q = mailSearchQuery.toLowerCase();
                return msg.name.toLowerCase().includes(q) || msg.email.toLowerCase().includes(q) || msg.message.toLowerCase().includes(q);
              });

              const allFilteredIds = filteredMails.map(m => m.id!);
              const isAllSelected = filteredMails.length > 0 && filteredMails.every(m => selectedMailIds.includes(m.id!));
              const handleToggleSelectAll = () => {
                if (isAllSelected) {
                  setSelectedMailIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                } else {
                  setSelectedMailIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
                }
              };

              const toolBtnStyle = {
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '28px',
                height: '28px',
                transition: 'background 0.2s'
              };

              return (
                <div className={getTabClass('messages')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Հետադարձ Կապի Նամակներ</h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>Կառավարեք հաճախորդներից ստացված հարցումները, սպամը և պատասխանեք նրանց անմիջապես այստեղից</p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    background: 'var(--panel)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '24px',
                    minHeight: '680px',
                    height: 'calc(100vh - 240px)',
                    maxHeight: '900px',
                    overflow: 'hidden',
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 32px'
                  }}>
                    {/* PANE 1: Folder Navigation Sidebar */}
                    <div style={{
                      width: '230px',
                      borderRight: '1px solid var(--panel-border)',
                      padding: '24px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.01)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', paddingLeft: '12px', marginBottom: '12px' }}>
                          Պանակներ
                        </div>
                        
                        {[
                          { id: 'inbox', name: 'Մուտքային', count: unreadInboxCount, icon: <span className="icon-Mail" style={{ fontSize: '1.2rem' }} /> },
                          { id: 'starred', name: 'Աստղանշված', count: messages.filter(m => m.starred && !m.trash).length, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                          { id: 'sent', name: 'Ուղարկված', count: messages.filter(m => m.replied && !m.trash).length, icon: <span className="icon-North-West-Arrow" style={{ fontSize: '1.2rem' }} /> },
                          { id: 'spam', name: 'Սպամ', count: unreadSpamCount, icon: <span className="icon-Warning" style={{ fontSize: '1.2rem' }} /> },
                          { id: 'trash', name: 'Աղբաման', count: unreadTrashCount, icon: <span className="icon-Trash" style={{ fontSize: '1.2rem' }} /> }
                        ].map(folder => {
                          const isActive = selectedMailFolder === folder.id;
                          return (
                            <div
                              key={folder.id}
                              onClick={() => {
                                setSelectedMailFolder(folder.id as any);
                                setSelectedMessage(null);
                                setSelectedMailIds([]);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                background: isActive ? 'var(--switcher-capsule-bg)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--muted)',
                                fontWeight: isActive ? 600 : 500,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                  e.currentTarget.style.color = '#fff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = 'var(--muted)';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ display: 'flex', opacity: isActive ? 1 : 0.7 }}>{folder.icon}</span>
                                <span>{folder.name}</span>
                              </div>
                              {folder.count > 0 && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  background: folder.id === 'spam' || folder.id === 'trash' ? 'rgba(255,107,107,0.15)' : 'rgba(0,196,159,0.15)',
                                  color: folder.id === 'spam' || folder.id === 'trash' ? '#ff6b6b' : '#00C49F',
                                  padding: '2px 8px',
                                  borderRadius: '20px',
                                  fontWeight: 700
                                }}>
                                  {folder.count}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Signature Editor Section */}
                        <div style={{
                          padding: '14px',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,0.015)',
                          marginTop: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px' }}>ՍՏՈՐԱԳՐՈՒԹՅՈՒՆ</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingSignature(!isEditingSignature)}
                              style={{ background: 'transparent', border: 'none', color: '#00C49F', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                              {isEditingSignature ? 'Չեղարկել' : 'Խմբագրել'}
                            </button>
                          </div>
                          {isEditingSignature ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => insertTagIntoSignature('b')}
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--panel-border)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  title="Թավ (Bold)"
                                >
                                  B
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertTagIntoSignature('i')}
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--panel-border)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontStyle: 'italic',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  title="Շեղ (Italic)"
                                >
                                  I
                                </button>
                              </div>
                              <textarea
                                id="signature-textarea"
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="Գրեք Ձեր ստորագրությունը..."
                                rows={3}
                                style={{
                                  width: '100%',
                                  background: 'rgba(0,0,0,0.2)',
                                  border: '1px solid var(--panel-border)',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                  padding: '8px',
                                  outline: 'none',
                                  resize: 'vertical',
                                  lineHeight: '1.4'
                                }}
                              />
                              <hd-button
                                onClick={handleSaveSignature}
                                disabled={savingSignature}
                                data-width="100%"
                                data-height="30px"
                                data-thickness="2px"
                              >
                                {savingSignature ? 'Պահպանվում է...' : 'Պահպանել'}
                              </hd-button>
                            </div>
                          ) : (
                            <div 
                              dangerouslySetInnerHTML={{
                                __html: signature ? signature.replace(/\n/g, '<br>') : '<span style="font-style: italic; color: var(--muted);">Ստորագրություն չկա</span>'
                              }}
                              style={{
                                fontSize: '0.8rem',
                                color: '#dedede',
                                maxHeight: '80px',
                                overflowY: 'auto',
                                lineHeight: '1.4'
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedMailFolder === 'inbox' && unreadInboxCount > 0 && (
                          <hd-button
                            onClick={handleBulkMarkRead}
                            data-width="100%"
                            data-height="38px"
                            data-color="rgba(0,196,159,0.15)"
                            style={{ color: '#00C49F' }}
                          >
                            ✔ Նշել բոլորը կարդացված
                          </hd-button>
                        )}
                        
                        {selectedMailFolder === 'trash' && messages.some(m => m.trash) && (
                          <hd-button
                            onClick={handleBulkEmptyTrash}
                            data-width="100%"
                            data-height="38px"
                            data-color="rgba(255,107,107,0.15)"
                            style={{ color: '#ff6b6b' }}
                          >
                            🗑 Դատարկել աղբամանը
                          </hd-button>
                        )}
                      </div>
                    </div>

                    {/* PANE 2: Mails List Pane */}
                    <div style={{
                      width: '340px',
                      borderRight: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#f8fafc'
                    }}>
                      {/* Selection Toolbar or Search Header */}
                      {selectedMailIds.length > 0 ? (
                        <div style={{
                          padding: '20px 16px',
                          borderBottom: '1px solid #e2e8f0',
                          background: 'rgba(0,196,159,0.08)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                            <hd-checkbox
                              checked={isAllSelected}
                              onChange={handleToggleSelectAll}
                              data-size="20px"
                              style={{ cursor: 'pointer' }}
                            />
                            <span>Նշված է {selectedMailIds.length}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {selectedMailFolder === 'inbox' && (
                              <button
                                onClick={() => handleBulkAction('read')}
                                style={{ background: 'transparent', border: 'none', color: '#00C49F', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                title="Նշել կարդացված"
                              >
                                ✔
                              </button>
                            )}
                            {selectedMailFolder !== 'trash' ? (
                              <button
                                onClick={() => handleBulkAction('trash')}
                                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                title="Տեղափոխել աղբաման"
                              >
                                🗑
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleBulkAction('restore')}
                                  style={{ background: 'transparent', border: 'none', color: '#00C49F', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                  title="Վերականգնել"
                                >
                                  ↩
                                </button>
                                <button
                                  onClick={() => handleBulkAction('delete')}
                                  style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                  title="Ջնջել ընդմիշտ"
                                >
                                  ❌
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Standard Search bar (no select-all checkbox when none is selected) */
                        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <hd-input
                              placeholder="Փնտրել նամակներ..."
                              value={mailSearchQuery}
                              onInput={(e: any) => setMailSearchQuery(e.target.value)}
                              data-width="100%"
                              data-height="38px"
                              data-thickness="2px"
                              data-text-color="#0f172a"
                              style={{ paddingLeft: '40px' } as any}
                            />
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none', zIndex: 10, color: '#4a5568', display: 'flex' }}>
                              <span className="icon-Search" style={{ fontSize: '1rem' }} />
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Mails Scroll list */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {filteredMails.map(msg => {
                          const isSelected = selectedMessage?.id === msg.id;
                          const isChecked = selectedMailIds.includes(msg.id!);
                          const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '';
                          const isCardHovered = hoveredMailId === msg.id;
                          const shouldShowCheckbox = isCardHovered || isChecked || selectedMailIds.length > 0;
                          
                          return (
                            <div
                              key={msg.id}
                              onClick={(e) => handleSelectMessage(msg, e)}
                              onMouseEnter={() => setHoveredMailId(msg.id!)}
                              onMouseLeave={() => setHoveredMailId(null)}
                              style={{
                                padding: '18px 20px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #e2e8f0',
                                background: isSelected ? '#ffffff' : (isCardHovered ? 'rgba(0,0,0,0.02)' : 'transparent'),
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                position: 'relative',
                                transition: 'background 0.2s ease'
                              }}
                            >
                              {/* Selection checkbox */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginTop: '4px',
                                  opacity: shouldShowCheckbox ? 1 : 0,
                                  pointerEvents: shouldShowCheckbox ? 'auto' : 'none',
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                <hd-checkbox
                                  checked={isChecked}
                                  onChange={(e: any) => {
                                    const checked = e.target.checked;
                                    setSelectedMailIds(prev => {
                                      if (checked) {
                                        lastSelectedIdRef.current = msg.id!;
                                        return [...prev, msg.id!];
                                      } else {
                                        return prev.filter(x => x !== msg.id!);
                                      }
                                    });
                                  }}
                                  data-size="20px"
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>

                              {/* Unread dot */}
                              {!msg.read && (
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#00C49F',
                                  position: 'absolute',
                                  left: '4px',
                                  top: '24px',
                                  boxShadow: '0 0 8px #00C49F'
                                }} />
                              )}

                              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{
                                    fontWeight: !msg.read ? 700 : 500,
                                    fontSize: '0.95rem',
                                    color: isSelected ? '#00c49f' : '#000000',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '180px'
                                  }}>
                                    {msg.name}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {dateStr}
                                  </span>
                                </div>

                                <div style={{
                                  fontSize: '0.8rem',
                                  color: '#00C49F',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {msg.email}
                                </div>

                                <p style={{
                                  margin: 0,
                                  fontSize: '0.85rem',
                                  color: '#475569',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.4',
                                  opacity: isSelected ? 0.95 : 0.75
                                }}>
                                  {msg.message}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {msg.replied && (
                                      <span style={{ display: 'flex', color: '#00C49F' }} title="Պատասխանված է">
                                        <span className="icon-Check" style={{ fontSize: '0.85rem' }} />
                                      </span>
                                    )}
                                    {msg.replies && msg.replies.length > 0 && (
                                      <span style={{ fontSize: '0.75rem', color: '#00C49F', background: 'rgba(0,196,159,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                        {msg.replies.length} նամակ
                                      </span>
                                    )}
                                  </div>

                                  {/* Star icon toggle */}
                                  <div 
                                    onClick={(e) => handleToggleStar(msg, e)}
                                    style={{
                                      display: 'flex',
                                      padding: '4px',
                                      cursor: 'pointer',
                                      color: msg.starred ? '#FFBB28' : 'var(--muted)',
                                      opacity: msg.starred ? 1 : 0.4,
                                      transition: 'opacity 0.2s, transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => {
                                      if (!msg.starred) e.currentTarget.style.opacity = '0.4';
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={msg.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredMails.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: '0.9rem' }}>
                            Նամակներ չեն գտնվել
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PANE 3: Mail Details Preview Pane */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#ffffff',
                      maxHeight: '100%',
                      overflowY: 'auto'
                    }}>
                      {selectedMessage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          {/* Detail Header & Toolbar */}
                          <div style={{
                            padding: '24px 30px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              {/* Avatar */}
                              <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '50%',
                                background: `hsl(${(selectedMessage.name.charCodeAt(0) * 15) % 360}, 60%, 40%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '1.2rem',
                                color: '#fff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}>
                                {selectedMessage.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{selectedMessage.name}</div>
                                <a
                                  href={`mailto:${selectedMessage.email}`}
                                  style={{ fontSize: '0.85rem', color: '#00C49F', textDecoration: 'underline' }}
                                >
                                  {selectedMessage.email}
                                </a>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '8px' }}>
                                {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ''}
                              </span>

                              {/* Actions toolbar */}
                              <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px' }}>
                                <button
                                  onClick={() => handleToggleStar(selectedMessage)}
                                  style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '6px',
                                    color: selectedMessage.starred ? '#FFBB28' : '#64748b'
                                  }}
                                  title={selectedMessage.starred ? 'Ապաաստղանշել' : 'Աստղանշել'}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill={selectedMessage.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </button>

                                <button
                                  onClick={() => handleToggleSpam(selectedMessage)}
                                  style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '6px',
                                    color: selectedMessage.spam ? '#ff6b6b' : '#64748b'
                                  }}
                                  title={selectedMessage.spam ? 'Ոչ Սպամ' : 'Սպամ'}
                                >
                                  <span className="icon-Warning" style={{ fontSize: '1.2rem' }} />
                                </button>

                                <button
                                  onClick={() => handleToggleTrash(selectedMessage)}
                                  style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '6px',
                                    color: selectedMessage.trash ? '#00C49F' : '#64748b'
                                  }}
                                  title={selectedMessage.trash ? 'Վերականգնել' : 'Տեղափոխել աղբաման'}
                                >
                                  {selectedMessage.trash ? (
                                    <span className="icon-Chevrolt-Arrow-Left" style={{ fontSize: '1.2rem' }} />
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                  )}
                                </button>

                                {selectedMessage.trash && (
                                  <button
                                    onClick={() => handleDeleteMessage(selectedMessage.id!)}
                                    style={{
                                      background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '6px',
                                      color: '#ff6b6b'
                                    }}
                                    title="Ջնջել ընդմիշտ"
                                  >
                                    <span className="icon-Close" style={{ fontSize: '1.2rem' }} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Detail Content Scroll Area */}
                          <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* Original Message Card (White Document Layout) */}
                            <div style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '16px',
                              padding: '24px',
                              color: '#0f172a',
                              fontSize: '0.95rem',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap',
                              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 32px'
                            }}>
                              {selectedMessage.message}
                            </div>

                            {/* Conversation Replies Thread */}
                            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ height: '1px', background: 'var(--panel-border)', flex: 1 }} />
                                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                                    ՆԱՄԱԿԱԳՐՈՒԹՅԱՆ ՊԱՏՄՈՒԹՅՈՒՆ
                                  </span>
                                  <div style={{ height: '1px', background: 'var(--panel-border)', flex: 1 }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '16px' }}>
                                  {/* Thread timeline vertical line */}
                                  <div style={{
                                    position: 'absolute',
                                    left: '4px',
                                    top: '12px',
                                    bottom: '12px',
                                    width: '1px',
                                    background: 'linear-gradient(to bottom, #00C49F, rgba(0,196,159,0.1))'
                                  }} />

                                  {selectedMessage.replies.map(rep => (
                                    <div
                                      key={rep.id}
                                      style={{
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        position: 'relative',
                                        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 32px'
                                      }}
                                    >
                                      {/* Timeline dot */}
                                      <div style={{
                                        width: '9px',
                                        height: '9px',
                                        borderRadius: '50%',
                                        background: '#00C49F',
                                        position: 'absolute',
                                        left: '-16px',
                                        top: '24px',
                                        boxShadow: '0 0 6px #00C49F'
                                      }} />

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00C49F' }}>Դուք պատասխանել եք</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                          {new Date(rep.sent_at).toLocaleString()}
                                        </span>
                                      </div>
                                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                                        {rep.subject}
                                      </div>
                                      <div 
                                        dangerouslySetInnerHTML={{ __html: rep.message }}
                                        style={{
                                          color: '#334155',
                                          fontSize: '0.9rem',
                                          lineHeight: '1.5',
                                          textAlign: 'left'
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quick Reply Form (White Background layout + Rich Text Editor) */}
                            {!selectedMessage.trash && (
                              <div style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '20px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                marginTop: '20px',
                                boxShadow: 'rgba(0, 0, 0, 0.1) 0px 8px 32px'
                              }}>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="icon-Chevrolt-Arrow-Left" style={{ fontSize: '1.2rem', marginRight: '4px' }} />
                                  Պատասխանել նամակին
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Թեմա</label>
                                  <hd-input
                                    value={replySubject}
                                    onInput={(e: any) => setReplySubject(e.target.value)}
                                    placeholder="Պատասխանի վերնագիրը..."
                                    data-width="100%"
                                    data-height="40px"
                                    data-thickness="2px"
                                    data-text-color="#0f172a"
                                  />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Պատասխան տեքստ (Rich Text)</label>
                                  
                                  {/* Custom Rich Text Editor container */}
                                  <div style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '12px',
                                    background: '#ffffff',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                  }}>
                                    {/* Rich Editor Toolbar */}
                                    <div style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: '6px',
                                      borderBottom: '1px solid #e2e8f0',
                                      padding: '10px 14px',
                                      background: '#f8fafc',
                                      alignItems: 'center'
                                    }}>
                                      {/* Group 1: Undo/Redo */}
                                      <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                        <button type="button" onClick={() => document.execCommand('undo', false)} style={toolBtnStyle} title="Հետարկել (Undo)">↩</button>
                                        <button type="button" onClick={() => document.execCommand('redo', false)} style={toolBtnStyle} title="Կրկնել (Redo)">↪</button>
                                      </div>

                                      {/* Group 2: Format Block */}
                                      <select
                                        onChange={(e) => document.execCommand('formatBlock', false, e.target.value)}
                                        style={{
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '6px',
                                          padding: '4px 6px',
                                          fontSize: '0.8rem',
                                          color: '#334155',
                                          outline: 'none',
                                          cursor: 'pointer'
                                        }}
                                        defaultValue="<p>"
                                      >
                                        <option value="<p>">Տեքստ (Paragraph)</option>
                                        <option value="<h1>">Վերնագիր 1 (H1)</option>
                                        <option value="<h2>">Վերնագիր 2 (H2)</option>
                                        <option value="<h3>">Վերնագիր 3 (H3)</option>
                                        <option value="<blockquote>">Մեջբերում (Quote)</option>
                                      </select>

                                      {/* Group 3: Styles */}
                                      <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                        <button type="button" onClick={() => document.execCommand('bold', false)} style={{ ...toolBtnStyle, fontWeight: 'bold' }} title="Հաստ (Bold)">B</button>
                                        <button type="button" onClick={() => document.execCommand('italic', false)} style={{ ...toolBtnStyle, fontStyle: 'italic' }} title="Շեղ (Italic)">I</button>
                                        <button type="button" onClick={() => document.execCommand('underline', false)} style={{ ...toolBtnStyle, textDecoration: 'underline' }} title="Ընդգծված (Underline)">U</button>
                                        <button type="button" onClick={() => document.execCommand('strikeThrough', false)} style={{ ...toolBtnStyle, textDecoration: 'line-through' }} title="Ջնջված (Strikethrough)">S</button>
                                      </div>

                                      {/* Group 4: Align */}
                                      <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                        <button type="button" onClick={() => document.execCommand('justifyLeft', false)} style={toolBtnStyle} title="Ձախակողմյան (Align Left)">▤</button>
                                        <button type="button" onClick={() => document.execCommand('justifyCenter', false)} style={toolBtnStyle} title="Կենտրոնացված (Align Center)">▥</button>
                                        <button type="button" onClick={() => document.execCommand('justifyRight', false)} style={toolBtnStyle} title="Աջակողմյան (Align Right)">▧</button>
                                      </div>

                                      {/* Group 5: Lists */}
                                      <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                        <button type="button" onClick={() => document.execCommand('insertUnorderedList', false)} style={toolBtnStyle} title="Կետերով ցուակ (Bullet list)">• Ցուցակ</button>
                                        <button type="button" onClick={() => document.execCommand('insertOrderedList', false)} style={toolBtnStyle} title="Թվերով ցուցակ (Numbered list)">1. Ցուցակ</button>
                                      </div>

                                      {/* Group 6: Colors */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid #e2e8f0', paddingRight: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Գույն՝</span>
                                        <input
                                          type="color"
                                          onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                                          style={{
                                            border: 'none',
                                            background: 'transparent',
                                            width: '24px',
                                            height: '24px',
                                            cursor: 'pointer',
                                            padding: 0
                                          }}
                                          title="Տեքստի Գույն (Text Color)"
                                        />
                                      </div>

                                      {/* Group 7: Links & Actions */}
                                      <div style={{ display: 'flex', gap: '2px' }}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const url = window.prompt("Մուտքագրեք հղումը (URL):", "https://");
                                            if (url) document.execCommand('createLink', false, url);
                                          }}
                                          style={toolBtnStyle}
                                          title="Ավելացնել հղում (Link)"
                                        >
                                          🔗
                                        </button>
                                        <button type="button" onClick={() => document.execCommand('unlink', false)} style={toolBtnStyle} title="Ջնջել հղումը (Unlink)">🔗❌</button>
                                        <button type="button" onClick={() => document.execCommand('removeFormat', false)} style={{ ...toolBtnStyle, color: '#ff6b6b' }} title="Մաքրել ձևավորումը (Clear format)">🧹</button>
                                      </div>
                                    </div>

                                    {/* Editor content area */}
                                    <div
                                      key={selectedMessage.id}
                                      contentEditable
                                      onInput={(e: any) => setReplyBody(e.currentTarget.innerHTML)}
                                      dangerouslySetInnerHTML={{ __html: replyBody }}
                                      style={{
                                        minHeight: '180px',
                                        padding: '14px',
                                        background: '#ffffff',
                                        color: '#0f172a',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        textAlign: 'left',
                                        overflowY: 'auto'
                                      }}
                                    />
                                  </div>
                                </div>

                                {replyStatus.text && (
                                  <div style={{
                                    fontSize: '0.85rem',
                                    color: replyStatus.type === 'success' ? '#00C49F' : '#ff6b6b',
                                    background: replyStatus.type === 'success' ? 'rgba(0,196,159,0.1)' : 'rgba(255,107,107,0.1)',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    fontWeight: 500
                                  }}>
                                    {replyStatus.text}
                                  </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                  <hd-button
                                    onClick={() => handleSendReply(selectedMessage)}
                                    disabled={sendingReply}
                                    data-width="180px"
                                    data-height="42px"
                                    data-thickness="3px"
                                  >
                                    {sendingReply ? 'Ուղարկվում է...' : 'Ուղարկել Պատասխան'}
                                  </hd-button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Empty state */
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '16px',
                          color: 'var(--muted)',
                          padding: '40px'
                        }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.015)',
                            border: '1px dashed var(--panel-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--muted)',
                            opacity: 0.6
                          }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>Ընտրեք նամակ կարդալու համար</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <hd-button 
                      onClick={() => setShowImportModal(true)}
                      data-width="170px" 
                      data-height="42px"
                      data-color="rgba(255,255,255,0.06)"
                    >
                      📥 Ներմուծել JSON
                    </hd-button>
                    <hd-button 
                      onClick={handleExportJSON}
                      data-width="170px" 
                      data-height="42px"
                      data-color="rgba(255,255,255,0.06)"
                    >
                      📤 Արտահանել JSON
                    </hd-button>
                    <hd-button 
                      onClick={() => setShowAddTrans(true)}
                      data-width="220px" 
                      data-height="42px"
                      data-thickness="3px"
                    >
                      Ավելացնել Թարգմանություն
                    </hd-button>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>Ընդհանուր Բանալիներ</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>{translationStats.totalKeys}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
                      Համակարգային և ավելացված բոլոր տեքստերը
                    </div>
                  </div>

                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>Հայերեն Լրացվածություն</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: translationStats.percentHy === 100 ? '#00C49F' : '#FFBB28' }}>
                        {translationStats.percentHy}%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        ({translationStats.filledHy} / {translationStats.totalKeys})
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${translationStats.percentHy}%`, height: '100%', background: translationStats.percentHy === 100 ? '#00C49F' : '#FFBB28', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>Անգլերեն Լրացվածություն</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: translationStats.percentEn === 100 ? '#00C49F' : '#FFBB28' }}>
                        {translationStats.percentEn}%
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        ({translationStats.filledEn} / {translationStats.totalKeys})
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${translationStats.percentEn}%`, height: '100%', background: translationStats.percentEn === 100 ? '#00C49F' : '#FFBB28', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ background: 'var(--panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 500 }}>Կարգավորման Կարիք Ունեցող</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: translationStats.missingAny > 0 ? '#ff6b6b' : '#00C49F' }}>
                      {translationStats.missingAny > 0 ? `${translationStats.missingAny} տող` : 'Ամբողջական է'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
                      {translationStats.missingAny > 0 ? 'Որոշ բանալիներ չունեն թարգմանություն' : 'Բոլոր բանալիները թարգմանված են'}
                    </div>
                  </div>
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
                  flexWrap: 'wrap',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ flex: 2, minWidth: '240px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Որոնում</label>
                    <hd-input 
                      placeholder="Որոնել ըստ բանալու կամ թարգմանության տեքստի..."
                      value={transSearch}
                      onInput={(e: any) => { setTransSearch(e.target.value); setVisibleTransCount(50); }}
                      data-width="100%"
                      data-height="40px"
                    data-font-size="14pt" />
                  </div>

                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Բաժին</label>
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

                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Կարգավիճակ</label>
                    <hd-select
                      value={transFilterStatus}
                      onChange={(e: any) => { setTransFilterStatus(e.target.value); setVisibleTransCount(50); }}
                      data-width="100%"
                      data-height="40px"
                    >
                      <span value="all" {...(transFilterStatus === 'all' ? {selected: true} : {})}>Բոլորը</span>
                      <span value="missing" {...(transFilterStatus === 'missing' ? {selected: true} : {})}>Թերի (Լրացման կարիք)</span>
                      <span value="custom" {...(transFilterStatus === 'custom' ? {selected: true} : {})}>Փոփոխվածներ</span>
                    </hd-select>
                  </div>

                  <div style={{ minWidth: '120px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Դիտման ռեժիմ</label>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '3px', height: '40px', alignItems: 'center', gap: '4px' }}>
                      <hd-button
                        onClick={() => setTransViewMode('grid')}
                        data-width="80px"
                        data-height="32px"
                        data-color={transViewMode === 'grid' ? 'rgba(255,255,255,0.08)' : 'transparent'}
                        data-font-size="0.8rem"
                      >
                        Քարտեր
                      </hd-button>
                      <hd-button
                        onClick={() => setTransViewMode('table')}
                        data-width="80px"
                        data-height="32px"
                        data-color={transViewMode === 'table' ? 'rgba(255,255,255,0.08)' : 'transparent'}
                        data-font-size="0.8rem"
                      >
                        Աղյուսակ
                      </hd-button>
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Panel */}
                {(Object.keys(editingTrans).length > 0 || (translationStats.missingAny > 0 && filteredTranslations.length > 0)) && (
                  <div style={{
                    background: 'rgba(0, 196, 159, 0.04)',
                    border: '1px dashed rgba(0, 196, 159, 0.3)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--muted)' }}>
                        {Object.keys(editingTrans).length > 0 ? (
                          <>Առկա են <strong style={{ color: '#00C49F' }}>{Object.keys(editingTrans).length}</strong> չպահպանված տեղական խմբագրումներ։</>
                        ) : (
                          <>Կան թերի լրացված թարգմանության տողեր։</>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {translationStats.missingAny > 0 && (
                        <hd-button
                          onClick={handleBulkTranslateMissing}
                          disabled={isTranslatingBulk}
                          data-color="#FFBB28"
                          data-width="240px"
                          data-height="36px"
                          data-font-size="0.82rem"
                        >
                          {isTranslatingBulk ? '⏳ Թարգմանվում է...' : '🪄 Ավտո-թարգմանել թափուրները'}
                        </hd-button>
                      )}

                      {Object.keys(editingTrans).length > 0 && (
                        <>
                          <hd-button
                            onClick={() => setEditingTrans({})}
                            data-color="#ff6b6b"
                            data-width="120px"
                            data-height="36px"
                            data-font-size="0.82rem"
                          >
                            Չեղարկել բոլորը
                          </hd-button>

                          <hd-button
                            onClick={handleSaveAllTranslations}
                            disabled={isSavingAllTrans}
                            data-color="#00C49F"
                            data-width="220px"
                            data-height="36px"
                            data-font-size="0.82rem"
                          >
                            {isSavingAllTrans ? '💾 Պահպանվում է...' : `💾 Պահպանել բոլորը (${Object.keys(editingTrans).length})`}
                          </hd-button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Translations Grid or Table View */}
                {transViewMode === 'grid' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredTranslations.slice(0, visibleTransCount).map(item => {
                      const rowKey = `${item.section}::${item.key}`;
                      const hasLocalEdits = editingTrans[rowKey] !== undefined && (
                        editingTrans[rowKey].hy !== item.hy || editingTrans[rowKey].en !== item.en
                      );
                      const isTranslating = translatingKeys[rowKey];
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
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text)' }}>
                                {item.key}
                              </span>
                              <hd-button 
                                onClick={() => {
                                  navigator.clipboard.writeText(item.key);
                                  alert('Բանալին պատճենվեց հիշողության մեջ:');
                                }}
                                data-color="transparent"
                                data-width="32px"
                                data-height="24px"
                                data-font-size="0.75rem"
                                title="Պատճենել բանալին"
                              >
                                📋
                              </hd-button>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Հայերեն (Armenian)</label>
                                <hd-button 
                                  onClick={() => handleAutoTranslateRow(item.section, item.key, 'en', 'hy')}
                                  disabled={isTranslating}
                                  data-color="rgba(255,255,255,0.03)"
                                  data-width="210px"
                                  data-height="28px"
                                  data-font-size="0.7rem"
                                >
                                  {isTranslating ? '⏳ Թարգմանվում է...' : '🪄 Ավտո-թարգմանել անգլերենից'}
                                </hd-button>
                              </div>
                              <hd-textarea
                                value={editingTrans[rowKey]?.hy ?? item.hy}
                                onInput={(e: any) => handleEditRow(item.section, item.key, 'hy', e.target.value)}
                                data-width="100%"
                                data-disable-horizontal-resize="true"
                                style={{ minHeight: '60px' }}
                              data-font-size="14pt" data-height="200pt" />
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                                {(editingTrans[rowKey]?.hy ?? item.hy).length} նիշ
                              </div>
                            </div>
                            
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Անգլերեն (English)</label>
                                <hd-button 
                                  onClick={() => handleAutoTranslateRow(item.section, item.key, 'hy', 'en')}
                                  disabled={isTranslating}
                                  data-color="rgba(255,255,255,0.03)"
                                  data-width="210px"
                                  data-height="28px"
                                  data-font-size="0.7rem"
                                >
                                  {isTranslating ? '⏳ Translating...' : '🪄 Auto-translate from Armenian'}
                                </hd-button>
                              </div>
                              <hd-textarea
                                value={editingTrans[rowKey]?.en ?? item.en}
                                onInput={(e: any) => handleEditRow(item.section, item.key, 'en', e.target.value)}
                                data-width="100%"
                                data-disable-horizontal-resize="true"
                                style={{ minHeight: '60px' }}
                              data-font-size="14pt" data-height="200pt" />
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                                {(editingTrans[rowKey]?.en ?? item.en).length} chars
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
                            {(item.isCustom || hasLocalEdits) && (
                              <hd-button
                                onClick={() => {
                                  if (hasLocalEdits) {
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
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '16px', background: 'var(--panel)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--muted)', width: '22%' }}>Բաժին / Բանալի</th>
                          <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--muted)', width: '35%' }}>Հայերեն (Armenian)</th>
                          <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--muted)', width: '35%' }}>Անգլերեն (English)</th>
                          <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--muted)', width: '8%', textAlign: 'right' }}>Գործողություններ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTranslations.slice(0, visibleTransCount).map(item => {
                          const rowKey = `${item.section}::${item.key}`;
                          const hasLocalEdits = editingTrans[rowKey] !== undefined && (
                            editingTrans[rowKey].hy !== item.hy || editingTrans[rowKey].en !== item.en
                          );
                          const isTranslating = translatingKeys[rowKey];
                          return (
                            <tr key={rowKey} style={{ borderBottom: '1px solid var(--panel-border)', transition: 'background 0.2s', background: hasLocalEdits ? 'rgba(0, 196, 159, 0.02)' : 'transparent' }}>
                              <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                <span style={{ 
                                  background: 'rgba(0,196,159,0.08)', 
                                  border: '1px solid rgba(0,196,159,0.15)', 
                                  color: '#00C49F',
                                  padding: '2px 6px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.7rem', 
                                  fontWeight: 700,
                                  display: 'inline-block',
                                  marginBottom: '6px'
                                }}>
                                  {item.section}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: 'var(--text)' }}>
                                    {item.key}
                                  </span>
                                  <hd-button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.key);
                                      alert('Բանալին պատճենվեց:');
                                    }}
                                    data-color="transparent"
                                    data-width="28px"
                                    data-height="24px"
                                    title="Պատճենել բանալին"
                                  >
                                    📋
                                  </hd-button>
                                </div>
                                {item.isCustom ? (
                                  <span style={{ fontSize: '0.65rem', color: '#FFBB28', marginTop: '4px', display: 'inline-block' }}>● Փոփոխված</span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '4px', display: 'inline-block' }}>● Համակարգային</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                  <hd-textarea
                                    value={editingTrans[rowKey]?.hy ?? item.hy}
                                    onInput={(e: any) => handleEditRow(item.section, item.key, 'hy', e.target.value)}
                                    data-width="100%"
                                    data-disable-horizontal-resize="true"
                                    data-height="60px"
                                    data-font-size="14pt"
                                  />
                                  <hd-button
                                    onClick={() => handleAutoTranslateRow(item.section, item.key, 'en', 'hy')}
                                    disabled={isTranslating}
                                    title="Թարգմանել Անգլերենից"
                                    data-color="transparent"
                                    data-width="32px"
                                    data-height="32px"
                                    style={{
                                      position: 'absolute',
                                      right: '8px',
                                      zIndex: 2
                                    }}
                                  >
                                    {isTranslating ? '⏳' : '🪄'}
                                  </hd-button>
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                                  {(editingTrans[rowKey]?.hy ?? item.hy).length} նիշ
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                  <hd-textarea
                                    value={editingTrans[rowKey]?.en ?? item.en}
                                    onInput={(e: any) => handleEditRow(item.section, item.key, 'en', e.target.value)}
                                    data-width="100%"
                                    data-disable-horizontal-resize="true"
                                    data-height="60px"
                                    data-font-size="14pt"
                                  />
                                  <hd-button
                                    onClick={() => handleAutoTranslateRow(item.section, item.key, 'hy', 'en')}
                                    disabled={isTranslating}
                                    title="Translate from Armenian"
                                    data-color="transparent"
                                    data-width="32px"
                                    data-height="32px"
                                    style={{
                                      position: 'absolute',
                                      right: '8px',
                                      zIndex: 2
                                    }}
                                  >
                                    {isTranslating ? '⏳' : '🪄'}
                                  </hd-button>
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'right' }}>
                                  {(editingTrans[rowKey]?.en ?? item.en).length} chars
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  {hasLocalEdits && (
                                    <hd-button
                                      onClick={() => {
                                        setEditingTrans(prev => {
                                          const next = { ...prev };
                                          delete next[rowKey];
                                          return next;
                                        });
                                      }}
                                      title="Չեղարկել փոփոխությունները"
                                      data-color="#ff6b6b"
                                      data-width="36px"
                                      data-height="30px"
                                      data-font-size="0.82rem"
                                    >
                                      ↩
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
                                    title="Պահպանել տողը"
                                    data-color={hasLocalEdits ? '#00C49F' : 'rgba(255,255,255,0.03)'}
                                    data-width="36px"
                                    data-height="30px"
                                    data-font-size="0.82rem"
                                  >
                                    💾
                                  </hd-button>
                                  {item.isCustom && !hasLocalEdits && (
                                    <hd-button
                                      onClick={() => handleDeleteTranslation(item.section, item.key)}
                                      title="Ջնջել թարգմանությունը"
                                      data-color="#ff6b6b"
                                      data-width="36px"
                                      data-height="30px"
                                      data-font-size="0.82rem"
                                    >
                                      🗑️
                                    </hd-button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

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
                              data-font-size="14pt" />
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
                          data-font-size="14pt" />
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
                          data-font-size="14pt" data-height="200pt" />
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
                          data-font-size="14pt" data-height="200pt" />
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
                            data-thickness="3px"
                          >
                            Ավելացնել
                          </hd-button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Import JSON Modal */}
                {showImportModal && (
                  <div 
                    onClick={() => { setShowImportModal(false); setImportJsonText(''); }}
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
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Ներմուծել Թարգմանություններ (JSON)</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                          Վերբեռնեք կամ տեղադրեք JSON ֆայլը՝ թարգմանությունները թարմացնելու համար։
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* File Upload Input */}
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Ընտրել Ֆայլ (.json)</label>
                          <input 
                            type="file" 
                            accept=".json"
                            onChange={handleJsonFileChange}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--panel-border)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          />
                        </div>

                        {/* Paste area */}
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Կամ Տեղադրել JSON Տեքստը</label>
                          <hd-textarea
                            placeholder='{"hy": { "common": { "app_title": "HDesign" } }, "en": { ... }}'
                            value={importJsonText}
                            onInput={(e: any) => setImportJsonText(e.target.value)}
                            data-width="100%"
                            data-disable-horizontal-resize="true"
                            data-height="140px"
                            data-font-size="12pt"
                          />
                        </div>

                        {/* Import mode */}
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Միացման Ռեժիմ</label>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }}>
                              <hd-radio 
                                name="importMode" 
                                checked={importMode === 'merge'} 
                                onChange={() => setImportMode('merge')} 
                              />
                              Միացնել (Merge)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text)', cursor: 'pointer' }}>
                              <hd-radio 
                                name="importMode" 
                                checked={importMode === 'replace'} 
                                onChange={() => setImportMode('replace')} 
                              />
                              Փոխարինել բոլորը (Replace)
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="admin-modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <hd-button 
                          type="button"
                          onClick={() => { setShowImportModal(false); setImportJsonText(''); }}
                          data-color="rgba(255,255,255,0.1)"
                          data-width="120px"
                          data-height="42px"
                        >
                          Չեղարկել
                        </hd-button>
                        <hd-button 
                          type="button"
                          onClick={handleImportJSON}
                          disabled={!importJsonText.trim()}
                          data-width="150px"
                          data-height="42px"
                          data-thickness="3px"
                        >
                          Ներմուծել
                        </hd-button>
                      </div>
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
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="https://your-project.supabase.co"
                          value={apiSettings.supabase_url}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, supabase_url: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        data-font-size="14pt" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Anon Key / Publishable Key*</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="sb_publishable_..."
                          value={apiSettings.supabase_key}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, supabase_key: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        data-font-size="14pt" />
                      </div>
                    </div>
                  </div>

                  {/* SMTP Connection */}
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
                      <span className="icon-Mail" style={{ fontSize: '1.5rem', color: '#ab47bc' }} />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>SMTP Email Connection</h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Կապեք ձեր կայքը SMTP սերվերի հետ՝ նամակներ ուղարկելու համար</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>SMTP Host</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="smtp.example.com"
                          value={apiSettings.smtp_host || ''}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                          autocomplete="off"
                          data-width="100%"
                          data-height="40px"
                          data-font-size="14pt" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>SMTP Port</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="465"
                          value={apiSettings.smtp_port || ''}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
                          autocomplete="off"
                          data-width="100%"
                          data-height="40px"
                          data-font-size="14pt" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>SMTP User (Username/Email)</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="noreply@yourdomain.com"
                          value={apiSettings.smtp_user || ''}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                          autocomplete="off"
                          data-width="100%"
                          data-height="40px"
                          data-font-size="14pt" />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>SMTP Password</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="SMTP Password"
                          value={apiSettings.smtp_pass || ''}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, smtp_pass: e.target.value }))}
                          autocomplete="off"
                          data-width="100%"
                          data-height="40px"
                          data-font-size="14pt" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>SMTP Sender (From Email/Name)</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="noreply@yourdomain.com"
                          value={apiSettings.smtp_from || ''}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, smtp_from: e.target.value }))}
                          autocomplete="off"
                          data-width="100%"
                          data-height="40px"
                          data-font-size="14pt" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '28px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Secure Connection (SSL/TLS)</span>
                        <hd-switch 
                          checked={apiSettings.smtp_secure} 
                          data-thickness="4px"
                          onChange={(e: any) => setApiSettings(prev => ({ ...prev, smtp_secure: e.target.checked }))} 
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
                        data-thickness="4px"
                        onChange={(e: any) => setApiSettings(prev => ({ ...prev, tildo_enabled: e.target.checked }))} 
                      />
                    </div>

                    {apiSettings.tildo_enabled && (
                      <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Tidio Widget ID / Project Key*</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="Ներմուծեք Tidio Widget ID-ն (օրինակ՝ abcd1234efgh5678)..."
                          value={apiSettings.tildo_widget_id}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, tildo_widget_id: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        data-font-size="14pt" />
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
                        data-thickness="4px"
                        onChange={(e: any) => setApiSettings(prev => ({ ...prev, google_analytics_enabled: e.target.checked }))} 
                      />
                    </div>

                    {apiSettings.google_analytics_enabled && (
                      <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Measurement ID (G-ID)*</label>
                        <hd-input 
                          key={isApiUnlocked ? "unlocked" : "locked"}
                          type={isApiUnlocked ? "text" : "password"}
                          placeholder="Ներմուծեք Measurement ID-ն (օրինակ՝ G-XXXXXXXXXX)..."
                          value={apiSettings.google_analytics_id}
                          onInput={(e: any) => setApiSettings(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                          data-width="100%"
                          data-height="40px"
                        data-font-size="14pt" />
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
                      data-thickness="3px"
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
                          data-font-size="14pt" />
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
                          data-font-size="14pt" />
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
                            data-color={newCursorColor}
                            onChange={(e: any) => setNewCursorColor(e.target.value)}
                            data-width="40px"
                            data-height="40px"
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
                            data-thickness="3px"
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
                              data-font-size="14pt" />
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
                              data-font-size="14pt" />
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
                            data-font-size="14pt" data-height="200pt" />
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
                            data-thickness="3px"
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
                          data-font-size="14pt" />
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
                      data-thickness="3px"
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
                            data-thickness="4px"
                            onChange={(e: any) => setUpcomingMode(e.target.checked)} 
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <hd-button 
                            type="submit" 
                            data-thickness="3px"
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
                              data-font-size="14pt" />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Վերնագիր (English)</label>
                              <hd-input 
                                placeholder="Coming Soon..."
                                value={upcomingTitleEn}
                                onInput={(e: any) => setUpcomingTitleEn(e.target.value)}
                                data-width="100%"
                                data-height="36px"
                              data-font-size="14pt" />
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
                            data-font-size="14pt" data-height="200pt" />
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
                            data-font-size="14pt" data-height="200pt" />
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
                              data-font-size="14pt" />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Հեռախոս (Phone)</label>
                              <hd-input 
                                placeholder="+374 99 00 00 00"
                                value={upcomingTel}
                                onInput={(e: any) => setUpcomingTel(e.target.value)}
                                data-width="100%"
                                data-height="36px"
                              data-font-size="14pt" />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <hd-button 
                            type="submit" 
                            data-thickness="3px"
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
                        data-font-size="14pt" />
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
                        data-font-size="14pt" />
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
                        data-font-size="14pt" />
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
                          data-thickness="3px"
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

            {activeTab === 'subscribers' && (
              <div className={getTabClass('subscribers')} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Բաժանորդներ</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>Կառավարեք էլ. հասցեների բաժանորդագրությունները և ուղարկեք նամակներ։</p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        const headers = ["ID", "Email", "Subscription Date"];
                        const rows = subscribers.map(sub => [sub.id, sub.email, new Date(sub.created_at).toLocaleString()]);
                        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                          + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `subscribers_${new Date().toISOString().slice(0,10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #00C49F 0%, #0088FE 100%)',
                        color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px',
                        fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(0, 196, 159, 0.3)'
                      }}
                    >
                      <span className="icon-Notifications" style={{ fontSize: '1rem' }} />
                      Ներբեռնել CSV
                    </button>
                    <button 
                      onClick={() => {
                        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<subscribers>\n';
                        subscribers.forEach(sub => {
                          xmlContent += `  <subscriber>\n`;
                          xmlContent += `    <id>${sub.id}</id>\n`;
                          xmlContent += `    <email>${sub.email}</email>\n`;
                          xmlContent += `    <created_at>${sub.created_at}</created_at>\n`;
                          xmlContent += `  </subscriber>\n`;
                        });
                        xmlContent += '</subscribers>';
                        const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `subscribers_${new Date().toISOString().slice(0,10)}.xml`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #FFBB28 0%, #FF8042 100%)',
                        color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px',
                        fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(255, 187, 40, 0.3)'
                      }}
                    >
                      <span className="icon-Earth" style={{ fontSize: '1rem' }} />
                      Ներբեռնել XML
                    </button>
                  </div>
                </div>

                <div className="personalization-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }}>
                  {/* Left Column: Subscribers List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {subscribers.map(sub => (
                      <div 
                        key={sub.id}
                        style={{
                          background: 'var(--panel)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: '16px',
                          padding: '18px 24px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '20px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>
                            {sub.email}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            Գրանցված է՝ {new Date(sub.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div
                          onClick={() => handleDeleteSubscriber(sub.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '10px',
                            color: '#ff6b6b', width: '38px', height: '38px', fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s'
                          }}
                          title="Ջնջել բաժանորդին"
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                        >
                          <span className="icon-Trash" />
                        </div>
                      </div>
                    ))}

                    {subscribers.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', border: '1px dashed var(--panel-border)', borderRadius: '16px' }}>
                        Բաժանորդների ցուցակը դատարկ է
                      </div>
                    )}
                  </div>

                  {/* Right Column: Compose Email Form (Colorful White Style) */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '24px',
                    padding: '30px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    color: '#2d3748'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 800, 
                      margin: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      background: 'linear-gradient(135deg, #ab47bc 0%, #ec407a 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Ուղարկել Էլ. Նամակ
                    </h3>

                    <p style={{ fontSize: '0.82rem', color: '#718096', margin: 0, lineHeight: 1.5 }}>
                      Գրեք նոր նամակ ձեր բոլոր բաժանորդներին: Կարող եք ավելացնել CC և BCC հասցեներ:
                    </p>

                    <form onSubmit={handleSendEmailCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4a5568' }}>Վերնագիր (Subject) *</label>
                        <hd-input 
                          placeholder="Նամակի վերնագիրը..."
                          value={emailSubject}
                          onInput={(e: any) => setEmailSubject(e.target.value)}
                          data-width="100%"
                          data-height="40px"
                          data-thickness="2px"
                          data-color="#ab47bc"
                          style={{ '--text-color': '#1a202c', '--primary-color': '#ab47bc' } as any}
                        data-font-size="14pt" />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4a5568' }}>CC (Պատճեն)</label>
                          <hd-input 
                            placeholder="cc@example.com"
                            value={emailCc}
                            onInput={(e: any) => setEmailCc(e.target.value)}
                            data-width="100%"
                            data-height="40px"
                            data-thickness="2px"
                            data-color="#0088FE"
                            style={{ '--text-color': '#1a202c', '--primary-color': '#0088FE' } as any}
                          data-font-size="14pt" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4a5568' }}>BCC (Գաղտնի պատճեն)</label>
                          <hd-input 
                            placeholder="bcc@example.com"
                            value={emailBcc}
                            onInput={(e: any) => setEmailBcc(e.target.value)}
                            data-width="100%"
                            data-height="40px"
                            data-thickness="2px"
                            data-color="#FFBB28"
                            style={{ '--text-color': '#1a202c', '--primary-color': '#FFBB28' } as any}
                          data-font-size="14pt" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4a5568' }}>Նամակի Բովանդակություն *</label>
                        <hd-textarea 
                          placeholder="Մուտքագրեք ձեր հաղորդագրությունը այստեղ..."
                          value={emailMessage}
                          onInput={(e: any) => setEmailMessage(e.target.value)}
                          data-width="100%"
                          data-disable-horizontal-resize="true"
                          data-thickness="2px"
                          data-color="#ec407a"
                          style={{ minHeight: '120px', '--text-color': '#1a202c', '--primary-color': '#ec407a' } as any}
                        data-font-size="14pt" data-height="200pt" />
                      </div>

                      {emailStatus.text && (
                        <div style={{
                          fontSize: '0.82rem', 
                          color: emailStatus.type === 'success' ? '#2f855a' : '#c53030', 
                          background: emailStatus.type === 'success' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)',
                          padding: '10px 14px', 
                          borderRadius: '10px', 
                          border: emailStatus.type === 'success' ? '1px solid rgba(72, 187, 120, 0.2)' : '1px solid rgba(245, 101, 101, 0.2)',
                          fontWeight: '600'
                        }}>
                          {emailStatus.text}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <hd-button 
                          type="submit" 
                          data-thickness="3px"
                          data-width="100%"
                          data-height="44px"
                          data-font-size="0.9rem"
                          disabled={sendingEmail}
                          style={{
                            background: 'linear-gradient(135deg, #ab47bc 0%, #ec407a 100%)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(236, 64, 122, 0.35)'
                          }}
                        >
                          {sendingEmail ? 'Ուղարկվում է...' : 'Ուղարկել Նամակը'}
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
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onDragStart={(e) => e.preventDefault()}
        style={{ 
          position: 'fixed',
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          zIndex: 1000,
          border: '1px solid var(--panel-border)',
          userSelect: 'none',
          touchAction: 'none',
          
          // Dynamic layout based on dock state
          flexDirection: dockState === 'bottom' ? 'row' : 'column',
          padding: dockState === 'bottom' ? '0 8px' : '8px 0',
          
          // Positioning
          bottom: dockState === 'bottom' ? '24px' : 'auto',
          left: dockState === 'bottom' ? '50%' : (dockState === 'left' ? '24px' : 'auto'),
          right: dockState === 'right' ? '24px' : 'auto',
          top: dockState === 'bottom' ? 'auto' : '50%',
          
          // Transform & transitions
          transform: dockState === 'bottom' 
            ? `translateX(calc(-50% + ${offsetX}px))` 
            : `translateY(calc(-50% + ${offsetY}px))`,
          
          // Dimensions
          height: dockState === 'bottom' ? '68px' : 'auto',
          width: dockState === 'bottom' ? 'auto' : '68px',
          
          // Snapping visual preview feedback
          boxShadow: snapPreview === 'left' || snapPreview === 'right' || snapPreview === 'center'
            ? '0 0 24px rgba(0, 196, 159, 0.4), rgba(0, 0, 0, 0.1) 0px 8px 32px'
            : 'rgba(0, 0, 0, 0.1) 0px 8px 32px',
          borderColor: snapPreview === 'left' || snapPreview === 'right' || snapPreview === 'center'
            ? '#00C49F'
            : 'var(--panel-border)',
          
          transition: isDragging 
            ? 'none' 
            : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s, border-color 0.3s, box-shadow 0.3s, left 0.3s, right 0.3s, top 0.3s, bottom 0.3s',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('analytics');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Վիճակագրություն
          </div>
        </div>

        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('cases');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Քեյսեր
          </div>
        </div>


        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('messages');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Նամակներ
          </div>
        </div>

        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('subscribers');
          }}
          className="nav-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: activeTab === 'subscribers' ? 'var(--switcher-capsule-bg)' : 'transparent',
            color: activeTab === 'subscribers' ? '#fff' : 'var(--muted)',
            borderRadius: '16px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span className="icon-Notifications" style={{ fontSize: '1.4rem' }} />
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Բաժանորդներ
          </div>
        </div>

        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('translations');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Թարգմանություններ
          </div>
        </div>

        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('apis');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            API-ներ
          </div>
        </div>

        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('personalization');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Անհատականացում
          </div>
        </div>

        <div 
          onClick={() => {
            if (hasDraggedRef.current) return;
            setActiveTab('settings');
          }}
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
          <div className={dockState === 'left' ? "nav-tooltip tooltip-left" : (dockState === 'right' ? "nav-tooltip tooltip-right" : "nav-tooltip")}>
            Կարգավորումներ
          </div>
        </div>
      </nav>

      {/* Dock Snap Preview Indicators */}
      {isDragging && (
        <>
          {/* Left Dock Preview */}
          <div style={{
            position: 'fixed',
            left: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '68px',
            height: '350px',
            borderRadius: '24px',
            border: snapPreview === 'left' ? '2px dashed rgba(0, 196, 159, 0.3)' : '2px dashed rgba(255, 255, 255, 0.05)',
            background: snapPreview === 'left' ? 'rgba(0, 196, 159, 0.04)' : 'transparent',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
            opacity: 0.35,
            zIndex: 999
          }} />

          {/* Right Dock Preview */}
          <div style={{
            position: 'fixed',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '68px',
            height: '350px',
            borderRadius: '24px',
            border: snapPreview === 'right' ? '2px dashed rgba(0, 196, 159, 0.3)' : '2px dashed rgba(255, 255, 255, 0.05)',
            background: snapPreview === 'right' ? 'rgba(0, 196, 159, 0.04)' : 'transparent',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
            opacity: 0.35,
            zIndex: 999
          }} />

          {/* Bottom Dock Preview */}
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '350px',
            height: '68px',
            borderRadius: '24px',
            border: snapPreview === 'center' ? '2px dashed rgba(0, 196, 159, 0.3)' : '2px dashed rgba(255, 255, 255, 0.05)',
            background: snapPreview === 'center' ? 'rgba(0, 196, 159, 0.04)' : 'transparent',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
            opacity: 0.35,
            zIndex: 999
          }} />
        </>
      )}

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
              data-font-size="14pt" />

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
                  data-thickness="3px"
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
