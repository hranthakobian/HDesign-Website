"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ThemeConfig, ThemeSettings, BlockItem, PageSchema, BlockType, BlockDefinition } from '@/lib/themeTypes';
import PersonalizationDrawer from './PersonalizationDrawer';
import PagesManagerDrawer from './PagesManagerDrawer';

// Available Block Library definitions with default configurations
const BUILTIN_BLOCK_TYPES: BlockDefinition[] = [
  {
    type: 'hero',
    name: 'Ստեղծա և Գործնական (Hero)',
    icon: '🚀',
    description: '«ՍՏԵՂԾԱ ԵՒ ԳՈՐԾՆԱԿԱՆ», մեջբերում և ստորագրություն',
    defaultSettings: {
      line1: 'ՍՏԵՂԾԱ',
      line2: 'ԵՒ ԳՈՐԾՆԱԿԱՆ',
      quote: '«Ամեն ոք չի կարող մեծ վարպետ դառնալ, բայց մեծ վարպետը կարող է գալ ամենուրից»',
      signature_url: '/signature.png',
      bg_color: 'transparent',
      animation_direction: 'up',
      animation_duration: '800'
    }
  },
  {
    type: 'container',
    name: 'Կոնտեյներ (Container / Columns)',
    icon: '🔲',
    description: 'Բազմասյուն շրջանակ, որը կարող է պարունակել այլ ներդրված բլոկներ',
    defaultSettings: {
      title: '',
      columns: 2,
      gap: '24px',
      padding: '40px 0',
      bg_color: 'transparent',
      max_width: '1440px',
      align_items: 'stretch'
    }
  },
  {
    type: 'branding',
    name: 'Բրենդինգի Քեյսեր (Branding)',
    icon: '✨',
    description: 'Քեյսերի հորիզոնական շերտ (Pasta, 11..., և այլն)',
    defaultSettings: {
      title: 'ԲՐԵՆԴԻՆԳ',
      title_en: 'Branding',
      bg_color: 'transparent',
      animation_direction: 'up'
    }
  },
  {
    type: 'about',
    name: 'Ստուդիայի Մասին (About)',
    icon: '👤',
    description: 'Հիմնադրի պրոֆիլ (Hrant Hakobyan), կենսագրություն և ստուդիայի ստանդարտներ',
    defaultSettings: {
      title: 'Մասին',
      author_name: 'Հրանտ Հակոբյան',
      author_role: 'Հիմնադիր & Lead Designer',
      image_url: '/profile_hrant.jpg',
      bio: 'Ողջույն, ես Հրանտ Հակոբյանն եմ և Ճարտարապետության և շինարարության Հայաստանի Ազգային Համալսարանի ճարտարապետության ֆակուլտետի 4-րդ կուրսի ուսանող եմ։',
      btn_text: 'Ավելին',
      btn_url: '/about',
      bg_color: 'transparent',
      animation_direction: 'right'
    }
  },
  {
    type: 'works',
    name: 'Այլ Աշխատանքներ (Works)',
    icon: '🎨',
    description: 'Ստուդիայի ընտրված պորտֆոլիո նախագծերի և քեյսերի ցուցադրություն',
    defaultSettings: {
      title: 'Այլ աշխատանքներ',
      title_en: 'Other Works',
      btn_text: 'Ավելի',
      btn_url: '/works',
      bg_color: 'transparent',
      animation_direction: 'up'
    }
  },
  {
    type: 'video',
    name: 'Վիդեո Շնորհանդես (Video)',
    icon: '🎬',
    description: 'HDesign ինտերակտիվ վիդեո նվագարկիչ՝ ձայնի և լիաէկրանի կառավարմամբ',
    defaultSettings: {
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      video_poster: '/brandings/pasta/pasta1.png',
      aspect_ratio: '16/9',
      bg_color: 'transparent',
      padding: '40px 0'
    }
  },
  {
    type: 'playground',
    name: 'Տառատեսակների Խաղահրապարակ (Playground)',
    icon: '🔤',
    description: 'Հայկական տառատեսակների ինտերակտիվ փորձարկիչ (Textarea + Style Controls)',
    defaultSettings: {
      title: 'Փորձարկեք Տառատեսակը',
      sample_text: 'ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖ',
      bg_color: 'transparent'
    }
  },
  {
    type: 'icons',
    name: 'Պատկերակներ (Icons Showcase)',
    icon: '💠',
    description: 'Վեկտորային իկոնկաների հավաքածու (Software, Folders, System)',
    defaultSettings: {
      title: 'Համակարգային Պատկերակներ',
      bg_color: 'transparent'
    }
  },
  {
    type: 'glyphs',
    name: 'Նշաններ և Գլիֆեր (Glyphs)',
    icon: '⚡',
    description: 'Յուրահատուկ տիպոգրաֆիկ գլիֆերի և նշանների ցանց',
    defaultSettings: {
      title: 'Գլիֆեր և Սիմվոլներ',
      bg_color: 'transparent'
    }
  },
  {
    type: 'features',
    name: 'Առանձնահատկություններ (Features)',
    icon: '⭐',
    description: 'Ստուդիայի առավելությունների կամ ծառայությունների 3 սյունակով ցուցադրություն',
    defaultSettings: {
      title: 'Ինչո՞ւ Ընտրել HDesign',
      subtitle: 'Մեր առավելությունները',
      bg_color: 'transparent',
      items: [
        { title: 'Բացառիկ Տիպոգրաֆիկա', desc: 'Մշակված հայկական յուրահատուկ տառատեսակներ', icon: '✍️' },
        { title: 'Հարմարավետ UX/UI', desc: 'Ժամանակակից ինտերակտիվ փորձառություն', icon: '🎯' },
        { title: 'Ճարտարապետական Մոտեցում', desc: 'Ճշգրտություն և մաթեմատիկական համամասնություններ', icon: '📐' }
      ]
    }
  },
  {
    type: 'text',
    name: 'Տեքստային Բլոկ (Text Block)',
    icon: '📝',
    description: 'Ազատ տեքստ, վերնագիր և պարբերություններ',
    defaultSettings: {
      title: 'Տեքստային Բաժին',
      content: 'Այստեղ կարող եք տեղադրել ցանկացած մանրամասն բովանդակություն, նկարագրություն կամ հոդված:',
      bg_color: 'transparent',
      text_align: 'left'
    }
  },
  {
    type: 'gallery',
    name: 'Պատկերասրահ (Gallery)',
    icon: '🖼️',
    description: 'Պատկերների գեղեցիկ ցանց (Grid) խոշորացման հնարավորությամբ',
    defaultSettings: {
      title: 'Մեր Աշխատանքները',
      columns: 3,
      bg_color: 'transparent'
    }
  },
  {
    type: 'contact',
    name: 'Կապի Բաժին (Contact)',
    icon: '📬',
    description: 'Հետադարձ կապի ֆորմա և կոնտակտային տվյալներ',
    defaultSettings: {
      title: 'Կապ Հաստատեք Մեզ Հետ',
      email: 'hrant@hdesign.am',
      tel: '+374 99 000000',
      btn_text: 'Ուղարկել Հաղորդագրություն',
      btn_url: '/contact',
      bg_color: 'transparent'
    }
  },
  {
    type: 'cta',
    name: 'Գործողության Կոչ (Call to Action)',
    icon: '🎯',
    description: 'Ակցենտային բլոկ՝ նախագիծ պատվիրելու հղումով',
    defaultSettings: {
      title: 'Պատրա՞ստ եք սկսել նոր նախագիծ',
      subtitle: 'Եկեք միասին ստեղծենք Ձեր բրենդի հաջորդ պատմությունը',
      btn_text: 'Սկսել Համագործակցությունը',
      btn_url: '/contact',
      bg_color: 'rgba(8, 63, 57, 0.4)'
    }
  },
  {
    type: 'system_status',
    name: 'Համակարգային Սխալ / Կարգավիճակ (System Status)',
    icon: '⚙️',
    description: '404 և 500 էջերի համար նախատեսված հատուկ կարգավիճակի բլոկ',
    defaultSettings: {
      status_code: '404',
      title: 'Էջը Գոյություն Չունի',
      subtitle: 'Ներողություն, բայց Ձեր փնտրած էջը չի գտնվել կամ տեղափոխվել է այլ հասցեով:',
      btn_text: 'Վերադառնալ Գլխավոր Էջ',
      btn_url: '/',
      bg_color: 'transparent'
    }
  },
  {
    type: 'product_details',
    name: 'Ապրանքի Տվյալներ (Product Details)',
    icon: '🏷️',
    description: 'Դինամիկ պրոդուկտների տվյալների քարտ (գին, SKU, հնարավորություններ)',
    defaultSettings: {
      title: 'Ապրանքի Մանրամասներ',
      price: '{{price}}',
      sku: '{{sku}}',
      features: '{{features}}',
      stock_status: '{{stock_status}}',
      bg_color: 'transparent'
    }
  },
  {
    type: 'footer',
    name: 'Ստորոտ (Footer)',
    icon: '📌',
    description: 'Հեղինակային իրավունքներ և արագ հղումներ',
    defaultSettings: {
      copyright: '© 2026 HDesign Studio. Բոլոր իրավունքները պաշտպանված են:',
      links: [
        { label: 'Գլխավոր', url: '/' },
        { label: 'Քեյսեր', url: '/works' },
        { label: 'Մասին', url: '/about' },
        { label: 'Կապ', url: '/contact' }
      ]
    }
  }
];

interface ThemesTabProps {
  initialPageSlug?: string;
  initialActiveDrawer?: 'personalization' | 'pages' | null;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  standaloneMode?: boolean;
  initialSubTab?: 'themes' | 'builder' | 'settings';
}

