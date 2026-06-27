"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load auth token & initial font data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("hdesign_admin_token");
      if (!savedToken) {
        alert("Խնդրում ենք նախ մուտք գործել ադմինիստրատորի համակարգ:");
        router.push("/admin");
        return;
      }
      setToken(savedToken);
      loadFont(savedToken);
    }
  }, [id]);

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
        alert("Տառատեսակը հաջողությամբ պահպանվեց:");
        router.push("/admin?tab=fonts");
      } else {
        alert("Սխալ՝ " + (data.error || "Չհաջողվեց պահպանել"));
      }
    } catch (err) {
      alert("Կապի սխալ: Չհաջողվեց պահպանել տառատեսակը:");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#0a0a0c', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <h3>Բեռնվում է WYSIWYG խմբագրիչը...</h3>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0c', color: '#eaeaea', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Dynamic Font Injection for Previewing */}
      {fontForm.font_file_url && (
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'wysiwyg-preview-font-${fontForm.id}';
            src: url('${fontForm.font_file_url}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        ` }} />
      )}

      {/* Top sticky editor bar */}
      <div style={{
        height: '70px', background: '#121216', borderBottom: '1px solid #22222a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin?tab=fonts" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
              ← Հետ դեպի Ադմին
            </button>
          </Link>
          <span style={{ fontSize: '0.9rem', color: '#888' }}>|</span>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
            {isNew ? 'Ավելացնել Նոր Տառատեսակ' : `Խմբագրել՝ ${fontForm.name_am}`}
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
            {saving ? 'Պահպանվում է...' : 'Պահպանել տառատեսակը'}
          </button>
        </div>
      </div>

      {/* Editor Main Content: Split layout (3/4 left preview, 1/4 right tools sidebar) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
        
        {/* Left Side: Real-time Live Specimen Showcase Preview (3/4 of the width) */}
        <div style={{ background: '#07070a', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)', padding: '48px', boxSizing: 'border-box' }}>
          
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            {/* Header info */}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#ffcc00', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 800 }}>
                {fontForm.category} • {fontForm.creator}
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', margin: '12px 0 0 0' }}>
                {fontForm.name_am || 'Տառատեսակի անուն'}
              </h1>
            </div>

            {/* Specimen Blocks rendering */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {blocks.length === 0 ? (
                <div style={{ border: '2px dashed #333', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#666' }}>
                  <h4>Ցուցադրման բլոկներ չկան</h4>
                  <p style={{ fontSize: '0.85rem' }}>Ավելացրեք նմուշներ, գլիֆների ցանց կամ տեքստեր աջակողմյան վահանակից՝ ձեր տառատեսակը ցուցադրելու համար:</p>
                </div>
              ) : (
                blocks.map((block, idx) => {
                  if (block.type === 'text') {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
                        {(block.title_am || block.title_en) && (
                          <h4 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                            {block.title_am || block.title_en}
                          </h4>
                        )}
                        <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#aaa', margin: 0, whiteSpace: 'pre-line' }}>
                          {block.content_am || block.content_en}
                        </p>
                      </div>
                    );
                  }

                  if (block.type === 'specimen_banner' && block.previewText) {
                    return (
                      <div key={idx} style={{ padding: '36px', background: '#121216', borderRadius: '16px', border: '1px solid #222', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.72rem', color: '#666', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Specimen Banner ({block.size || 54}px)</span>
                        <div style={{ 
                          fontFamily: fontForm.font_file_url ? `wysiwyg-preview-font-${fontForm.id}` : 'sans-serif', 
                          fontSize: `${block.size || 54}px`, 
                          color: '#fff', 
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
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>{block.title_am || block.title_en}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {weightList.map((w, wIdx) => (
                            <div key={wIdx} style={{ display: 'flex', gap: '16px', alignItems: 'baseline', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#666', width: '80px' }}>Weight {w}</span>
                              <div style={{ 
                                fontFamily: fontForm.font_file_url ? `wysiwyg-preview-font-${fontForm.id}` : 'sans-serif', 
                                fontSize: '1.8rem', 
                                color: '#fff', 
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
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>{block.title_am || block.title_en}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '12px' }}>
                          {lettersList.map((letter, lIdx) => (
                            <div key={lIdx} style={{ height: '110px', background: '#121216', border: '1px solid #222', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ 
                                fontFamily: fontForm.font_file_url ? `wysiwyg-preview-font-${fontForm.id}` : 'sans-serif', 
                                fontSize: '3rem', 
                                color: '#fff', 
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
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' }}>
                          <img src={block.image_url} alt="Font graphic" style={{ width: '100%', display: 'block' }} />
                        </div>
                        {(block.caption_am || block.caption_en) && (
                          <span style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
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

        {/* Right Side: Tools Sidebar Pane (1/4 of the width) */}
        <div style={{
          background: '#121216', borderLeft: '1px solid #22222a',
          padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)',
          display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
          
          {/* Metadata Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
              Տառատեսակի Տվյալներ
            </span>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Տառատեսակի ID*</label>
              <input 
                type="text" 
                value={fontForm.id} 
                disabled={!isNew}
                onChange={e => setFontForm(prev => ({ ...prev, id: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Անուն (Հայերեն)*</label>
              <input 
                type="text" 
                value={fontForm.name_am} 
                onChange={e => setFontForm(prev => ({ ...prev, name_am: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Name (English)*</label>
              <input 
                type="text" 
                value={fontForm.name_en} 
                onChange={e => setFontForm(prev => ({ ...prev, name_en: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Կատեգորիա</label>
                <select 
                  value={fontForm.category} 
                  onChange={e => setFontForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="Sans-Serif">Sans-Serif</option>
                  <option value="Serif">Serif</option>
                  <option value="Display">Display</option>
                  <option value="Monospace">Monospace</option>
                  <option value="Variable">Variable</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Տարեթիվ</label>
                <input 
                  type="text" 
                  value={fontForm.year} 
                  onChange={e => setFontForm(prev => ({ ...prev, year: e.target.value }))}
                  style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Հեղինակ</label>
              <input 
                type="text" 
                value={fontForm.creator} 
                onChange={e => setFontForm(prev => ({ ...prev, creator: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            {/* Font File Uploader */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Տառատեսակի Ֆայլ (.TTF, .OTF)*</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={fontForm.font_file_url} 
                  placeholder="/uploads/my-font.ttf"
                  onChange={e => setFontForm(prev => ({ ...prev, font_file_url: e.target.value, download_url: e.target.value }))}
                  style={{ flex: 1, height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
                />
                <label style={{ height: '36px', padding: '0 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid #444', borderRadius: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.78rem', color: '#fff' }}>
                  {uploadingFontFile ? '...' : 'Վերբեռնել'}
                  <input type="file" accept=".ttf,.otf" onChange={handleFontFileUpload} disabled={uploadingFontFile} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* Checkboxes/Switches for Downloadable & Paid */}
            <div style={{ 
              display: 'flex', flexDirection: 'column', gap: '10px',
              background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid #333'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={fontForm.downloadable} 
                  onChange={e => setFontForm(prev => ({ ...prev, downloadable: e.target.checked }))} 
                  style={{ accentColor: '#00ffcc', cursor: 'pointer' }}
                />
                Անվճար ներբեռնելի (Downloadable)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={fontForm.paid} 
                  onChange={e => setFontForm(prev => ({ ...prev, paid: e.target.checked }))} 
                  style={{ accentColor: '#00ffcc', cursor: 'pointer' }}
                />
                Վճարովի (Commercial License)
              </label>

              {fontForm.paid && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="Գինը (օրինակ՝ $29 կամ 15,000 ֏)..." 
                    value={fontForm.price} 
                    onChange={e => setFontForm(prev => ({ ...prev, price: e.target.value }))}
                    style={{ width: '100%', height: '32px', background: '#1e1e24', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Գնելու հղում (URL)..." 
                    value={fontForm.purchase_url} 
                    onChange={e => setFontForm(prev => ({ ...prev, purchase_url: e.target.value }))}
                    style={{ width: '100%', height: '32px', background: '#1e1e24', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Blocks Builder List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #22222a', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
              Շնորհանդեսի Բլոկներ
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blocks.map((block, index) => (
                <div key={index} style={{ background: '#1a1a22', border: '1px solid #333', borderRadius: '8px', padding: '12px' }}>
                  
                  {/* Block Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00ffcc', textTransform: 'uppercase' }}>
                      #{index + 1}: {block.type === 'text' ? 'Տեքստ' : block.type === 'image' ? 'Նկար' : block.type === 'specimen_banner' ? 'Specimen Banner' : block.type === 'weights_comparison' ? 'Հաստություններ' : 'Գլիֆներ'}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} style={{ padding: '2px 6px', background: '#2a2a35', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '0.7rem' }}>↑</button>
                      <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} style={{ padding: '2px 6px', background: '#2a2a35', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '0.7rem' }}>↓</button>
                      <button type="button" onClick={() => deleteBlock(index)} style={{ padding: '2px 6px', background: 'rgba(255,107,107,0.15)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.7rem' }}>✕</button>
                    </div>
                  </div>

                  {/* Block Forms */}
                  {block.type === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Հայերեն վերնագիր..." 
                        value={block.title_am} 
                        onChange={e => updateBlock(index, { ...block, title_am: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Անգլերեն վերնագիր..." 
                        value={block.title_en} 
                        onChange={e => updateBlock(index, { ...block, title_en: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <textarea 
                        placeholder="Հայերեն տեքստ..." 
                        value={block.content_am} 
                        onChange={e => updateBlock(index, { ...block, content_am: e.target.value })}
                        style={{ width: '100%', minHeight: '60px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '0.8rem', resize: 'vertical' }}
                      />
                      <textarea 
                        placeholder="Անգլերեն տեքստ..." 
                        value={block.content_en} 
                        onChange={e => updateBlock(index, { ...block, content_en: e.target.value })}
                        style={{ width: '100%', minHeight: '60px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '0.8rem', resize: 'vertical' }}
                      />
                    </div>
                  )}

                  {block.type === 'image' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input 
                          type="text" 
                          placeholder="Նկարի հղում (URL)..." 
                          value={block.image_url} 
                          onChange={e => updateBlock(index, { ...block, image_url: e.target.value })}
                          style={{ flex: 1, height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <label style={{ height: '30px', padding: '0 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid #444', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.72rem', color: '#fff' }}>
                          Վերբեռնել
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !token) return;
                              const fd = new FormData();
                              fd.append('file', file);
                              try {
                                const res = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': token }, body: fd });
                                const d = await res.json();
                                if (res.ok && d.url) {
                                  updateBlock(index, { ...block, image_url: d.url });
                                }
                              } catch(err) {}
                            }} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Հայերեն Caption..." 
                        value={block.caption_am || ''} 
                        onChange={e => updateBlock(index, { ...block, caption_am: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {block.type === 'specimen_banner' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Ցուցադրման տեքստ..." 
                        value={block.previewText} 
                        onChange={e => updateBlock(index, { ...block, previewText: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem' }}>Տառաչափս (`{block.size || 64}`px)</span>
                        <input 
                          type="range" min="14" max="120" value={block.size || 64}
                          onChange={e => updateBlock(index, { ...block, size: Number(e.target.value) })}
                          style={{ width: '100px', accentColor: '#00ffcc' }}
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'weights_comparison' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Հայերեն վերնագիր..." 
                        value={block.title_am} 
                        onChange={e => updateBlock(index, { ...block, title_am: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Անգլերեն վերնագիր..." 
                        value={block.title_en} 
                        onChange={e => updateBlock(index, { ...block, title_en: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Ցուցադրման տեքստ..." 
                        value={block.previewText} 
                        onChange={e => updateBlock(index, { ...block, previewText: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {block.type === 'glyph_showcase' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Հայերեն վերնագիր..." 
                        value={block.title_am} 
                        onChange={e => updateBlock(index, { ...block, title_am: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Անգլերեն վերնագիր..." 
                        value={block.title_en} 
                        onChange={e => updateBlock(index, { ...block, title_en: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Նիշեր (Ա Բ Գ Դ)..." 
                        value={block.letters} 
                        onChange={e => updateBlock(index, { ...block, letters: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Quick insert bar */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #22222a', paddingTop: '16px' }}>
              <button onClick={() => addBlock('text')} style={{ flex: '1 1 45%', padding: '8px', background: 'rgba(0, 136, 254, 0.15)', border: '1px solid rgba(0, 136, 254, 0.3)', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Տեքստ</button>
              <button onClick={() => addBlock('image')} style={{ flex: '1 1 45%', padding: '8px', background: 'rgba(0, 196, 159, 0.15)', border: '1px solid rgba(0, 196, 159, 0.3)', borderRadius: '6px', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Նկար</button>
              <button onClick={() => addBlock('specimen_banner')} style={{ flex: '1 1 45%', padding: '8px', background: 'rgba(255, 187, 40, 0.15)', border: '1px solid rgba(255, 187, 40, 0.3)', borderRadius: '6px', color: '#fbbf24', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Specimen Banner</button>
              <button onClick={() => addBlock('weights_comparison')} style={{ flex: '1 1 45%', padding: '8px', background: 'rgba(255, 128, 66, 0.15)', border: '1px solid rgba(255, 128, 66, 0.3)', borderRadius: '6px', color: '#f97316', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Հաստություններ</button>
              <button onClick={() => addBlock('glyph_showcase')} style={{ flex: '1 1 100%', padding: '8px', background: 'rgba(167, 243, 208, 0.2)', border: '1px solid rgba(167, 243, 208, 0.4)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Գլիֆներ</button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
