"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingAnimation from "@/components/LoadingAnimation";
import MediaPickerModal from "@/components/MediaPickerModal";
import { MediaFileType } from "@/lib/mediaTypes";
import { prefetchMediaLibrary } from "@/lib/mediaCache";

type FontBlock = 
  | { type: 'text'; title_am: string; title_en: string; content_am: string; content_en: string }
  | { type: 'image'; image_url: string; caption_am?: string; caption_en?: string }
  | { type: 'specimen_banner'; previewText: string; size: number }
  | { type: 'weights_comparison'; title_am: string; title_en: string; previewText: string; weights: number[] }
  | { type: 'glyph_showcase'; title_am: string; title_en: string; letters: string };

type Font = {
  id: string;
  name_am: string;
  name_en: string;
  category: string;
  creator: string;
  year: string;
  description_am: string;
  description_en: string;
  downloadable: boolean;
  paid: boolean;
  price: string;
  font_file_url: string;
  download_url: string;
  purchase_url: string;
};

export default function FontWysiwygEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const isNew = searchParams?.get("new") === "true";

  const [token, setToken] = useState<string | null>(null);
  const [fontForm, setFontForm] = useState<Font>({
    id: id || "",
    name_am: "",
    name_en: "",
    category: "Sans-Serif",
    creator: "Հրանտ Հակոբյան",
    year: new Date().getFullYear().toString(),
    description_am: "[]",
    description_en: "[]",
    downloadable: true,
    paid: false,
    price: "",
    font_file_url: "",
    download_url: "",
    purchase_url: ""
  });

  const [blocks, setBlocks] = useState<FontBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFontFile, setUploadingFontFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState<"details" | "files" | "pricing" | "specimen">("details");

  // Media Picker Popup Modal state
  const [mediaPickerConfig, setMediaPickerConfig] = useState<{
    isOpen: boolean;
    target: 'font_file';
    multiple?: boolean;
    allowedTypes?: MediaFileType[];
    title?: string;
    currentValue?: string | string[];
  } | null>(null);

  const handleMediaPickerSelect = (selected: string | string[]) => {
    if (!mediaPickerConfig) return;
    const url = Array.isArray(selected) ? selected[0] : selected;
    if (url) {
      setFontForm(prev => ({
        ...prev,
        font_file_url: url,
        download_url: prev.download_url || url
      }));
    }
    setMediaPickerConfig(null);
  };

  // Load auth token & initial font data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("hdesign_admin_token");
      if (!savedToken) {
        alert("Խնդրում ենք նախ մուտք գործել վարիչի համակարգ:");
        router.push("/admin");
        return;
      }
      setToken(savedToken);
      prefetchMediaLibrary(savedToken);
      loadFont(savedToken);
    }
  }, [id]);

  /* ─ Theme ─ */
  useEffect(() => {
    const savedTheme = localStorage.getItem('hdesign-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.documentElement.setAttribute('data-color', savedTheme === 'light' ? '#083f39' : '#ffffff');
      document.documentElement.classList.remove('light', 'dark', 'green');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-color', '#083f39');
      document.documentElement.classList.remove('light', 'dark', 'green');
      document.documentElement.classList.add('light');
    }
  }, []);

  async function loadFont(authToken: string) {
    try {
      const res = await fetch("/api/fonts");
      if (!res.ok) throw new Error("Failed to load fonts");
      const fontsData = await res.json();
      const found = (fontsData || []).find((f: any) => f.id === id);

      if (found) {
        setFontForm({
          id: found.id,
          name_am: found.name_am || "",
          name_en: found.name_en || "",
          category: found.category || "Sans-Serif",
          creator: found.creator || "Հրանտ Հակոբյան",
          year: found.year || "",
          description_am: found.description_am || "[]",
          description_en: found.description_en || "[]",
          downloadable: found.downloadable !== false,
          paid: !!found.paid,
          price: found.price || "",
          font_file_url: found.font_file_url || "",
          download_url: found.download_url || "",
          purchase_url: found.purchase_url || ""
        });
        parseBlocks(found.description_am || "[]");
      } else if (isNew) {
        setFontForm({
          id: id,
          name_am: "Նոր Տառատեսակ",
          name_en: "New Font",
          category: "Sans-Serif",
          creator: "Հրանտ Հակոբյան",
          year: new Date().getFullYear().toString(),
          description_am: "[]",
          description_en: "[]",
          downloadable: true,
          paid: false,
          price: "",
          font_file_url: "",
          download_url: "",
          purchase_url: ""
        });
        setBlocks([
          { type: 'text', title_am: 'Տառատեսակի Մասին', title_en: 'About the Font', content_am: 'Այս տառատեսակը ստեղծված է...', content_en: 'This font is designed for...' },
          { type: 'specimen_banner', previewText: 'Աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցուփքևօֆ', size: 54 }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function parseBlocks(descriptionStr: string) {
    if (descriptionStr.startsWith("[")) {
      try {
        setBlocks(JSON.parse(descriptionStr));
        return;
      } catch (e) {}
    }
    setBlocks([
      { type: 'text', title_am: 'Տառատեսակի Մասին', title_en: 'About the Font', content_am: descriptionStr, content_en: descriptionStr }
    ]);
  }

  const addBlock = (type: FontBlock["type"]) => {
    const newBlock: any = { type };
    if (type === 'text') {
      newBlock.title_am = 'Նոր Բաժին';
      newBlock.title_en = 'New Section';
      newBlock.content_am = 'Տեքստային բովանդակություն...';
      newBlock.content_en = 'Text content here...';
    } else if (type === 'image') {
      newBlock.image_url = '';
      newBlock.caption_am = '';
      newBlock.caption_en = '';
    } else if (type === 'specimen_banner') {
      newBlock.previewText = 'Աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցուփքևօֆ';
      newBlock.size = 64;
    } else if (type === 'weights_comparison') {
      newBlock.title_am = 'Հաստության ցուցադրում';
      newBlock.title_en = 'Weights Showcase';
      newBlock.previewText = 'Հրանտ Հակոբյան Դիզայն';
      newBlock.weights = [300, 400, 700];
    } else if (type === 'glyph_showcase') {
      newBlock.title_am = 'Գլիֆներ';
      newBlock.title_en = 'Key Glyphs';
      newBlock.letters = 'Ա Բ Գ Դ';
    }
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (idx: number, updated: FontBlock) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? updated : b));
  };

  const deleteBlock = (idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    setBlocks(prev => {
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

  // Font file upload
  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    setUploadingFontFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'fonts');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFontForm(prev => ({ 
          ...prev, 
          font_file_url: data.url,
          download_url: data.url // default download url same as uploaded file
        }));
      } else {
        alert(data.error || 'Վերբեռնումը ձախողվեց:');
      }
    } catch (err) {
      alert('Սխալ վերբեռնման ընթացքում:');
    } finally {
      setUploadingFontFile(false);
    }
  };

  const handleSave = async () => {
    if (!token || !fontForm.name_am || !fontForm.name_en || !fontForm.font_file_url) {
      alert("Խնդրում ենք լրացնել անունը և վերբեռնել տառատեսակի ֆայլը (*.ttf, *.otf):");
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? '/api/fonts' : `/api/fonts/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const finalPayload = {
        ...fontForm,
        description_am: JSON.stringify(blocks),
        description_en: JSON.stringify(blocks)
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(finalPayload)
      });

      const data = await res.json();
      if (res.ok) {
        alert("Տառատեսակը հաջողությամբ պահվեց:");
        if (isNew) {
          router.replace(`/admin/editor/font/${fontForm.id}`);
        }
      } else {
        alert("Սխալ՝ " + (data.error || "Չհաջողվեց պահել"));
      }
    } catch (err) {
      alert("Կապի սխալ: Չհաջողվեց պահել տառատեսակը:");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingAnimation message="Բեռնվում է WYSIWYG խմբագրիչը..." />
    );
  }

  return (
    <div style={{ 
      background: 'var(--bg)', 
      color: 'var(--text)', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'HDesign, sans-serif',
      ['--hue' as any]: '172',
      ['--saturation' as any]: '77%',
      ['--lightness' as any]: '14%',
      ['--text-lightness' as any]: '14%',
      ['--text-color-custom' as any]: '#083f39'
    }}>
      
      {/* Dynamic Font Injection for Previewing */}
      {fontForm.font_file_url && (
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'wysiwyg-preview-font-${fontForm.id}';
            src: url('${fontForm.font_file_url}') format('woff2'),
                 url('${fontForm.font_file_url}') format('woff'),
                 url('${fontForm.font_file_url}') format('opentype'),
                 url('${fontForm.font_file_url}') format('truetype'),
                 url('${fontForm.font_file_url}');
            font-display: swap;
          }
        ` }} />
      )}

      {/* Top sticky editor bar */}
      <div style={{
        height: '70px', background: 'var(--panel)', borderBottom: '1px solid var(--panel-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin?tab=fonts" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem' }}>
              ← Հետ դեպի Վարիչ
            </button>
          </Link>
          <span style={{ fontSize: '0.9rem', color: 'var(--panel-border)' }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>
            {isNew ? 'Ավելացնել Նոր Տառատեսակ (MyFonts ոճով)' : `Խմբագրել՝ ${fontForm.name_am}`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              padding: '10px 24px', background: 'var(--accent, #00ffcc)', border: 'none', borderRadius: '8px', 
              color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(0, 255, 204, 0.3)', transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {saving ? 'Պահվում է...' : 'Պահել տառատեսակը'}
          </button>
        </div>
      </div>

      {/* Editor Main Content: Split layout (3/4 left preview, 1/4 right tools sidebar) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
        
        {/* Left Side: Real-time Live Specimen Showcase Preview (3/4 of the width) */}
        <div style={{ background: 'var(--bg)', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)', padding: '48px', boxSizing: 'border-box' }}>
          
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            {/* Header info */}
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 800 }}>
                {fontForm.category} • {fontForm.creator}
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text)', margin: '12px 0 0 0' }}>
                {fontForm.name_am || 'Տառատեսակի անուն'}
              </h1>
            </div>

            {/* Specimen Blocks rendering */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {blocks.length === 0 ? (
                <div style={{ border: '2px dashed var(--panel-border)', borderRadius: '16px', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
                  <h4>Ցուցադրման բլոկներ չկան</h4>
                  <p style={{ fontSize: '0.85rem' }}>Ավելացրեք նմուշներ, գլիֆների ցանց կամ տեքստեր աջակողմյան վահանակից՝ ձեր տառատեսակը ցուցադրելու համար:</p>
                </div>
              ) : (
                blocks.map((block, idx) => {
                  if (block.type === 'text') {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
                        {(block.title_am || block.title_en) && (
                          <h4 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)', margin: 0 }}>
                            {block.title_am || block.title_en}
                          </h4>
                        )}
                        <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--muted)', margin: 0, whiteSpace: 'pre-line' }}>
                          {block.content_am || block.content_en}
                        </p>
                      </div>
                    );
                  }

                  if (block.type === 'specimen_banner' && block.previewText) {
                    return (
                      <div key={idx} style={{ padding: '36px', background: 'var(--panel)', borderRadius: '16px', border: '1px solid var(--panel-border)', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Specimen Banner ({block.size || 54}px)</span>
                        <div className="preview-font-container" style={{ 
                          fontFamily: fontForm.font_file_url ? `wysiwyg-preview-font-${fontForm.id}` : 'sans-serif', 
                          fontSize: `${block.size || 54}px`, 
                          color: 'var(--text)', 
                          lineHeight: '1.2', 
                          wordBreak: 'break-word' 
                        }}>
                          {block.previewText}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'weights_comparison' && block.previewText) {
                    const weightList = block.weights || [300, 400, 700];
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{block.title_am || block.title_en}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {weightList.map((w, wIdx) => (
                            <div key={wIdx} style={{ display: 'flex', gap: '16px', alignItems: 'baseline', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', width: '80px' }}>Weight {w}</span>
                              <div className="preview-font-container" style={{ 
                                fontFamily: fontForm.font_file_url ? `wysiwyg-preview-font-${fontForm.id}` : 'sans-serif', 
                                fontSize: '1.8rem', 
                                color: 'var(--text)', 
                                fontWeight: w,
                                flex: 1
                              }}>
                                {block.previewText}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'glyph_showcase' && block.letters) {
                    const lettersList = block.letters.split(' ').filter(s => s.length > 0);
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{block.title_am || block.title_en}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '12px' }}>
                          {lettersList.map((letter, lIdx) => (
                            <div key={lIdx} style={{ height: '110px', background: 'var(--panel)', border: '1px solid var(--panel-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div className="preview-font-container" style={{ 
                                fontFamily: fontForm.font_file_url ? `wysiwyg-preview-font-${fontForm.id}` : 'sans-serif', 
                                fontSize: '3rem', 
                                color: 'var(--text)', 
                                lineHeight: 1 
                              }}>
                                {letter}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'image' && block.image_url) {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                          <img src={block.image_url} alt="Font graphic" style={{ width: '100%', display: 'block' }} />
                        </div>
                        {(block.caption_am || block.caption_en) && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>
                            {block.caption_am || block.caption_en}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return null;
                })
              )}
            </div>

          </div>

        </div>

        {/* Right Side: Tools Sidebar Pane (1/4 of the width) - Styled as MyFonts Font Family Upload Wizard */}
        <div style={{
          background: 'var(--panel)', borderLeft: '1px solid var(--panel-border)',
          padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          
          <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>
              MyFonts Publishing Portal
            </span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', color: 'var(--text)', fontWeight: 700 }}>
              Font Family Builder
            </h3>
          </div>

          {/* Wizard step navigation */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => setActiveStep("details")}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                background: activeStep === 'details' ? 'var(--btn-hover-bg)' : 'transparent',
                color: activeStep === 'details' ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer'
              }}
            >
              1. Details
            </button>
            <button 
              onClick={() => setActiveStep("files")}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                background: activeStep === 'files' ? 'var(--btn-hover-bg)' : 'transparent',
                color: activeStep === 'files' ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer'
              }}
            >
              2. Files
            </button>
            <button 
              onClick={() => setActiveStep("pricing")}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                background: activeStep === 'pricing' ? 'var(--btn-hover-bg)' : 'transparent',
                color: activeStep === 'pricing' ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer'
              }}
            >
              3. Pricing
            </button>
            <button 
              onClick={() => setActiveStep("specimen")}
              style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                background: activeStep === 'specimen' ? 'var(--btn-hover-bg)' : 'transparent',
                color: activeStep === 'specimen' ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer'
              }}
            >
              4. Specimen
            </button>
          </div>

          {/* STEP 1: Family Details */}
          {activeStep === "details" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Step 1</span>
                <h4 style={{ margin: '4px 0 12px 0', fontSize: '0.9rem', color: 'var(--text)' }}>Family Metadata</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Font ID*</label>
                    <input 
                      type="text" value={fontForm.id} disabled={!isNew}
                      onChange={e => setFontForm(prev => ({ ...prev, id: e.target.value }))}
                      style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Family Name (Հայերեն)*</label>
                    <input 
                      type="text" value={fontForm.name_am}
                      onChange={e => setFontForm(prev => ({ ...prev, name_am: e.target.value }))}
                      style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Family Name (English)*</label>
                    <input 
                      type="text" value={fontForm.name_en}
                      onChange={e => setFontForm(prev => ({ ...prev, name_en: e.target.value }))}
                      style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Category</label>
                      <select 
                        value={fontForm.category}
                        onChange={e => setFontForm(prev => ({ ...prev, category: e.target.value }))}
                        style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                      >
                        <option value="Sans-Serif">Sans-Serif</option>
                        <option value="Serif">Serif</option>
                        <option value="Display">Display</option>
                        <option value="Monospace">Monospace</option>
                        <option value="Variable">Variable</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Year</label>
                      <input 
                        type="text" value={fontForm.year}
                        onChange={e => setFontForm(prev => ({ ...prev, year: e.target.value }))}
                        style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Designer / Foundry</label>
                    <input 
                      type="text" value={fontForm.creator}
                      onChange={e => setFontForm(prev => ({ ...prev, creator: e.target.value }))}
                      style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveStep("files")} style={{ width: '100%', height: '36px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Հաջորդը՝ Files →</button>
            </div>
          )}

          {/* STEP 2: Files & Styles */}
          {activeStep === "files" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Step 2</span>
                <h4 style={{ margin: '4px 0 12px 0', fontSize: '0.9rem', color: 'var(--text)' }}>Font Source Files</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'var(--input-bg)', border: '1px dashed var(--input-border)', padding: '16px', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>Upload OTF, TTF package file</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <label style={{
                        padding: '8px 16px', background: 'rgba(0, 255, 204, 0.1)', border: '1px solid rgba(0, 255, 204, 0.3)',
                        borderRadius: '6px', color: 'var(--accent)', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-block', fontWeight: 600
                      }}>
                        {uploadingFontFile ? 'Վերբեռնվում է...' : '⬆ Վերբեռնել համակարգչից'}
                        <input type="file" accept=".ttf,.otf" onChange={handleFontFileUpload} disabled={uploadingFontFile} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setMediaPickerConfig({
                          isOpen: true,
                          target: 'font_file',
                          allowedTypes: ['font'],
                          title: 'Ընտրել Տառատեսակի Նիշք (Font File)',
                          currentValue: fontForm.font_file_url
                        })}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(74, 137, 124, 0.15)',
                          border: '1px solid var(--accent)',
                          borderRadius: '6px',
                          color: 'var(--accent)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        📁 Ընտրել Դարանից
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Active Font Path (URL)</label>
                    <input 
                      type="text" value={fontForm.font_file_url}
                      onChange={e => setFontForm(prev => ({ ...prev, font_file_url: e.target.value, download_url: e.target.value }))}
                      style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                    />
                  </div>

                  {fontForm.font_file_url && (
                    <div style={{ background: 'rgba(102,187,106,0.1)', border: '1px solid rgba(102,187,106,0.2)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#66bb6a', fontSize: '1rem' }}>✓</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        File successfully registered
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setActiveStep("details")} style={{ flex: 1, height: '36px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
                <button onClick={() => setActiveStep("pricing")} style={{ flex: 1, height: '36px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Licensing */}
          {activeStep === "pricing" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Step 3</span>
                <h4 style={{ margin: '4px 0 12px 0', fontSize: '0.9rem', color: 'var(--text)' }}>Rights & Pricing</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text)' }}>
                    <input 
                      type="checkbox" checked={fontForm.downloadable}
                      onChange={e => setFontForm(prev => ({ ...prev, downloadable: e.target.checked }))}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    Mark as Free Downloadable
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text)' }}>
                    <input 
                      type="checkbox" checked={fontForm.paid}
                      onChange={e => setFontForm(prev => ({ ...prev, paid: e.target.checked }))}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    Paid Commercial License
                  </label>

                  {fontForm.paid && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', borderTop: '1px solid var(--input-border)', paddingTop: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Price tag (e.g. $19)</label>
                        <input 
                          type="text" placeholder="$19.00" value={fontForm.price}
                          onChange={e => setFontForm(prev => ({ ...prev, price: e.target.value }))}
                          style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Purchase Link (URL)</label>
                        <input 
                          type="text" placeholder="https://myfonts.com/..." value={fontForm.purchase_url}
                          onChange={e => setFontForm(prev => ({ ...prev, purchase_url: e.target.value }))}
                          style={{ width: '100%', height: '34px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '6px', padding: '0 8px', color: 'var(--text)', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setActiveStep("files")} style={{ flex: 1, height: '36px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
                <button onClick={() => setActiveStep("specimen")} style={{ flex: 1, height: '36px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Next →</button>
              </div>
            </div>
          )}

          {/* STEP 4: Specimen Showcase Builder */}
          {activeStep === "specimen" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase' }}>Step 4</span>
                <h4 style={{ margin: '4px 0 12px 0', fontSize: '0.9rem', color: 'var(--text)' }}>Showcase Builder</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {blocks.map((block, index) => (
                    <div key={index} style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>
                          #{index + 1}: {block.type}
                        </span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} style={{ padding: '1px 4px', background: 'var(--btn-bg)', border: 'none', borderRadius: '3px', color: 'var(--text)', fontSize: '0.65rem', cursor: 'pointer' }}>↑</button>
                          <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} style={{ padding: '1px 4px', background: 'var(--btn-bg)', border: 'none', borderRadius: '3px', color: 'var(--text)', fontSize: '0.65rem', cursor: 'pointer' }}>↓</button>
                          <button type="button" onClick={() => deleteBlock(index)} style={{ padding: '1px 4px', background: 'rgba(255,107,107,0.15)', border: 'none', borderRadius: '3px', color: '#ff6b6b', fontSize: '0.65rem', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>

                      {block.type === 'text' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <input 
                              type="text" placeholder="Title (Armenian)" value={block.title_am} 
                              onChange={e => updateBlock(index, { ...block, title_am: e.target.value })}
                              style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                            />
                            <input 
                              type="text" placeholder="Title (English)" value={block.title_en || ''} 
                              onChange={e => updateBlock(index, { ...block, title_en: e.target.value })}
                              style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <textarea 
                              placeholder="Content (Armenian)" value={block.content_am} 
                              onChange={e => updateBlock(index, { ...block, content_am: e.target.value })}
                              style={{ width: '100%', minHeight: '40px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '6px', color: 'var(--text)', fontSize: '0.75rem', resize: 'vertical' }}
                            />
                            <textarea 
                              placeholder="Content (English)" value={block.content_en || ''} 
                              onChange={e => updateBlock(index, { ...block, content_en: e.target.value })}
                              style={{ width: '100%', minHeight: '40px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '6px', color: 'var(--text)', fontSize: '0.75rem', resize: 'vertical' }}
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'specimen_banner' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input 
                            type="text" placeholder="Preview Text" value={block.previewText} 
                            onChange={e => updateBlock(index, { ...block, previewText: e.target.value })}
                            style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--muted)' }}>
                            <span>Size: {block.size}px</span>
                            <input 
                              type="range" min="14" max="120" value={block.size} 
                              onChange={e => updateBlock(index, { ...block, size: Number(e.target.value) })}
                              style={{ width: '80px', accentColor: 'var(--accent)' }}
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'weights_comparison' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <input 
                              type="text" placeholder="Title (Armenian)" value={block.title_am} 
                              onChange={e => updateBlock(index, { ...block, title_am: e.target.value })}
                              style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                            />
                            <input 
                              type="text" placeholder="Title (English)" value={block.title_en || ''} 
                              onChange={e => updateBlock(index, { ...block, title_en: e.target.value })}
                              style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                            />
                          </div>
                          <input 
                            type="text" placeholder="Sample pangram..." value={block.previewText} 
                            onChange={e => updateBlock(index, { ...block, previewText: e.target.value })}
                            style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                          />
                        </div>
                      )}

                      {block.type === 'glyph_showcase' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <input 
                              type="text" placeholder="Title (Armenian)" value={block.title_am} 
                              onChange={e => updateBlock(index, { ...block, title_am: e.target.value })}
                              style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                            />
                            <input 
                              type="text" placeholder="Title (English)" value={block.title_en || ''} 
                              onChange={e => updateBlock(index, { ...block, title_en: e.target.value })}
                              style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                            />
                          </div>
                          <input 
                            type="text" placeholder="Characters (split with space)" value={block.letters} 
                            onChange={e => updateBlock(index, { ...block, letters: e.target.value })}
                            style={{ width: '100%', height: '28px', background: 'var(--panel)', border: '1px solid var(--input-border)', borderRadius: '4px', padding: '0 6px', color: 'var(--text)', fontSize: '0.75rem' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <button onClick={() => addBlock('text')} style={{ flex: '1 1 45%', padding: '6px', background: 'rgba(0,136,254,0.1)', border: 'none', borderRadius: '4px', color: '#0088fe', fontSize: '0.7rem', cursor: 'pointer' }}>+ Text</button>
                  <button onClick={() => addBlock('specimen_banner')} style={{ flex: '1 1 45%', padding: '6px', background: 'rgba(255,187,40,0.1)', border: 'none', borderRadius: '4px', color: '#fbbf24', fontSize: '0.7rem', cursor: 'pointer' }}>+ Banner</button>
                  <button onClick={() => addBlock('weights_comparison')} style={{ flex: '1 1 45%', padding: '6px', background: 'rgba(255,128,66,0.1)', border: 'none', borderRadius: '4px', color: '#f97316', fontSize: '0.7rem', cursor: 'pointer' }}>+ Weights</button>
                  <button onClick={() => addBlock('glyph_showcase')} style={{ flex: '1 1 45%', padding: '6px', background: 'rgba(167,243,208,0.15)', border: 'none', borderRadius: '4px', color: '#34d399', fontSize: '0.7rem', cursor: 'pointer' }}>+ Glyphs</button>
                </div>
              </div>

              <button onClick={() => setActiveStep("pricing")} style={{ width: '100%', height: '36px', background: 'var(--btn-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
            </div>
          )}

        </div>

      </div>

      {mediaPickerConfig?.isOpen && (
        <MediaPickerModal
          isOpen={mediaPickerConfig.isOpen}
          onClose={() => setMediaPickerConfig(null)}
          onSelect={handleMediaPickerSelect}
          multiple={mediaPickerConfig.multiple}
          allowedTypes={mediaPickerConfig.allowedTypes}
          title={mediaPickerConfig.title}
          token={token}
          currentValue={mediaPickerConfig.currentValue}
        />
      )}

    </div>
  );
}