export default function ThemesTab({
  initialPageSlug = 'index',
  initialActiveDrawer = null,
  onFullscreenChange,
  standaloneMode = false,
  initialSubTab
}: ThemesTabProps = {}) {
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'themes' | 'builder' | 'settings'>(
    initialSubTab || (standaloneMode ? 'builder' : 'themes')
  );
  const [activeFloatingDrawer, setActiveFloatingDrawer] = useState<'personalization' | 'pages' | null>(initialActiveDrawer);

  const prevInitialDrawerRef = useRef(initialActiveDrawer);
  useEffect(() => {
    if (prevInitialDrawerRef.current !== initialActiveDrawer) {
      prevInitialDrawerRef.current = initialActiveDrawer;
      if (initialActiveDrawer) {
        setActiveFloatingDrawer(initialActiveDrawer);
        setActiveSubTab('builder');
      }
    }
  }, [initialActiveDrawer]);
  
  // Data states
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeConfig | null>(null);
  const [selectedThemeForEdit, setSelectedThemeForEdit] = useState<ThemeConfig | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primary_color: '#083f39',
    accent_color: '#14b8a6',
    bg_color: '#ffffff',
    text_color: '#0f172a',
    logo_text: 'HDesign',
    header_sticky: true,
    header_style: 'glass',
    footer_text: '© 2026 HDesign Studio.'
  });

  // Builder states
  const [activePageSlug, setActivePageSlug] = useState(initialPageSlug);
  const [previewInstanceMap, setPreviewInstanceMap] = useState<Record<string, string>>({
    'templates/work': 'pasta',
    'templates/blog': 'first-post',
    'templates/product': 'hdesign-pro-font'
  });
  const [availablePages, setAvailablePages] = useState<PageSchema[]>([]);
  const [pageData, setPageData] = useState<PageSchema>({
    slug: initialPageSlug,
    title: 'Գլխավոր Էջ',
    blocks: []
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedChildBlockId, setSelectedChildBlockId] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<'real' | 'desktop' | 'tablet' | 'mobile'>('real');
  // Live Authentic Site Iframe URL state
  const [iframeUrl, setIframeUrl] = useState<string>(() => {
    if (initialPageSlug === 'index' || !initialPageSlug) return '/?builder=true';
    return `/${initialPageSlug.replace(/^\//, '')}?builder=true`;
  });
  const [currentLiveUrl, setCurrentLiveUrl] = useState<string>(() => {
    if (initialPageSlug === 'index' || !initialPageSlug) return '/?builder=true';
    return `/${initialPageSlug.replace(/^\//, '')}?builder=true`;
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Custom Blocks Library
  const [customBlocks, setCustomBlocks] = useState<BlockDefinition[]>([]);
  const [isCreateBlockModalOpen, setIsCreateBlockModalOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockType, setNewBlockType] = useState('');
  const [newBlockIcon, setNewBlockIcon] = useState('🌟');
  const [newBlockDesc, setNewBlockDesc] = useState('');
  const [creatingBlock, setCreatingBlock] = useState(false);

  // Floating Sidebars states (Floating Panels, z-index 9999)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<'content' | 'button' | 'media' | 'layout' | 'animation' | 'container'>('content');

  // Status & Feedback states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [addBlockDropdownOpen, setAddBlockDropdownOpen] = useState(false);
  const [containerAddDropdownId, setContainerAddDropdownId] = useState<string | null>(null);

  // All available block definitions (Built-in + Custom created)
  const allBlockTypes = useMemo(() => {
    return [...BUILTIN_BLOCK_TYPES, ...customBlocks];
  }, [customBlocks]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initialPageSlug prop only when prop itself changes from outside
  const prevInitialSlugRef = useRef(initialPageSlug);
  useEffect(() => {
    if (prevInitialSlugRef.current !== initialPageSlug) {
      prevInitialSlugRef.current = initialPageSlug;
      if (initialPageSlug) {
        setActivePageSlug(initialPageSlug);
        setActiveSubTab('builder');
      }
    }
  }, [initialPageSlug]);

  const onFullscreenChangeRef = useRef(onFullscreenChange);
  useEffect(() => {
    onFullscreenChangeRef.current = onFullscreenChange;
  }, [onFullscreenChange]);

  // Fullscreen toggle handler with parent notification
  const handleToggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    onFullscreenChangeRef.current?.(next);
  };

  // Reset fullscreen when unmounting ThemesTab
  useEffect(() => {
    return () => {
      onFullscreenChangeRef.current?.(false);
    };
  }, []);

  // Escape key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        onFullscreenChangeRef.current?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // Fetch initial themes & page data & all available pages & custom blocks
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [themesRes, pageRes, pagesListRes, customBlocksRes] = await Promise.all([
        fetch('/api/themes'),
        fetch(`/api/builder/pages?slug=${activePageSlug}`),
        fetch('/api/builder/pages?action=list'),
        fetch('/api/builder/custom-blocks')
      ]);

      const themesJson = await themesRes.json();
      if (themesJson.success) {
        setThemes(themesJson.themes || []);
        setActiveTheme(themesJson.activeTheme || null);
        const currentToEdit = themesJson.activeTheme || themesJson.themes[0];
        setSelectedThemeForEdit(currentToEdit);
        if (currentToEdit?.settings) {
          setThemeSettings(currentToEdit.settings);
        }
      }

      const pagesListJson = await pagesListRes.json();
      if (pagesListJson.success && Array.isArray(pagesListJson.pages)) {
        setAvailablePages(pagesListJson.pages);
      }

      const customBlocksJson = await customBlocksRes.json();
      if (customBlocksJson.success && Array.isArray(customBlocksJson.customBlocks)) {
        setCustomBlocks(customBlocksJson.customBlocks);
      }

      const pageJson = await pageRes.json();
      if (pageJson.success && pageJson.page) {
        setPageData(pageJson.page);
        if (pageJson.page.blocks?.length > 0 && !selectedBlockId) {
          setSelectedBlockId(pageJson.page.blocks[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load themes/pages:', err);
      showToast('Սխալ տվյալների բեռնման ժամանակ', 'error');
    } finally {
      setLoading(false);
    }
  }, [activePageSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Synchronize iframeUrl when activePageSlug changes
  useEffect(() => {
    let targetUrl = '/?builder=true';
    if (activePageSlug === 'templates/work' || activePageSlug === 'works/template') {
      const inst = previewInstanceMap['templates/work'] || 'pasta';
      targetUrl = `/works/${inst}?builder=true`;
    } else if (activePageSlug === 'templates/blog' || activePageSlug === 'blog/template') {
      const inst = previewInstanceMap['templates/blog'] || 'first-post';
      targetUrl = `/blog/${inst}?builder=true`;
    } else if (activePageSlug === 'templates/product' || activePageSlug === 'products/template') {
      const inst = previewInstanceMap['templates/product'] || 'hdesign-pro-font';
      targetUrl = `/products/${inst}?builder=true`;
    } else if (activePageSlug !== 'index' && activePageSlug) {
      targetUrl = `/${activePageSlug.replace(/^\//, '')}?builder=true`;
    }
    setIframeUrl(targetUrl);
    setCurrentLiveUrl(targetUrl);
  }, [activePageSlug, previewInstanceMap]);



  // Currently selected block for inspector (supports page blocks + global header & footer)
  const selectedBlock = useMemo(() => {
    if (selectedBlockId === 'header') {
      return {
        id: 'header',
        type: 'header',
        hidden: false,
        settings: {
          logo_text: themeSettings.logo_text || 'HDesign',
          logo_subtitle: (themeSettings as any).logo_subtitle || 'Հակոբյան',
          logo_url: (themeSettings as any).logo_url || '/logo.png',
          nav_home: (themeSettings as any).nav_home || 'Տուն',
          nav_about: (themeSettings as any).nav_about || 'Մասին',
          nav_works: (themeSettings as any).nav_works || 'Աշխատանքներ',
          nav_fonts: (themeSettings as any).nav_fonts || 'Տառատեսակներ',
          nav_apps: (themeSettings as any).nav_apps || 'Հավելվածներ',
          nav_hdesign: (themeSettings as any).nav_hdesign || 'HDesign',
          nav_contact: (themeSettings as any).nav_contact || 'Կապ',
          header_cta_text: (themeSettings as any).header_cta_text || 'Կապ',
          header_cta_url: (themeSettings as any).header_cta_url || '/contact',
          primary_color: themeSettings.primary_color || '#083f39',
          bg_color: themeSettings.bg_color || '#ffffff'
        }
      } as BlockItem;
    }
    if (selectedBlockId === 'footer') {
      return {
        id: 'footer',
        type: 'footer',
        hidden: false,
        settings: {
          logo_text: themeSettings.logo_text || 'HDesign',
          logo_url: (themeSettings as any).logo_url || '/logo.png',
          footer_desc: (themeSettings as any).footer_desc || 'Ստեղծարար և Գործնական դիզայն լուծումներ: Յուրաքանչյուր ինտերֆեյս ստեղծված է սիրով և մաթեմատիկական ճշգրտությամբ:',
          footer_email: (themeSettings as any).footer_email || 'hrant@hakobian.am',
          footer_tel: (themeSettings as any).footer_tel || '+374 00 000000',
          footer_address: (themeSettings as any).footer_address || 'Երևան, Հայաստան',
          footer_links_title: (themeSettings as any).footer_links_title || 'Հղումներ',
          footer_contact_title: (themeSettings as any).footer_contact_title || 'Կոնտակտներ',
          footer_subscribe_title: (themeSettings as any).footer_subscribe_title || 'Բաժանորդագրվել',
          footer_subscribe_desc: (themeSettings as any).footer_subscribe_desc || 'Միացեք մեր նորություններին՝ առաջինը տեղեկանալու նոր նախագծերի և տառատեսակների մասին:',
          footer_subscribe_btn: (themeSettings as any).footer_subscribe_btn || 'Բաժանորդագրվել',
          footer_text: themeSettings.footer_text || 'Հակոբյան Դիզայն. Բոլոր իրավունքները պաշտպանված են:',
          footer_bg: (themeSettings as any).footer_bg || '#083f39'
        }
      } as BlockItem;
    }
    return pageData.blocks.find(b => b.id === selectedBlockId) || null;
  }, [pageData.blocks, selectedBlockId, themeSettings]);

  // Currently selected child block inside container (if any)
  const selectedChildBlock = useMemo(() => {
    if (!selectedBlock || !selectedChildBlockId || !selectedBlock.children) return null;
    return selectedBlock.children.find(c => c.id === selectedChildBlockId) || null;
  }, [selectedBlock, selectedChildBlockId]);

  // Target item being edited in inspector
  const currentInspectTarget = selectedChildBlock || selectedBlock;

  // Handle iframe load: inspect same-origin location, inject editor-bridge.js, sync block selection
  const handleIframeLoad = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (win && doc) {
        const pathname = win.location.pathname;
        const fullHref = win.location.pathname + win.location.search;
        setCurrentLiveUrl(fullHref);

        // Detect page slug from path
        let detectedSlug = pathname ? pathname.replace(/^\/|\/$/g, '') : '';
        if (!detectedSlug) {
          detectedSlug = 'index';
        }

        // Map dynamic routes to Master Templates
        let masterTemplate: string | null = null;
        let instanceId: string | null = null;

        if (detectedSlug.startsWith('works/') && detectedSlug !== 'works' && detectedSlug !== 'templates/work') {
          masterTemplate = 'templates/work';
          instanceId = detectedSlug.replace(/^works\//, '');
        } else if (detectedSlug.startsWith('blog/') && detectedSlug !== 'blog' && detectedSlug !== 'templates/blog') {
          masterTemplate = 'templates/blog';
          instanceId = detectedSlug.replace(/^blog\//, '');
        } else if (detectedSlug.startsWith('products/') && detectedSlug !== 'products' && detectedSlug !== 'templates/product') {
          masterTemplate = 'templates/product';
          instanceId = detectedSlug.replace(/^products\//, '');
        }

        const iframeSrc = iframe.getAttribute('src') || '';
        if (masterTemplate) {
          if (activePageSlug !== masterTemplate) {
            setActivePageSlug(masterTemplate);
          }
          if (instanceId) {
            setPreviewInstanceMap(prev => ({ ...prev, [masterTemplate!]: instanceId! }));
          }
        } else if (detectedSlug && detectedSlug !== activePageSlug) {
          // Avoid race condition where stale '/' resets an active non-index page
          if (detectedSlug === 'index' && activePageSlug !== 'index' && iframeSrc.includes(activePageSlug)) {
            // Still transitioning to target page, do not reset
          } else {
            setActivePageSlug(detectedSlug);
          }
        }

        // Inject editor-bridge.js if not already present
        if (!doc.getElementById('hd-editor-bridge-script')) {
          const script = doc.createElement('script');
          script.id = 'hd-editor-bridge-script';
          script.src = '/editor-bridge.js';
          doc.head.appendChild(script);
        }

        // Highlight currently selected block
        if (selectedBlockId) {
          win.postMessage({
            type: 'SELECT_BLOCK',
            blockId: selectedBlockId,
            blockType: selectedBlock?.type
          }, '*');
        }
      }
    } catch (err) {
      console.warn('Iframe load inspection:', err);
    }
  }, [activePageSlug, selectedBlockId, selectedBlock]);


  // Handle messages from the iframe (block clicked, inline text edit, page navigation)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'EDITOR_BRIDGE_READY') {
        if (e.data.pathname) {
          let detectedSlug = e.data.pathname.replace(/^\/|\/$/g, '');
          if (!detectedSlug || detectedSlug === 'index') detectedSlug = 'index';
          
          let masterTemplate: string | null = null;
          let instanceId: string | null = null;

          if (detectedSlug.startsWith('works/') && detectedSlug !== 'works' && detectedSlug !== 'templates/work') {
            masterTemplate = 'templates/work';
            instanceId = detectedSlug.replace(/^works\//, '');
          } else if (detectedSlug.startsWith('blog/') && detectedSlug !== 'blog' && detectedSlug !== 'templates/blog') {
            masterTemplate = 'templates/blog';
            instanceId = detectedSlug.replace(/^blog\//, '');
          } else if (detectedSlug.startsWith('products/') && detectedSlug !== 'products' && detectedSlug !== 'templates/product') {
            masterTemplate = 'templates/product';
            instanceId = detectedSlug.replace(/^products\//, '');
          }

          if (masterTemplate) {
            if (activePageSlug !== masterTemplate) {
              setActivePageSlug(masterTemplate);
            }
            if (instanceId) {
              setPreviewInstanceMap(prev => ({ ...prev, [masterTemplate!]: instanceId! }));
            }
          } else if (detectedSlug && detectedSlug !== activePageSlug) {
            setActivePageSlug(detectedSlug);
          }
          setCurrentLiveUrl(e.data.pathname);
        }
        return;
      }

      if (e.data.type === 'NAVIGATE_PAGE' && e.data.url) {
        let clean = e.data.url.split('?')[0].replace(/^\/|\/$/g, '');
        if (!clean) clean = 'index';

        let masterTemplate: string | null = null;
        let instanceId: string | null = null;

        if (clean.startsWith('works/') && clean !== 'works' && clean !== 'templates/work') {
          masterTemplate = 'templates/work';
          instanceId = clean.replace(/^works\//, '');
        } else if (clean.startsWith('blog/') && clean !== 'blog' && clean !== 'templates/blog') {
          masterTemplate = 'templates/blog';
          instanceId = clean.replace(/^blog\//, '');
        } else if (clean.startsWith('products/') && clean !== 'products' && clean !== 'templates/product') {
          masterTemplate = 'templates/product';
          instanceId = clean.replace(/^products\//, '');
        }

        if (masterTemplate) {
          if (activePageSlug !== masterTemplate) {
            setActivePageSlug(masterTemplate);
          }
          if (instanceId) {
            setPreviewInstanceMap(prev => ({ ...prev, [masterTemplate!]: instanceId! }));
          }
        } else if (clean !== activePageSlug) {
          setActivePageSlug(clean);
        }
        setCurrentLiveUrl(e.data.url);
        return;
      }

      if (e.data.type === 'BLOCK_CLICKED' && e.data.blockId) {
        let normId = e.data.blockId;
        if (normId === 'home') normId = 'block-hero';
        else if (normId === 'promo-video') normId = 'block-video';
        else if (normId === 'about') normId = 'block-about';
        else if (normId === 'works') normId = 'block-works';
        else if (normId === 'playground') normId = 'block-playground';
        else if (normId === 'icons') normId = 'block-icons';
        else if (normId === 'glyphs') normId = 'block-glyphs';
        else if (normId === 'branding') normId = 'block-branding';

        setSelectedBlockId(normId);
        setSelectedChildBlockId(null);
        setRightCollapsed(false); // auto-open inspector when a block is clicked
        return;
      }

      if (e.data.type === 'INLINE_TEXT_UPDATED' && e.data.blockId) {
        const { blockId, textContent, tagName } = e.data;
        setPageData(prev => {
          if (!prev || !prev.blocks) return prev;
          return {
            ...prev,
            blocks: prev.blocks.map(b => {
              if (b.id !== blockId) return b;
              const nextSettings = { ...b.settings };
              if (b.type === 'hero') {
                if (tagName === 'h1' || tagName === 'h2') nextSettings.line1 = textContent;
                else if (tagName === 'blockquote') nextSettings.quote = textContent;
                else nextSettings.line2 = textContent;
              } else if (b.type === 'text') {
                if (tagName === 'h2' || tagName === 'h1') nextSettings.title = textContent;
                else nextSettings.content = textContent;
              } else if (b.type === 'about') {
                if (tagName === 'h2') nextSettings.author_name = textContent;
                else nextSettings.bio = textContent;
              } else {
                if (tagName === 'h1' || tagName === 'h2') nextSettings.title = textContent;
                else if (tagName === 'p') nextSettings.subtitle = textContent;
              }
              return { ...b, settings: nextSettings };
            })
          };
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activePageSlug]);

  // Notify iframe when a block is selected or when animations need re-initialization
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SELECT_BLOCK',
        blockId: selectedBlockId,
        blockType: selectedBlock?.type
      }, '*');
      iframeRef.current.contentWindow.postMessage({
        type: 'REINIT_ANIMATIONS'
      }, '*');
    }
  }, [selectedBlockId, selectedBlock]);

  // Activate theme
  const handleActivateTheme = async (themeId: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', themeId })
      });
      const data = await res.json();
      if (data.success) {
        setActiveTheme(data.activeTheme);
        setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === themeId })));
        showToast('Թեման հաջողությամբ ակտիվացվեց');
      } else {
        showToast(data.error || 'Չհաջողվեց ակտիվացնել թեման', 'error');
      }
    } catch (err) {
      showToast('Կապի սխալ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save theme settings
  const handleSaveThemeSettings = async () => {
    if (!selectedThemeForEdit) return;
    try {
      setSaving(true);
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          themeId: selectedThemeForEdit.id,
          settings: themeSettings
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Թեմայի կայանքները պահպանվեցին');
        setActiveTheme(data.activeTheme);
      } else {
        showToast(data.error || 'Սխալ պահպանման ընթացքում', 'error');
      }
    } catch (err) {
      showToast('Կապի սխալ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save builder page layout
  const handleSavePageLayout = async (overridePage?: PageSchema) => {
    const dataToSave = overridePage || pageData;
    try {
      setSaving(true);
      const res = await fetch('/api/builder/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: dataToSave })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Էջի դասավորությունը հաջողությամբ պահպանվեց');
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.location.reload();
        }
      } else {
        showToast(data.error || 'Չհաջողվեց պահպանել էջը', 'error');
      }
    } catch (err) {
      showToast('Կապի սխալ', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop reorder in Layers panel
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(pageData.blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPageData(prev => ({
      ...prev,
      blocks: items
    }));
  };

  // Add block to page
  const handleAddBlock = (type: string) => {
    const blockDef = allBlockTypes.find(b => b.type === type);
    const newBlock: BlockItem = {
      id: `block-${type}-${Date.now()}`,
      type,
      hidden: false,
      settings: blockDef ? JSON.parse(JSON.stringify(blockDef.defaultSettings)) : {},
      children: type === 'container' ? [] : undefined
    };

    setPageData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
    setSelectedBlockId(newBlock.id);
    setSelectedChildBlockId(null);
    setAddBlockDropdownOpen(false);
    showToast(`Բլոկը («${blockDef?.name || type}») ավելացվեց`);
  };

  // Add nested child block inside a container
  const handleAddChildBlock = (containerId: string, childType: string) => {
    const blockDef = allBlockTypes.find(b => b.type === childType);
    const newChild: BlockItem = {
      id: `child-${childType}-${Date.now()}`,
      type: childType,
      hidden: false,
      settings: blockDef ? JSON.parse(JSON.stringify(blockDef.defaultSettings)) : {}
    };

    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id === containerId) {
          return {
            ...b,
            children: [...(b.children || []), newChild]
          };
        }
        return b;
      })
    }));
    setContainerAddDropdownId(null);
    setSelectedBlockId(containerId);
    setSelectedChildBlockId(newChild.id);
    showToast(`Ներդրված բլոկը («${blockDef?.name || childType}») ավելացվեց`);
  };

  // Delete nested child block from container
  const handleDeleteChildBlock = (containerId: string, childId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id === containerId) {
          return {
            ...b,
            children: (b.children || []).filter(c => c.id !== childId)
          };
        }
        return b;
      })
    }));
    if (selectedChildBlockId === childId) {
      setSelectedChildBlockId(null);
    }
    showToast('Ներդրված բլոկը հեռացվեց');
  };

  // Delete block
  const handleDeleteBlock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }));
    if (selectedBlockId === id) {
      const remaining = pageData.blocks.filter(b => b.id !== id);
      setSelectedBlockId(remaining.length > 0 ? remaining[0].id : null);
      setSelectedChildBlockId(null);
    }
    showToast('Բլոկը հեռացվեց');
  };

  // Toggle hide / show block
  const handleToggleHideBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPageData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, hidden: !b.hidden } : b)
    }));
  };

  // Duplicate block
  const handleDuplicateBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const index = pageData.blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    const target = pageData.blocks[index];
    const duplicated: BlockItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: `block-${target.type}-${Date.now()}`
    };

    const newBlocks = [...pageData.blocks];
    newBlocks.splice(index + 1, 0, duplicated);

    setPageData(prev => ({
      ...prev,
      blocks: newBlocks
    }));
    setSelectedBlockId(duplicated.id);
    setSelectedChildBlockId(null);
    showToast('Բլոկը կրկնօրինակվեց');
  };

  // Create new custom block
  const handleCreateCustomBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) {
      showToast('Մուտքագրեք բլոկի անվանումը', 'error');
      return;
    }
    const cleanType = (newBlockType.trim() || newBlockName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');

    try {
      setCreatingBlock(true);
      const res = await fetch('/api/builder/custom-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          blockDef: {
            type: cleanType,
            name: newBlockName.trim(),
            icon: newBlockIcon || '🌟',
            description: newBlockDesc.trim() || 'Օգտատիրոջ կողմից ստեղծված նոր բլոկ'
          }
        })
      });
      const data = await res.json();
      if (data.success && data.createdBlock) {
        setCustomBlocks(prev => [...prev.filter(b => b.type !== cleanType), data.createdBlock]);
        setIsCreateBlockModalOpen(false);
        setNewBlockName('');
        setNewBlockType('');
        setNewBlockDesc('');
        showToast(`Նոր բլոկը («${data.createdBlock.name}») ստեղծվեց:`);
      } else {
        showToast(data.error || 'Սխալ նոր բլոկի ստեղծման ընթացքում', 'error');
      }
    } catch (err) {
      showToast('Կապի սխալ բլոկ ստեղծելիս', 'error');
    } finally {
      setCreatingBlock(false);
    }
  };

  // Update setting for selected block or child block (including global header & footer)
  const handleUpdateSetting = (key: string, value: any) => {
    if (!selectedBlockId) return;

    // 1. Send instant in-place DOM mutation to iframe (60fps live update without reload)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_BLOCK_FIELD',
        blockId: selectedChildBlockId || selectedBlockId,
        key,
        value
      }, '*');
    }

    if (selectedBlockId === 'header' || selectedBlockId === 'footer') {
      const updatedThemeSettings = {
        ...themeSettings,
        [key]: value
      };
      setThemeSettings(updatedThemeSettings);
      if (activeTheme) {
        setActiveTheme({
          ...activeTheme,
          settings: { ...activeTheme.settings, [key]: value }
        });
      }
      fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', themeId: activeTheme?.id || 'default', settings: updatedThemeSettings })
      }).catch(console.error);
      return;
    }

    if (selectedChildBlockId && selectedBlock?.children) {
      setPageData(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id === selectedBlockId) {
            return {
              ...b,
              children: (b.children || []).map(c => {
                if (c.id === selectedChildBlockId) {
                  return {
                    ...c,
                    settings: {
                      ...c.settings,
                      [key]: value
                    }
                  };
                }
                return c;
              })
            };
          }
          return b;
        })
      }));
    } else {
      setPageData(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id === selectedBlockId) {
            return {
              ...b,
              settings: {
                ...b.settings,
                [key]: value
              }
            };
          }
          return b;
        })
      }));
    }
  };

  // Reusable input styling
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#0f172a',
    display: 'block',
    marginBottom: '0.35rem'
  };

  if (!mounted) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Բեռնվում է Թեմաների Վահանակը...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 0, 
      width: '100%', 
      margin: 0, 
      color: '#0f172a',
      background: '#ffffff',
      minHeight: '100vh',
      position: 'relative'
    }}>

      {/* Toast Notification */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999999,
          background: feedback.type === 'success' ? '#10b981' : '#ef4444',
          color: '#ffffff',
          padding: '0.8rem 1.6rem',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
          fontWeight: 600,
          fontSize: '0.92rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <span>{feedback.type === 'success' ? '✓' : '⚠'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header & Subtabs (Hidden when Fullscreen is active) */}
      {!isFullscreen && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          padding: '1.2rem 2rem 0.8rem',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0f172a' }}>
              <span>🎨</span>
              <span>Թեմաներ և Կայքի Կառուցիչ (Site Builder)</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.2rem', fontWeight: 500, margin: 0 }}>
              Next.js Native Dynamic Multi-Theme Engine, 100% Իրական WYSIWYG և Լողացող Փեղկեր
            </p>
          </div>

          {/* Subtab Buttons & Standalone Builder Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                onClick={() => setActiveSubTab('themes')}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeSubTab === 'themes' ? 'var(--primary-color, #083f39)' : 'transparent',
                  color: activeSubTab === 'themes' ? '#ffffff' : '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: activeSubTab === 'themes' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <span>🎭</span> Թեմաներ ({themes.length})
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSubTab('builder')}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeSubTab === 'builder' ? 'var(--primary-color, #083f39)' : 'transparent',
                  color: activeSubTab === 'builder' ? '#ffffff' : '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: activeSubTab === 'builder' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <span>🧱</span> Էջերի Կառուցիչ (Builder)
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('settings')}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: activeSubTab === 'settings' ? 'var(--primary-color, #083f39)' : 'transparent',
                  color: activeSubTab === 'settings' ? '#ffffff' : '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: activeSubTab === 'settings' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <span>⚙️</span> Թեմայի Կայանքներ
              </button>
            </div>

            {standaloneMode ? (
              <a
                href="/admin?tab=themes"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: '1.5px solid #334155',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.15s ease'
                }}
                title="Վերադառնալ Վարիչի Վահանակ (/admin)"
              >
                <span style={{ fontSize: '1rem' }}>←</span>
                <span>Վարիչի Վահանակ</span>
              </a>
            ) : (
              <a
                href={`/builder?slug=${encodeURIComponent(activePageSlug || 'index')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: '#0f172a',
                  color: '#14b8a6',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: '1.5px solid #14b8a6',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.2)',
                  transition: 'all 0.15s ease'
                }}
                title="Բացել Visual Builder-ը որպես առանձին լիարժեք էջ (/builder)"
              >
                <span style={{ fontSize: '1rem' }}>⚡</span>
                <span>Visual Builder (Առանձին Էջով)</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>↗</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 1: THEMES LIST & ACTIVATION
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'themes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
          {activeTheme && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(8, 63, 57, 0.12) 0%, rgba(20, 184, 166, 0.08) 100%)',
              border: '1.5px solid var(--primary-color, #083f39)',
              borderRadius: '16px',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div>
                <span style={{
                  background: 'var(--primary-color, #083f39)',
                  color: '#ffffff',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  ԱԿՏԻՎ ԹԵՄԱ
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.5rem 0 0.2rem 0', color: '#0f172a' }}>
                  {activeTheme.name}
                </h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
                  {activeTheme.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href={`/?theme=${activeTheme.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>↗</span> Դիտել Կայքում
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedThemeForEdit(activeTheme);
                    setThemeSettings(activeTheme.settings || {});
                    setActiveSubTab('settings');
                  }}
                  style={{
                    background: 'var(--primary-color, #083f39)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(8, 63, 57, 0.25)'
                  }}
                >
                  <span>⚙️</span> Խմբագրել Թեմայի Պարամետրերը
                </button>
              </div>
            </div>
          )}

          {/* Themes Grid */}
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.2rem', color: '#0f172a' }}>
              Հասանելի Թեմաների Ցանկ ({themes.length})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {themes.map(theme => {
                const isActive = theme.id === activeTheme?.id;
                return (
                  <div
                    key={theme.id}
                    style={{
                      background: '#ffffff',
                      border: isActive ? '2px solid var(--primary-color, #083f39)' : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: isActive ? '0 8px 30px rgba(8, 63, 57, 0.12)' : '0 2px 10px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isActive && (
                      <span style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'var(--primary-color, #083f39)',
                        color: '#ffffff',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.5px'
                      }}>
                        ԱԿՏԻՎ
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.8rem' }}>
                        {theme.id === 'minimal' ? '🔳' : '🌿'}
                      </span>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{theme.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                          ID: {theme.id} • v{theme.version}
                        </span>
                      </div>
                    </div>

                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.55, flex: 1, marginBottom: '1.25rem' }}>
                      {theme.description}
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {isActive ? (
                        <button
                          type="button"
                          disabled
                          style={{
                            flex: 1,
                            padding: '0.7rem',
                            borderRadius: '8px',
                            border: '1.5px solid var(--primary-color, #083f39)',
                            background: 'rgba(8, 63, 57, 0.08)',
                            color: 'var(--primary-color, #083f39)',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: 'default'
                          }}
                        >
                          ✓ Ակտիվացված է
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivateTheme(theme.id)}
                          disabled={saving}
                          style={{
                            flex: 1,
                            padding: '0.7rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary-color, #083f39)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            boxShadow: '0 2px 8px rgba(8, 63, 57, 0.2)'
                          }}
                        >
                          Ակտիվացնել Թեման
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedThemeForEdit(theme);
                          setThemeSettings(theme.settings || {});
                          setActiveSubTab('settings');
                        }}
                        style={{
                          padding: '0.7rem 1.1rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#f1f5f9',
                          color: '#0f172a',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        Կայանքներ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 2: VISUAL SITE BUILDER (100% AUTHENTIC WHITE CANVAS & FLOATING PANELS)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'builder' && (
        <div style={{
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          right: isFullscreen ? 0 : 'auto',
          bottom: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 999999 : 10,
          width: '100%',
          height: isFullscreen ? '100vh' : standaloneMode ? 'calc(100vh - 72px)' : '820px',
          borderRadius: isFullscreen || standaloneMode ? 0 : '16px',
          border: isFullscreen || standaloneMode ? 'none' : '1px solid #cbd5e1',
          boxShadow: isFullscreen || standaloneMode ? 'none' : '0 10px 30px rgba(0,0,0,0.08)',
          background: '#ffffff',
          overflow: 'hidden'
        }}>
          
          {/* Builder Top Toolbar (Sticky at Top) */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 9998,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
          }}>
            {/* Page selection & Add Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Էջ՝</span>
                <select
                  value={activePageSlug}
                  onChange={(e) => setActivePageSlug(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: 'auto',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderColor: 'var(--primary-color, #083f39)'
                  }}
                >
                  {availablePages.length > 0 ? (
                    availablePages.map(p => (
                      <option key={p.slug} value={p.slug}>
                        {p.title} ({p.slug === 'index' ? '/' : `/${p.slug}`})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="index">Գլխավոր (index)</option>
                      <option value="about">Մասին (about)</option>
                      <option value="works">Քեյսեր (works)</option>
                      <option value="contact">Կապ (contact)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Dynamic Instance Preview Selector (Preview with Instance) */}
              {(activePageSlug === 'templates/work' || activePageSlug === 'templates/blog' || activePageSlug === 'templates/product') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#f8fafc', padding: '3px 8px', borderRadius: '8px', border: '1.5px solid #14b8a6' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#083f39' }}>
                    👁️ Preview with Instance:
                  </span>
                  <select
                    value={previewInstanceMap[activePageSlug] || ''}
                    onChange={(e) => {
                      const newInst = e.target.value;
                      setPreviewInstanceMap(prev => ({ ...prev, [activePageSlug]: newInst }));
                    }}
                    style={{
                      ...inputStyle,
                      width: 'auto',
                      padding: '4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      borderColor: '#cbd5e1'
                    }}
                  >
                    {activePageSlug === 'templates/work' && (
                      <>
                        <option value="pasta">🍝 Pasta (Իտալական ռեստորան)</option>
                        <option value="eleven">📐 11... (Մինիմալիզմ)</option>
                        <option value="posters">🎨 Posters (Պաստառային արվեստ)</option>
                        <option value="teal-lines">🌿 Teal Lines (Էկոլոգիական)</option>
                      </>
                    )}
                    {activePageSlug === 'templates/blog' && (
                      <>
                        <option value="first-post">📝 Visual Page Builder-ի Ճարտարապետությունը</option>
                        <option value="typography-in-armenia">✍️ Հայերեն Տիպոգրաֆիկայի Վերածնունդը</option>
                      </>
                    )}
                    {activePageSlug === 'templates/product' && (
                      <>
                        <option value="hdesign-pro-font">🔤 HDesign Variable Font Pro</option>
                        <option value="brand-identity-pack">📦 Complete Brand Identity UI Kit</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Add Block Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setAddBlockDropdownOpen(prev => !prev)}
                  style={{
                    background: 'var(--primary-color, #083f39)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(8, 63, 57, 0.2)'
                  }}
                >
                  <span>+</span> Ավելացնել Բլոկ
                </button>

                {addBlockDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    zIndex: 999999,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    width: '340px',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                      Ընտրեք Բլոկի Տեսակը ({allBlockTypes.length})
                    </div>
                    {allBlockTypes.map(b => (
                      <div
                        key={b.type}
                        onClick={() => handleAddBlock(b.type)}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{b.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{b.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New Custom Block Button */}
              <button
                type="button"
                onClick={() => setIsCreateBlockModalOpen(true)}
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="Ստեղծել նոր հատուկ բլոկի տեսակ"
              >
                <span>➕</span> Ստեղծել Նոր Բլոկ
              </button>
            </div>

            {/* Viewport switch & Fullscreen & Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3px' }}>
                <button
                  type="button"
                  onClick={() => setViewportMode('real')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: viewportMode === 'real' ? '#ffffff' : 'transparent',
                    color: '#0f172a',
                    fontWeight: viewportMode === 'real' ? 800 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: viewportMode === 'real' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title="Իրական Չափ (100% Real-Size WYSIWYG)"
                >
                  🖥️ Իրական Չափ
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('desktop')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: viewportMode === 'desktop' ? '#ffffff' : 'transparent',
                    color: '#0f172a',
                    fontWeight: viewportMode === 'desktop' ? 800 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: viewportMode === 'desktop' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title="Desktop (1440px)"
                >
                  💻 1440px
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('tablet')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: viewportMode === 'tablet' ? '#ffffff' : 'transparent',
                    color: '#0f172a',
                    fontWeight: viewportMode === 'tablet' ? 800 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: viewportMode === 'tablet' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title="Tablet (768px)"
                >
                  📱 Թաբլեթ
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: viewportMode === 'mobile' ? '#ffffff' : 'transparent',
                    color: '#0f172a',
                    fontWeight: viewportMode === 'mobile' ? 800 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: viewportMode === 'mobile' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  title="Mobile (375px)"
                >
                  📲 Հեռախոս
                </button>
              </div>

              {/* Live Navigation & Address Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '3px 8px'
              }}>
                <button
                  type="button"
                  onClick={() => iframeRef.current?.contentWindow?.history.back()}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#475569', padding: '2px 4px' }}
                  title="Հետ (Back)"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => iframeRef.current?.contentWindow?.history.forward()}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#475569', padding: '2px 4px' }}
                  title="Առաջ (Forward)"
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.location.reload();
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#475569', padding: '2px 4px' }}
                  title="Թարմացնել էջը (Reload)"
                >
                  🔄
                </button>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#0f172a'
                }}>
                  <span style={{ color: '#10b981', fontSize: '0.7rem' }}>●</span>
                  <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentLiveUrl}
                  </span>
                  <a
                    href={currentLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: '#64748b', fontSize: '0.75rem' }}
                    title="Բացել նոր ներդիրում"
                  >
                    ↗
                  </a>
                </div>
              </div>

              {/* Status Indicator */}
              <div style={{ fontSize: '0.76rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(20, 184, 166, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                <span>Live Site Injection</span>
              </div>

              {/* Floating Drawer Trigger: Personalization */}
              <button
                type="button"
                onClick={() => setActiveFloatingDrawer(activeFloatingDrawer === 'personalization' ? null : 'personalization')}
                style={{
                  background: activeFloatingDrawer === 'personalization' ? 'var(--primary-color, #083f39)' : '#f1f5f9',
                  color: activeFloatingDrawer === 'personalization' ? '#ffffff' : '#0f172a',
                  border: activeFloatingDrawer === 'personalization' ? '1.5px solid var(--primary-color, #083f39)' : '1px solid #cbd5e1',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: activeFloatingDrawer === 'personalization' ? '0 0 15px rgba(8, 63, 57, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Բացել Անհատականացման Լողացող Փեղկը"
              >
                <span>🎨</span> <span>Անհատականացում</span>
              </button>

              {/* Floating Drawer Trigger: Pages */}
              <button
                type="button"
                onClick={() => setActiveFloatingDrawer(activeFloatingDrawer === 'pages' ? null : 'pages')}
                style={{
                  background: activeFloatingDrawer === 'pages' ? '#083f39' : '#f1f5f9',
                  color: activeFloatingDrawer === 'pages' ? '#ffffff' : '#0f172a',
                  border: activeFloatingDrawer === 'pages' ? '1.5px solid #083f39' : '1px solid #cbd5e1',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: activeFloatingDrawer === 'pages' ? '0 0 15px rgba(8, 63, 57, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Բացել Էջերի Կառավարման Լողացող Փեղկը"
              >
                <span>📄</span> <span>Էջեր</span>
              </button>


              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                style={{
                  background: isFullscreen ? '#f59e0b' : '#f1f5f9',
                  color: isFullscreen ? '#000000' : '#0f172a',
                  border: isFullscreen ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: isFullscreen ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none'
                }}
                title="Լիաէկրան WYSIWYG ռեժիմ (ESC՝ դուրս գալու համար)"
              >
                <span>{isFullscreen ? '✕' : '⛶'}</span> {isFullscreen ? 'Փակել Լիաէկրանը (ESC)' : 'Լիաէկրան'}
              </button>

              {/* Standalone Builder Page Button or Back to Admin */}
              {standaloneMode ? (
                <a
                  href="/admin?tab=themes"
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #334155',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  title="Վերադառնալ Վարիչի Վահանակ (/admin)"
                >
                  <span style={{ fontSize: '1rem' }}>←</span> <span>Վարիչի Վահանակ</span>
                </a>
              ) : (
                <a
                  href={`/builder?slug=${encodeURIComponent(activePageSlug || 'index')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#0f172a',
                    color: '#14b8a6',
                    border: '1px solid #14b8a6',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(20, 184, 166, 0.2)'
                  }}
                  title="Բացել Visual Builder-ը առանձին լիարժեք էջով (/builder)"
                >
                  <span>⚡</span> <span>Առանձին Էջով</span> <span style={{ fontSize: '0.75rem' }}>↗</span>
                </a>
              )}

              {/* Save layout button */}
              <button
                type="button"
                onClick={() => handleSavePageLayout()}
                disabled={saving}
                style={{
                  background: 'var(--primary-color, #083f39)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.4rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(8, 63, 57, 0.25)'
                }}
              >
                <span>💾</span> {saving ? 'Պահպանվում է...' : 'Պահպանել Էջը'}
              </button>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* FLOATING SIDEBAR 1: LAYERS (ՇԵՐՏԵՐ) PANEL */}
          {/* ────────────────────────────────────────────────────────── */}
          {leftCollapsed ? (
            <div
              onClick={() => setLeftCollapsed(false)}
              style={{
                position: isFullscreen ? 'fixed' : 'absolute',
                left: '20px',
                top: isFullscreen ? '65px' : '70px',
                width: '46px',
                zIndex: 9999,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '14px',
                padding: '1.2rem 0.4rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.2rem',
                cursor: 'pointer',
                minHeight: '320px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.18)'
              }}
              title="Բացել Շերտերը (Layers)"
            >
              <span style={{ fontSize: '1.2rem' }}>📑</span>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontWeight: 800,
                fontSize: '0.82rem',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                letterSpacing: '1px'
              }}>
                ՇԵՐՏԵՐ ({pageData.blocks.length})
              </span>
              <span style={{ marginTop: 'auto', color: 'var(--primary-color, #083f39)', fontWeight: 800, fontSize: '0.9rem' }}>▶</span>
            </div>
          ) : (
            <div style={{
              position: isFullscreen ? 'fixed' : 'absolute',
              left: '20px',
              top: isFullscreen ? '65px' : '70px',
              bottom: isFullscreen ? '24px' : '20px',
              width: '320px',
              zIndex: 9999,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '16px',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              boxShadow: '0 16px 45px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <span>📑</span> Շերտեր (Layers)
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#0f172a', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    {pageData.blocks.length} բլոկ
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeftCollapsed(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontSize: '0.95rem',
                      padding: '2px 4px'
                    }}
                    title="Ծալել Շերտերը"
                  >
                    ◀
                  </button>
                </div>
              </div>

              {/* Pinned Global Header Layer */}
              <div
                onClick={() => {
                  setSelectedBlockId('header');
                  setSelectedChildBlockId(null);
                  setRightCollapsed(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: selectedBlockId === 'header' ? '2px solid var(--primary-color, #083f39)' : '1px solid #cbd5e1',
                  background: selectedBlockId === 'header' ? 'rgba(8, 63, 57, 0.08)' : '#f8fafc',
                  boxShadow: selectedBlockId === 'header' ? '0 0 0 1px var(--primary-color, #083f39)' : 'none',
                  cursor: 'pointer',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🔝</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    Գլխամաս (Header)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Լոգո, մենյու, կարգավորիչներ
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                  GLOBAL
                </span>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="blocks-layers-droppable">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        minHeight: '180px',
                        background: snapshot.isDraggingOver ? 'rgba(8, 63, 57, 0.05)' : 'transparent',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                      }}
                    >
                      {pageData.blocks.map((block, index) => {
                        const isSelected = block.id === selectedBlockId && !selectedChildBlockId;
                        const blockDef = allBlockTypes.find(b => b.type === block.type);
                        const isContainer = block.type === 'container';

                        return (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  borderRadius: '10px',
                                  border: isSelected ? '2px solid var(--primary-color, #083f39)' : '1px solid #cbd5e1',
                                  background: isSelected ? 'rgba(8, 63, 57, 0.08)' : dragSnapshot.isDragging ? 'rgba(20, 184, 166, 0.15)' : '#ffffff',
                                  boxShadow: dragSnapshot.isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
                                  opacity: block.hidden ? 0.5 : 1,
                                  transition: 'all 0.15s ease',
                                  overflow: 'hidden',
                                  ...dragProvided.draggableProps.style
                                }}
                              >
                                {/* Block Row */}
                                <div
                                  onClick={() => {
                                    setSelectedBlockId(block.id);
                                    setSelectedChildBlockId(null);
                                    setRightCollapsed(false);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.65rem 0.85rem',
                                    cursor: 'pointer',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <div {...dragProvided.dragHandleProps} style={{ cursor: 'grab', color: '#94a3b8', padding: '0 4px', fontSize: '1rem' }} title="Քաշեք վեր/վար">
                                    ⋮⋮
                                  </div>
                                  <span style={{ fontSize: '1.1rem' }}>{blockDef?.icon || '🧱'}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {block.settings.title || block.settings.line1 || blockDef?.name || block.type}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {block.type}
                                    </div>
                                  </div>

                                  {/* Action buttons on layer item */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleHideBlock(block.id, e)}
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '3px' }}
                                      title={block.hidden ? "Ցուցադրել" : "Թաքցնել"}
                                    >
                                      {block.hidden ? '👁️‍🗨️' : '👁️'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDuplicateBlock(block.id, e)}
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '3px' }}
                                      title="Կրկնօրինակել"
                                    >
                                      📋
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteBlock(block.id, e)}
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.85rem', padding: '3px' }}
                                      title="Ջնջել"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>

                                {/* Container Nested Children Sub-tree */}
                                {isContainer && (
                                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.4rem 0.6rem 0.6rem 1.4rem', borderTop: '1px dashed #cbd5e1' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-color, #083f39)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span>↳ Ներդրված Բլոկներ ({block.children?.length || 0}):</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setContainerAddDropdownId(containerAddDropdownId === block.id ? null : block.id);
                                        }}
                                        style={{
                                          background: 'var(--primary-color, #083f39)',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '2px 6px',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        + Ավելացնել
                                      </button>
                                    </div>

                                    {/* Child Add Dropdown */}
                                    {containerAddDropdownId === block.id && (
                                      <div style={{
                                        background: '#fff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '4px',
                                        marginBottom: '6px',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                        maxHeight: '180px',
                                        overflowY: 'auto'
                                      }}>
                                        {allBlockTypes.filter(b => b.type !== 'container').map(b => (
                                          <div
                                            key={b.type}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddChildBlock(block.id, b.type);
                                            }}
                                            style={{
                                              padding: '4px 8px',
                                              fontSize: '0.78rem',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              borderRadius: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                          >
                                            <span>{b.icon}</span>
                                            <span>{b.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Child blocks list */}
                                    {block.children && block.children.length > 0 ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {block.children.map(child => {
                                          const isChildSelected = selectedBlockId === block.id && selectedChildBlockId === child.id;
                                          const childDef = allBlockTypes.find(b => b.type === child.type);
                                          return (
                                            <div
                                              key={child.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBlockId(block.id);
                                                setSelectedChildBlockId(child.id);
                                                setRightCollapsed(false);
                                              }}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: isChildSelected ? 'var(--primary-color, #083f39)' : '#ffffff',
                                                color: isChildSelected ? '#fff' : 'inherit',
                                                border: isChildSelected ? '1px solid var(--primary-color, #083f39)' : '1px solid #e2e8f0',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <span>{childDef?.icon || '▫️'}</span>
                                                <span style={{ fontWeight: 600 }}>{child.settings.title || childDef?.name || child.type}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={(e) => handleDeleteChildBlock(block.id, child.id, e)}
                                                style={{ background: 'transparent', border: 'none', color: isChildSelected ? '#fff' : '#ff6b6b', cursor: 'pointer', padding: '0 3px' }}
                                                title="Ջնջել ներդրված բլոկը"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', padding: '2px 0' }}>
                                        Դեռևս բլոկներ չկան կոնտեյներում:
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Pinned Global Footer Layer */}
              <div
                onClick={() => {
                  setSelectedBlockId('footer');
                  setSelectedChildBlockId(null);
                  setRightCollapsed(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: selectedBlockId === 'footer' ? '2px solid var(--primary-color, #083f39)' : '1px solid #cbd5e1',
                  background: selectedBlockId === 'footer' ? 'rgba(8, 63, 57, 0.08)' : '#f8fafc',
                  boxShadow: selectedBlockId === 'footer' ? '0 0 0 1px var(--primary-color, #083f39)' : 'none',
                  cursor: 'pointer',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>📌</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    Ստորոտ (Footer)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Կոնտակտներ, հղումներ, բաժանորդագրություն
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                  GLOBAL
                </span>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* FLOATING SIDEBAR 2: ELEMENT-LEVEL INSPECTOR */}
          {/* ────────────────────────────────────────────────────────── */}
          {rightCollapsed ? (
            <div
              onClick={() => setRightCollapsed(false)}
              style={{
                position: isFullscreen ? 'fixed' : 'absolute',
                right: '20px',
                top: isFullscreen ? '65px' : '70px',
                width: '46px',
                zIndex: 9999,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '14px',
                padding: '1.2rem 0.4rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.2rem',
                cursor: 'pointer',
                minHeight: '320px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.18)'
              }}
              title="Բացել Կարգավորիչը (Inspector)"
            >
              <span style={{ fontSize: '1.2rem' }}>🎛️</span>
              <span style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontWeight: 800,
                fontSize: '0.82rem',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                letterSpacing: '1px'
              }}>
                ՀԱՏԿՈՒԹՅՈՒՆՆԵՐ
              </span>
              <span style={{ marginTop: 'auto', color: 'var(--primary-color, #083f39)', fontWeight: 800, fontSize: '0.9rem' }}>◀</span>
            </div>
          ) : (
            <div style={{
              position: isFullscreen ? 'fixed' : 'absolute',
              right: '20px',
              top: isFullscreen ? '65px' : '70px',
              bottom: isFullscreen ? '24px' : '20px',
              width: '380px',
              zIndex: 9999,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              boxShadow: '0 16px 45px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <span>🎛️</span> Հատկություններ (Properties)
                </h3>
                <button
                  type="button"
                  onClick={() => setRightCollapsed(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '0.95rem',
                    padding: '2px 4px'
                  }}
                  title="Ծալել Կարգավորիչը"
                >
                  ▶
                </button>
              </div>

              {currentInspectTarget ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Header Pill of Selected Block */}
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    background: selectedChildBlock ? 'rgba(20, 184, 166, 0.1)' : 'rgba(8, 63, 57, 0.08)',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedChildBlock ? '#14b8a6' : 'var(--primary-color, #083f39)'}`,
                    fontSize: '0.82rem',
                    color: selectedChildBlock ? '#0f766e' : 'var(--primary-color, #083f39)',
                    fontWeight: 700
                  }}>
                    {selectedChildBlock ? (
                      <div>
                        <span>↳ Ներդրված բլոկ՝ <strong>{selectedChildBlock.type.toUpperCase()}</strong></span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Կոնտեյներ՝ {selectedBlock?.id}</div>
                      </div>
                    ) : (
                      <div>
                        <span>Բլոկ՝ <strong>{selectedBlock?.type.toUpperCase()}</strong></span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>ID: {selectedBlock?.id}</div>
                      </div>
                    )}
                  </div>

                  {/* Inspector Categories Switcher */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    background: '#f1f5f9',
                    padding: '3px',
                    borderRadius: '10px',
                    gap: '4px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('content')}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        borderRadius: '7px',
                        border: 'none',
                        background: inspectorTab === 'content' ? 'var(--primary-color, #083f39)' : 'transparent',
                        color: inspectorTab === 'content' ? '#fff' : 'inherit',
                        fontWeight: inspectorTab === 'content' ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      📝 Տեքստ
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('button')}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        borderRadius: '7px',
                        border: 'none',
                        background: inspectorTab === 'button' ? 'var(--primary-color, #083f39)' : 'transparent',
                        color: inspectorTab === 'button' ? '#fff' : 'inherit',
                        fontWeight: inspectorTab === 'button' ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔘 Կոճակ
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('media')}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        borderRadius: '7px',
                        border: 'none',
                        background: inspectorTab === 'media' ? 'var(--primary-color, #083f39)' : 'transparent',
                        color: inspectorTab === 'media' ? '#fff' : 'inherit',
                        fontWeight: inspectorTab === 'media' ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      🖼️ Մեդիա
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('layout')}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        borderRadius: '7px',
                        border: 'none',
                        background: inspectorTab === 'layout' ? 'var(--primary-color, #083f39)' : 'transparent',
                        color: inspectorTab === 'layout' ? '#fff' : 'inherit',
                        fontWeight: inspectorTab === 'layout' ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      🎨 Ֆոն
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('animation')}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.5rem',
                        borderRadius: '7px',
                        border: 'none',
                        background: inspectorTab === 'animation' ? 'var(--primary-color, #083f39)' : 'transparent',
                        color: inspectorTab === 'animation' ? '#fff' : 'inherit',
                        fontWeight: inspectorTab === 'animation' ? 700 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✨ Անիմացիա
                    </button>
                    {currentInspectTarget.type === 'container' && (
                      <button
                        type="button"
                        onClick={() => setInspectorTab('container')}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.5rem',
                          borderRadius: '7px',
                          border: 'none',
                          background: inspectorTab === 'container' ? 'var(--primary-color, #083f39)' : 'transparent',
                          color: inspectorTab === 'container' ? '#fff' : 'inherit',
                          fontWeight: inspectorTab === 'container' ? 700 : 500,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        🔲 Կոնտեյներ
                      </button>
                    )}
                  </div>

                  {/* ─── TAB 1: CONTENT & TYPOGRAPHY ─── */}
                  {inspectorTab === 'content' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {currentInspectTarget.type === 'header' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            🔝 Գլխամասի տեքստեր և նավիգացիա
                          </div>
                          <div>
                            <label style={labelStyle}>Լոգոյի Տեքստ (Logo Text)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.logo_text || ''}
                              onChange={(e) => handleUpdateSetting('logo_text', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Լոգոյի Ենթատեքստ (Logo Subtitle)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.logo_subtitle || ''}
                              onChange={(e) => handleUpdateSetting('logo_subtitle', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                            <label style={{ ...labelStyle, fontWeight: 700, color: 'var(--primary-color, #083f39)' }}>Մենյուի Կոճակների Անվանումներ</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Տուն (Home)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_home || ''}
                                  onChange={(e) => handleUpdateSetting('nav_home', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Մասին (About)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_about || ''}
                                  onChange={(e) => handleUpdateSetting('nav_about', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Աշխատանքներ (Works)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_works || ''}
                                  onChange={(e) => handleUpdateSetting('nav_works', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Տառատեսակներ (Fonts)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_fonts || ''}
                                  onChange={(e) => handleUpdateSetting('nav_fonts', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Հավելվածներ (Apps)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_apps || ''}
                                  onChange={(e) => handleUpdateSetting('nav_apps', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>HDesign</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_hdesign || ''}
                                  onChange={(e) => handleUpdateSetting('nav_hdesign', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Կապ (Contact)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.nav_contact || ''}
                                  onChange={(e) => handleUpdateSetting('nav_contact', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : currentInspectTarget.type === 'footer' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            📌 Ստորոտի տեքստեր և նկարագրություն
                          </div>
                          <div>
                            <label style={labelStyle}>Լոգոյի Տեքստ (Logo Text)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.logo_text || ''}
                              onChange={(e) => handleUpdateSetting('logo_text', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Նկարագրություն (Footer Description)</label>
                            <textarea
                              rows={3}
                              value={currentInspectTarget.settings.footer_desc || ''}
                              onChange={(e) => handleUpdateSetting('footer_desc', e.target.value)}
                              style={{ ...inputStyle, resize: 'vertical' }}
                            />
                          </div>
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                            <label style={{ ...labelStyle, fontWeight: 700, color: 'var(--primary-color, #083f39)' }}>Բաժինների Վերնագրեր</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Հղումների վերնագիր</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.footer_links_title || ''}
                                  onChange={(e) => handleUpdateSetting('footer_links_title', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Կոնտակտների վերնագիր</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.footer_contact_title || ''}
                                  onChange={(e) => handleUpdateSetting('footer_contact_title', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          </div>
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                            <label style={{ ...labelStyle, fontWeight: 700, color: 'var(--primary-color, #083f39)' }}>Կոնտակտային Տվյալներ</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Էլ. հասցե (Email)</label>
                                <input
                                  type="email"
                                  value={currentInspectTarget.settings.footer_email || ''}
                                  onChange={(e) => handleUpdateSetting('footer_email', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Հեռախոսահամար (Phone)</label>
                                <input
                                  type="tel"
                                  value={currentInspectTarget.settings.footer_tel || ''}
                                  onChange={(e) => handleUpdateSetting('footer_tel', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Հասցե (Address)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.footer_address || ''}
                                  onChange={(e) => handleUpdateSetting('footer_address', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>Հեղինակային իրավունք (Copyright Text)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.footer_text || ''}
                              onChange={(e) => handleUpdateSetting('footer_text', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label style={labelStyle}>Գլխավոր Վերնագիր (Title / Line 1)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.title ?? currentInspectTarget.settings.line1 ?? ''}
                              onChange={(e) => {
                                if (currentInspectTarget.settings.line1 !== undefined) {
                                  handleUpdateSetting('line1', e.target.value);
                                } else {
                                  handleUpdateSetting('title', e.target.value);
                                }
                              }}
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Երկրորդ Վերնագիր / Տող 2 (Subtitle / Line 2)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.subtitle ?? currentInspectTarget.settings.line2 ?? ''}
                              onChange={(e) => {
                                if (currentInspectTarget.settings.line2 !== undefined) {
                                  handleUpdateSetting('line2', e.target.value);
                                } else {
                                  handleUpdateSetting('subtitle', e.target.value);
                                }
                              }}
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Տեքստի Հավասարեցում (Alignment)</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {['left', 'center', 'right'].map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => handleUpdateSetting('text_align', align)}
                                  style={{
                                    flex: 1,
                                    padding: '0.45rem',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: (currentInspectTarget.settings.text_align || 'left') === align ? 'var(--primary-color, #083f39)' : '#fff',
                                    color: (currentInspectTarget.settings.text_align || 'left') === align ? '#fff' : 'inherit',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {align === 'left' ? 'Ձախ' : align === 'center' ? 'Կենտրոն' : 'Աջ'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label style={labelStyle}>Հիմնական Տեքստ / Կենսագրություն / Նկարագրություն</label>
                            <textarea
                              rows={4}
                              value={currentInspectTarget.settings.content ?? currentInspectTarget.settings.bio ?? currentInspectTarget.settings.quote ?? currentInspectTarget.settings.description ?? ''}
                              onChange={(e) => {
                                if (currentInspectTarget.settings.bio !== undefined) {
                                  handleUpdateSetting('bio', e.target.value);
                                } else if (currentInspectTarget.settings.quote !== undefined) {
                                  handleUpdateSetting('quote', e.target.value);
                                } else {
                                  handleUpdateSetting('content', e.target.value);
                                }
                              }}
                              style={{ ...inputStyle, resize: 'vertical' }}
                            />
                          </div>

                          {currentInspectTarget.settings.author_name !== undefined && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.78rem' }}>Հեղինակի Անուն</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.author_name || ''}
                                  onChange={(e) => handleUpdateSetting('author_name', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                              <div>
                                <label style={{ ...labelStyle, fontSize: '0.78rem' }}>Հեղինակի Պաշտոն</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.author_role || ''}
                                  onChange={(e) => handleUpdateSetting('author_role', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          )}

                          {currentInspectTarget.type === 'system_status' && (
                            <div>
                              <label style={labelStyle}>Կարգավիճակի Կոդ (Status Code, օրինակ 404 կամ 500)</label>
                              <input
                                type="text"
                                value={currentInspectTarget.settings.status_code || '404'}
                                onChange={(e) => handleUpdateSetting('status_code', e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                          )}

                          {currentInspectTarget.type === 'product_details' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                  <label style={labelStyle}>Գին (Price)</label>
                                  <input
                                    type="text"
                                    value={currentInspectTarget.settings.price || ''}
                                    onChange={(e) => handleUpdateSetting('price', e.target.value)}
                                    style={inputStyle}
                                  />
                                </div>
                                <div>
                                  <label style={labelStyle}>Արտիկուլ (SKU)</label>
                                  <input
                                    type="text"
                                    value={currentInspectTarget.settings.sku || ''}
                                    onChange={(e) => handleUpdateSetting('sku', e.target.value)}
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                              <div>
                                <label style={labelStyle}>Հատկանիշներ (Features)</label>
                                <textarea
                                  rows={2}
                                  value={currentInspectTarget.settings.features || ''}
                                  onChange={(e) => handleUpdateSetting('features', e.target.value)}
                                  style={{ ...inputStyle, resize: 'vertical' }}
                                />
                              </div>
                              <div>
                                <label style={labelStyle}>Պահեստի Կարգավիճակ (Stock Status)</label>
                                <input
                                  type="text"
                                  value={currentInspectTarget.settings.stock_status || ''}
                                  onChange={(e) => handleUpdateSetting('stock_status', e.target.value)}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── TAB 2: BUTTON / CTA ─── */}
                  {inspectorTab === 'button' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {currentInspectTarget.type === 'header' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            🔝 Գլխամասի CTA Կոճակ
                          </div>
                          <div>
                            <label style={labelStyle}>Կոճակի Տեքստ (Button Text)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.header_cta_text || ''}
                              onChange={(e) => handleUpdateSetting('header_cta_text', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Կոճակի Հղում (Button Link / URL)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.header_cta_url || ''}
                              onChange={(e) => handleUpdateSetting('header_cta_url', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Գույն (Primary Accent Color)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="color"
                                value={currentInspectTarget.settings.primary_color || '#083f39'}
                                onChange={(e) => handleUpdateSetting('primary_color', e.target.value)}
                                style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={currentInspectTarget.settings.primary_color || '#083f39'}
                                onChange={(e) => handleUpdateSetting('primary_color', e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </>
                      ) : currentInspectTarget.type === 'footer' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            📌 Բաժանորդագրության Բլոկ (Newsletter Form)
                          </div>
                          <div>
                            <label style={labelStyle}>Վերնագիր (Subscribe Title)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.footer_subscribe_title || ''}
                              onChange={(e) => handleUpdateSetting('footer_subscribe_title', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Նկարագրություն (Subscribe Description)</label>
                            <textarea
                              rows={2}
                              value={currentInspectTarget.settings.footer_subscribe_desc || ''}
                              onChange={(e) => handleUpdateSetting('footer_subscribe_desc', e.target.value)}
                              style={{ ...inputStyle, resize: 'vertical' }}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Կոճակի Տեքստ (Subscribe Button Text)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.footer_subscribe_btn || ''}
                              onChange={(e) => handleUpdateSetting('footer_subscribe_btn', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label style={labelStyle}>Կոճակի Տեքստ (Button Text)</label>
                            <input
                              type="text"
                              placeholder="Օր․ «Ավելին» կամ «Կապ»"
                              value={currentInspectTarget.settings.btn_text || ''}
                              onChange={(e) => handleUpdateSetting('btn_text', e.target.value)}
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Կոճակի Հղում (Button URL / Link)</label>
                            <input
                              type="text"
                              placeholder="/contact կամ https://..."
                              value={currentInspectTarget.settings.btn_url || ''}
                              onChange={(e) => handleUpdateSetting('btn_url', e.target.value)}
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={labelStyle}>Կոճակի Գույն (Button Background)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="color"
                                value={currentInspectTarget.settings.btn_color || '#14b8a6'}
                                onChange={(e) => handleUpdateSetting('btn_color', e.target.value)}
                                style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={currentInspectTarget.settings.btn_color || '#14b8a6'}
                                onChange={(e) => handleUpdateSetting('btn_color', e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── TAB 3: MEDIA & VISUALS ─── */}
                  {inspectorTab === 'media' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {currentInspectTarget.type === 'header' || currentInspectTarget.type === 'footer' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            🖼️ Լոգոյի Պատկեր (Brand Logo Image)
                          </div>
                          <div>
                            <label style={labelStyle}>Լոգոյի URL (Logo Image URL)</label>
                            <input
                              type="text"
                              placeholder="/logo.png կամ https://..."
                              value={currentInspectTarget.settings.logo_url || ''}
                              onChange={(e) => handleUpdateSetting('logo_url', e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          {currentInspectTarget.settings.logo_url && (
                            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#083f39', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={currentInspectTarget.settings.logo_url}
                                alt="Logo Preview"
                                style={{ maxHeight: '48px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <label style={labelStyle}>Պատկերի URL (Image URL / Poster)</label>
                            <input
                              type="text"
                              value={currentInspectTarget.settings.image_url ?? currentInspectTarget.settings.signature_url ?? currentInspectTarget.settings.video_poster ?? ''}
                              onChange={(e) => {
                                if (currentInspectTarget.settings.signature_url !== undefined) {
                                  handleUpdateSetting('signature_url', e.target.value);
                                } else if (currentInspectTarget.settings.video_poster !== undefined) {
                                  handleUpdateSetting('video_poster', e.target.value);
                                } else {
                                  handleUpdateSetting('image_url', e.target.value);
                                }
                              }}
                              style={inputStyle}
                            />
                          </div>

                          {currentInspectTarget.settings.video_url !== undefined && (
                            <div>
                              <label style={labelStyle}>Տեսանյութի URL (Video URL)</label>
                              <input
                                type="text"
                                value={currentInspectTarget.settings.video_url || ''}
                                onChange={(e) => handleUpdateSetting('video_url', e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                          )}

                          <div>
                            <label style={labelStyle}>Անկյունների Կլորացում (Border Radius)</label>
                            <select
                              value={currentInspectTarget.settings.image_radius || '16px'}
                              onChange={(e) => handleUpdateSetting('image_radius', e.target.value)}
                              style={inputStyle}
                            >
                              <option value="0px">Ուղիղ (0px)</option>
                              <option value="8px">Թեթև (8px)</option>
                              <option value="16px">Միջին (16px)</option>
                              <option value="24px">Կլորավուն (24px)</option>
                              <option value="50%">Շրջանաձև (50%)</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── TAB 4: LAYOUT & BACKGROUND ─── */}
                  {inspectorTab === 'layout' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {currentInspectTarget.type === 'footer' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            📌 Ստորոտի Ֆոնային Գույն (--footer-bg)
                          </div>
                          <div>
                            <label style={labelStyle}>Ստորոտի Ֆոն (Footer Background Color)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <input
                                type="color"
                                value={currentInspectTarget.settings.footer_bg || '#083f39'}
                                onChange={(e) => handleUpdateSetting('footer_bg', e.target.value)}
                                style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={currentInspectTarget.settings.footer_bg || '#083f39'}
                                onChange={(e) => handleUpdateSetting('footer_bg', e.target.value)}
                                style={inputStyle}
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateSetting('footer_bg', '#083f39')}
                                style={{ flex: 1, padding: '6px 4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #083f39', background: '#083f39', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                              >
                                #083f39
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSetting('footer_bg', '#052623')}
                                style={{ flex: 1, padding: '6px 4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #052623', background: '#052623', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                              >
                                #052623
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSetting('footer_bg', '#041f1c')}
                                style={{ flex: 1, padding: '6px 4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #041f1c', background: '#041f1c', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                              >
                                #041f1c
                              </button>
                            </div>
                          </div>
                        </>
                      ) : currentInspectTarget.type === 'header' ? (
                        <>
                          <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            🔝 Գլխամասի Ֆոն և Չափսեր
                          </div>
                          <div>
                            <label style={labelStyle}>Գլխամասի Ֆոն (Header Background)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <input
                                type="color"
                                value={currentInspectTarget.settings.bg_color && currentInspectTarget.settings.bg_color !== 'transparent' ? currentInspectTarget.settings.bg_color : '#ffffff'}
                                onChange={(e) => handleUpdateSetting('bg_color', e.target.value)}
                                style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={currentInspectTarget.settings.bg_color || '#ffffff'}
                                onChange={(e) => handleUpdateSetting('bg_color', e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label style={labelStyle}>Ֆոնային Գույն (Background Color)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <input
                                type="color"
                                value={currentInspectTarget.settings.bg_color && currentInspectTarget.settings.bg_color !== 'transparent' ? currentInspectTarget.settings.bg_color : '#ffffff'}
                                onChange={(e) => handleUpdateSetting('bg_color', e.target.value)}
                                style={{ width: '38px', height: '38px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                value={currentInspectTarget.settings.bg_color || 'transparent'}
                                onChange={(e) => handleUpdateSetting('bg_color', e.target.value)}
                                style={inputStyle}
                              />
                            </div>

                            {/* Quick color preset pills */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateSetting('bg_color', 'transparent')}
                                style={{ flex: 1, padding: '4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                              >
                                Թափանցիկ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSetting('bg_color', '#ffffff')}
                                style={{ flex: 1, padding: '4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#000', cursor: 'pointer' }}
                              >
                                Սպիտակ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSetting('bg_color', '#083f39')}
                                style={{ flex: 1, padding: '4px', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid #083f39', background: '#083f39', color: '#fff', cursor: 'pointer' }}
                              >
                                #083f39
                              </button>
                            </div>
                          </div>

                          <div>
                            <label style={labelStyle}>Վերևի / Ներքևի Լուսանցք (Padding)</label>
                            <select
                              value={currentInspectTarget.settings.padding || '40px 0'}
                              onChange={(e) => handleUpdateSetting('padding', e.target.value)}
                              style={inputStyle}
                            >
                              <option value="10px 0">Փոքր (10px)</option>
                              <option value="20px 0">Միջին (20px)</option>
                              <option value="40px 0">Սովորական (40px)</option>
                              <option value="80px 0">Մեծ (80px)</option>
                              <option value="120px 0">Շատ Մեծ (120px)</option>
                            </select>
                          </div>

                          <div>
                            <label style={labelStyle}>Առավելագույն Լայնություն (Max-Width)</label>
                            <select
                              value={currentInspectTarget.settings.max_width || '1440px'}
                              onChange={(e) => handleUpdateSetting('max_width', e.target.value)}
                              style={inputStyle}
                            >
                              <option value="1200px">1200px</option>
                              <option value="1440px">1440px (HDesign Standard)</option>
                              <option value="1600px">1600px (Wide)</option>
                              <option value="100%">100% (Full Width)</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── TAB 5: ANIMATION (hd-reveal) ─── */}
                  {inspectorTab === 'animation' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {currentInspectTarget.type === 'header' ? (
                        <div style={{ padding: '1rem', background: 'rgba(8, 63, 57, 0.06)', borderRadius: '10px', border: '1px solid rgba(8, 63, 57, 0.15)', fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.6 }}>
                          ✨ <strong>Ակտիվ Header Անիմացիա</strong>
                          <p style={{ margin: '0.5rem 0 0', color: '#475569', fontSize: '0.8rem' }}>
                            Գլխամասը օժտված է դինամիկ scroll blur և shrink էֆեկտով։ Էջը ներքև ոլորելիս header-ը ավտոմատ կերպով ստանում է ապակեպատ ֆոն (.scrolled blur)։
                          </p>
                        </div>
                      ) : currentInspectTarget.type === 'footer' ? (
                        <div style={{ padding: '1rem', background: 'rgba(8, 63, 57, 0.06)', borderRadius: '10px', border: '1px solid rgba(8, 63, 57, 0.15)', fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.6 }}>
                          ✨ <strong>Ակտիվ Footer Անիմացիա</strong>
                          <p style={{ margin: '0.5rem 0 0', color: '#475569', fontSize: '0.8rem' }}>
                            Ստորոտն օժտված է dynamic SVG curved path ֆոնով և ներքին էլեմենտների hd-reveal (upward fade & duration) անիմացիաներով։
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label style={labelStyle}>Հայտնվելու Ուղղություն (Direction)</label>
                            <select
                              value={currentInspectTarget.settings.animation_direction || 'up'}
                              onChange={(e) => handleUpdateSetting('animation_direction', e.target.value)}
                              style={inputStyle}
                            >
                              <option value="up">Դեպի Վերև (Up)</option>
                              <option value="down">Դեպի Ներքև (Down)</option>
                              <option value="left">Դեպի Ձախ (Left)</option>
                              <option value="right">Դեպի Աջ (Right)</option>
                              <option value="scale">Խոշորացում (Scale)</option>
                              <option value="fade">Սահուն Ելք (Fade)</option>
                            </select>
                          </div>

                          <div>
                            <label style={labelStyle}>Անիմացիայի Տևողություն (Duration ms)</label>
                            <select
                              value={currentInspectTarget.settings.animation_duration || '800'}
                              onChange={(e) => handleUpdateSetting('animation_duration', e.target.value)}
                              style={inputStyle}
                            >
                              <option value="400">400ms (Արագ)</option>
                              <option value="600">600ms</option>
                              <option value="800">800ms (Ստանդարտ)</option>
                              <option value="1000">1000ms</option>
                              <option value="1200">1200ms (Սահուն դանդաղ)</option>
                            </select>
                          </div>

                          <div>
                            <label style={labelStyle}>Հապաղում (Delay ms)</label>
                            <select
                              value={currentInspectTarget.settings.animation_delay || '0'}
                              onChange={(e) => handleUpdateSetting('animation_delay', e.target.value)}
                              style={inputStyle}
                            >
                              <option value="0">0ms (Անմիջապես)</option>
                              <option value="150">150ms</option>
                              <option value="300">300ms</option>
                              <option value="500">500ms</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── TAB 6: CONTAINER & NESTED BLOCKS ─── */}
                  {inspectorTab === 'container' && currentInspectTarget.type === 'container' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={labelStyle}>Սյուների Քանակ (Columns)</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {[1, 2, 3, 4].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleUpdateSetting('columns', num)}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: (currentInspectTarget.settings.columns || 2) === num ? 'var(--primary-color, #083f39)' : '#fff',
                                color: (currentInspectTarget.settings.columns || 2) === num ? '#fff' : 'inherit',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {num} {num === 1 ? 'Սյուն' : 'Սյունակ'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Սյուների Հեռավորություն (Gap)</label>
                        <select
                          value={currentInspectTarget.settings.gap || '24px'}
                          onChange={(e) => handleUpdateSetting('gap', e.target.value)}
                          style={inputStyle}
                        >
                          <option value="12px">12px (Խիտ)</option>
                          <option value="24px">24px (Ստանդարտ)</option>
                          <option value="36px">36px (Լայն)</option>
                          <option value="48px">48px (Շատ լայն)</option>
                        </select>
                      </div>

                      {/* Child blocks management */}
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                        <label style={labelStyle}>Կոնտեյների Ներդրված Բլոկներ ({currentInspectTarget.children?.length || 0})</label>
                        
                        {currentInspectTarget.children && currentInspectTarget.children.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem' }}>
                            {currentInspectTarget.children.map(child => (
                              <div
                                key={child.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: selectedChildBlockId === child.id ? 'rgba(20, 184, 166, 0.15)' : '#f8fafc',
                                  border: selectedChildBlockId === child.id ? '1.5px solid #14b8a6' : '1px solid #e2e8f0'
                                }}
                              >
                                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                                  {child.settings.title || child.type}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedChildBlockId(child.id)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#14b8a6' }}
                                  >
                                    Խմբագրել ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteChildBlock(currentInspectTarget.id, child.id)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#ff6b6b' }}
                                  >
                                    Ջնջել ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Ներդրված բլոկներ չկան: Ավելացրեք ստորև:
                          </p>
                        )}

                        {/* Add child block to container */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <select
                            id="add_child_select"
                            style={{ ...inputStyle, flex: 1, fontSize: '0.82rem' }}
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddChildBlock(currentInspectTarget.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="" disabled>+ Ավելացնել բլոկ կոնտեյներում...</option>
                            {allBlockTypes.filter(b => b.type !== 'container').map(b => (
                              <option key={b.type} value={b.type}>
                                {b.icon} {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Ընտրեք որևէ բլոկ կտավից կամ շերտերից</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>Այստեղ կհայտնվեն բլոկի ամբողջական տարրային կարգավորիչները</p>
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* CENTER: 100% UNRESTRICTED FULL-WIDTH AUTHENTIC WYSIWYG CANVAS IFRAME */}
          {/* ────────────────────────────────────────────────────────── */}
          <div style={{
            width: '100%',
            height: isFullscreen ? 'calc(100vh - 54px)' : standaloneMode ? 'calc(100vh - 126px)' : 'calc(820px - 54px)',
            background: '#ffffff',
            margin: 0,
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              onLoad={handleIframeLoad}
              style={{
                width: viewportMode === 'real' ? '100%' : viewportMode === 'desktop' ? '1440px' : viewportMode === 'tablet' ? '768px' : '375px',
                maxWidth: '100%',
                height: '100%',
                border: viewportMode === 'real' ? 'none' : '1px solid #cbd5e1',
                borderRadius: viewportMode === 'real' ? 0 : '16px',
                boxShadow: viewportMode === 'real' ? 'none' : '0 15px 45px rgba(0,0,0,0.12)',
                transition: 'width 0.3s ease',
                background: '#ffffff',
                display: 'block'
              }}
              title="Live Site Injection Canvas"
            />
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              FLOATING DRAWERS: PERSONALIZATION & PAGES MANAGEMENT
              ══════════════════════════════════════════════════════════════════ */}
          <PersonalizationDrawer
            isOpen={activeFloatingDrawer === 'personalization'}
            onClose={() => setActiveFloatingDrawer(null)}
            onUpdateVariables={(customVars) => {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                  { type: 'UPDATE_THEME_VARIABLES', customVars },
                  '*'
                );
              }
            }}
          />

          <PagesManagerDrawer
            isOpen={activeFloatingDrawer === 'pages'}
            onClose={() => setActiveFloatingDrawer(null)}
            activeSlug={activePageSlug}
            onSelectPage={(slug) => {
              setActivePageSlug(slug);
              const targetUrl = slug === 'index' ? '/?builder=true' : `/${slug.replace(/^\//, '')}?builder=true`;
              setIframeUrl(targetUrl);
              setCurrentLiveUrl(targetUrl);
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                  { type: 'NAVIGATE_PAGE', slug, url: targetUrl },
                  '*'
                );
              }
            }}
            onPagesUpdated={async () => {
              try {
                const res = await fetch('/api/builder/pages?action=list');
                const data = await res.json();
                if (data.success && Array.isArray(data.pages)) {
                  setAvailablePages(data.pages);
                }
              } catch {}
            }}
          />

          {/* ══════════════════════════════════════════════════════════════════
              MODAL: CREATE NEW CUSTOM BLOCK
              ══════════════════════════════════════════════════════════════════ */}
          {isCreateBlockModalOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999999,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                    <span>➕</span> Ստեղծել Նոր Բլոկ (New Block Type)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateBlockModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCustomBlock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Բլոկի Անվանում (Հայերեն)</label>
                    <input
                      type="text"
                      placeholder="Օր․ «Մեր Ծառայությունները»"
                      required
                      value={newBlockName}
                      onChange={(e) => {
                        setNewBlockName(e.target.value);
                        if (!newBlockType) {
                          setNewBlockType(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
                        }
                      }}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Բլոկի Իկոնկա (Icon / Emoji)</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newBlockIcon}
                        onChange={(e) => setNewBlockIcon(e.target.value)}
                        style={{ ...inputStyle, width: '60px', textAlign: 'center', fontSize: '1.2rem' }}
                      />
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {['🌟', '💼', '🎁', '🚀', '💬', '⚡', '🎯', '🎨', '📝', '🔧', '🏆', '📌'].map(ico => (
                          <span
                            key={ico}
                            onClick={() => setNewBlockIcon(ico)}
                            style={{ cursor: 'pointer', padding: '4px', fontSize: '1.1rem', borderRadius: '4px', background: newBlockIcon === ico ? '#cbd5e1' : 'transparent' }}
                          >
                            {ico}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Բլոկի Իդենտիֆիկատոր (Slug / Type)</label>
                    <input
                      type="text"
                      placeholder="services_section"
                      value={newBlockType}
                      onChange={(e) => setNewBlockType(e.target.value)}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Ավտոմատ կավելացվի նոր բլոկի սխեման:</span>
                  </div>

                  <div>
                    <label style={labelStyle}>Նկարագրություն</label>
                    <textarea
                      rows={2}
                      placeholder="Հակիրճ նկարագրեք այս բլոկի դերը..."
                      value={newBlockDesc}
                      onChange={(e) => setNewBlockDesc(e.target.value)}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsCreateBlockModalOpen(false)}
                      style={{
                        padding: '0.65rem 1.2rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Չեղարկել
                    </button>
                    <button
                      type="submit"
                      disabled={creatingBlock}
                      style={{
                        padding: '0.65rem 1.4rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--primary-color, #083f39)',
                        color: '#fff',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {creatingBlock ? 'Ստեղծվում է...' : 'Ստեղծել Բլոկը'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUBTAB 3: THEME SETTINGS (GLOBAL COLORS, LOGO, STYLES)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'settings' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', margin: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                ⚙️ {selectedThemeForEdit ? selectedThemeForEdit.name : 'Թեմայի'} Կայանքներ
              </h3>
              <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                Գլոբալ CSS փոփոխականներ, գույների գամմա, գլխամասի և ստորոտի պարամետրեր
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveThemeSettings}
              disabled={saving}
              style={{
                background: 'var(--primary-color, #083f39)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.6rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(8, 63, 57, 0.25)'
              }}
            >
              {saving ? 'Պահպանվում է...' : 'Պահպանել Փոփոխությունները'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Palette */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-color, #083f39)' }}>
                Գույների Գամմա (Color Palette)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <label style={labelStyle}>Հիմնական Գույն (Primary)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={themeSettings.primary_color || '#083f39'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={themeSettings.primary_color || '#083f39'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <label style={labelStyle}>Ակցենտային Գույն (Accent)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={themeSettings.accent_color || '#14b8a6'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={themeSettings.accent_color || '#14b8a6'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <label style={labelStyle}>Ֆոնային Գույն (Background)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={themeSettings.bg_color || '#ffffff'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, bg_color: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={themeSettings.bg_color || '#ffffff'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, bg_color: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <label style={labelStyle}>Տեքստի Գույն (Text)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="color"
                      value={themeSettings.text_color || '#0f172a'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, text_color: e.target.value }))}
                      style={{ width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={themeSettings.text_color || '#0f172a'}
                      onChange={(e) => setThemeSettings(prev => ({ ...prev, text_color: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Header branding */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-color, #083f39)' }}>
                Գլխամաս և Լոգո (Header & Branding)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Լոգոյի Տեքստ (Logo Text)</label>
                  <input
                    type="text"
                    value={themeSettings.logo_text || ''}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, logo_text: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Գլխամասի Ոճ (Header Style)</label>
                  <select
                    value={themeSettings.header_style || 'glass'}
                    onChange={(e: any) => setThemeSettings(prev => ({ ...prev, header_style: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="glass">Թափանցիկ ապակի (Glassmorphism)</option>
                    <option value="solid">Միագույն հոծ (Solid)</option>
                    <option value="minimal">Մինիմալիստական (Minimal)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <input
                    type="checkbox"
                    id="header_sticky_cb"
                    checked={!!themeSettings.header_sticky}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, header_sticky: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color, #083f39)' }}
                  />
                  <label htmlFor="header_sticky_cb" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    Ամրացված գլխամաս (Sticky Header)
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-color, #083f39)' }}>
                Ստորոտի Կայանքներ (Footer)
              </h4>
              <div>
                <label style={labelStyle}>Հեղինակային իրավունքի տեքստ (Copyright)</label>
                <input
                  type="text"
                  value={themeSettings.footer_text || ''}
                  onChange={(e) => setThemeSettings(prev => ({ ...prev, footer_text: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Custom CSS */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-color, #083f39)' }}>
                Հավելյալ Custom CSS
              </h4>
              <textarea
                rows={5}
                value={themeSettings.custom_css || ''}
                placeholder="/* Գրեք Ձեր սեփական CSS կանոնները այստեղ */"
                onChange={(e) => setThemeSettings(prev => ({ ...prev, custom_css: e.target.value }))}
                style={{
                  ...inputStyle,
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  lineHeight: 1.5
                }}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
