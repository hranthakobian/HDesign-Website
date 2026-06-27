"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { brandingCases as staticCases } from "@/lib/brandingData";

type CaseBlock = 
  | { type: 'text'; title_am: string; title_en: string; content_am: string; content_en: string }
  | { type: 'image'; image_url: string; caption_am?: string; caption_en?: string; fullWidth: boolean }
  | { type: 'embed'; embed_url: string }
  | { type: 'color_palette'; colors: string[] }
  | { type: 'typography_showcase'; fonts: string[]; previewText?: string };

type Case = {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  image_url: string;
  details: string;
  category: string;
  client: string;
  year: string;
};

export default function CaseWysiwygEditor() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const isNew = searchParams?.get("new") === "true";

  const [token, setToken] = useState<string | null>(null);
  const [caseForm, setCaseForm] = useState<Case>({
    id: id || "",
    title: "",
    subtitle: "",
    bg: "linear-gradient(135deg, #172a45 0%, #0a192f 100%)",
    image_url: "",
    details: "[]",
    category: "Branding",
    client: "HDesign Client",
    year: new Date().getFullYear().toString()
  });

  const [blocks, setBlocks] = useState<CaseBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load auth token & initial case data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("hdesign_admin_token");
      if (!savedToken) {
        alert("Խնդրում ենք նախ մուտք գործել ադմինիստրատորի համակարգ:");
        router.push("/admin");
        return;
      }
      setToken(savedToken);
      loadCase(savedToken);
    }
  }, [id]);

  async function loadCase(authToken: string) {
    try {
      const res = await fetch("/api/cases");
      if (!res.ok) throw new Error("Failed to load cases");
      const casesData = await res.json();
      const found = (casesData || []).find((c: any) => c.id === id);

      if (found) {
        setCaseForm({
          id: found.id,
          title: found.title || "",
          subtitle: found.subtitle || "",
          bg: found.bg || "#0a0a0a",
          image_url: found.image_url || "",
          details: found.details || "[]",
          category: found.category || "Branding",
          client: found.client || "",
          year: found.year || ""
        });
        parseBlocks(found.details || "[]");
      } else if (isNew) {
        // Prepare new case template
        setCaseForm({
          id: id,
          title: "Նոր Նախագիծ",
          subtitle: "Նախագծի ենթավերնագիր կամ կարճ նկարագրություն",
          bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          image_url: "",
          details: "[]",
          category: "Branding",
          client: "HDesign Studio",
          year: new Date().getFullYear().toString()
        });
        setBlocks([
          { type: 'text', title_am: 'Նախագծի Մասին', title_en: 'About the Project', content_am: 'Այստեղ գրեք նախագծի հայերեն մանրամասն նկարագրությունը...', content_en: 'Write English detailed description of the project here...' }
        ]);
      } else {
        // Fallback to static seed data
        const staticFound = staticCases.find((c) => c.id === id);
        if (staticFound) {
          setCaseForm({
            id: staticFound.id,
            title: staticFound.title,
            subtitle: staticFound.tagline,
            bg: staticFound.color,
            image_url: staticFound.image,
            details: JSON.stringify([
              { type: 'text', title_am: 'Նախագծի Մասին', title_en: 'About the Project', content_am: staticFound.description, content_en: staticFound.description },
              { type: 'text', title_am: 'Կոնցեպտուալ Լուծում', title_en: 'Conceptual Solution', content_am: staticFound.concept, content_en: staticFound.concept },
              { type: 'color_palette', colors: staticFound.colors },
              { type: 'typography_showcase', fonts: [staticFound.typography], previewText: 'Հրանտ Հակոբյան Դիզայն' }
            ]),
            category: "Branding",
            client: "HDesign Studio",
            year: "2026"
          });
          setBlocks([
            { type: 'text', title_am: 'Նախագծի Մասին', title_en: 'About the Project', content_am: staticFound.description, content_en: staticFound.description },
            { type: 'text', title_am: 'Կոնցեպտուալ Լուծում', title_en: 'Conceptual Solution', content_am: staticFound.concept, content_en: staticFound.concept },
            { type: 'color_palette', colors: staticFound.colors },
            { type: 'typography_showcase', fonts: [staticFound.typography], previewText: 'Հրանտ Հակոբյան Դիզայն' }
          ]);
        } else {
          // If not found, make a new item template anyway
          setCaseForm(prev => ({ ...prev, id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function parseBlocks(detailsStr: string) {
    if (detailsStr.startsWith("[")) {
      try {
        setBlocks(JSON.parse(detailsStr));
        return;
      } catch (e) {}
    }
    setBlocks([
      { type: 'text', title_am: 'Նախագծի Մասին', title_en: 'About the Project', content_am: detailsStr, content_en: detailsStr }
    ]);
  }

  // Block Builder Helpers
  const addBlock = (type: CaseBlock["type"]) => {
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
      newBlock.fullWidth = true;
    } else if (type === 'embed') {
      newBlock.embed_url = '';
    } else if (type === 'color_palette') {
      newBlock.colors = ['#1a1a1a', '#ffffff', '#00ffcc'];
    } else if (type === 'typography_showcase') {
      newBlock.fonts = ['Outfit'];
      newBlock.previewText = 'Հրանտ Հակոբյան Դիզայն 2026';
    }
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (idx: number, updated: CaseBlock) => {
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

  // Image Upload handler for cover image or block images
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    setUploading(true);
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
        setCaseForm(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || 'Վերբեռնումը ձախողվեց:');
      }
    } catch (err) {
      alert('Սխալ վերբեռնման ընթացքում:');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !caseForm.title || !caseForm.subtitle) {
      alert("Խնդրում ենք լրացնել վերնագիրը և ենթավերնագիրը:");
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? '/api/cases' : `/api/cases/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const finalPayload = {
        ...caseForm,
        details: JSON.stringify(blocks)
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
        alert("Նախագիծը հաջողությամբ պահպանվեց:");
        router.push("/admin?tab=cases");
      } else {
        alert("Սխալ՝ " + (data.error || "Չհաջողվեց պահպանել"));
      }
    } catch (err) {
      alert("Կապի սխալ: Չհաջողվեց պահպանել նախագիծը:");
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
      
      {/* Top sticky editor bar */}
      <div style={{
        height: '70px', background: '#121216', borderBottom: '1px solid #22222a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin?tab=cases" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
              ← Հետ դեպի Ադմին
            </button>
          </Link>
          <span style={{ fontSize: '0.9rem', color: '#888' }}>|</span>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
            {isNew ? 'Ավելացնել Նոր Քեյս' : `Խմբագրել՝ ${caseForm.title}`}
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
            {saving ? 'Պահպանվում է...' : 'Պահպանել նախագիծը'}
          </button>
        </div>
      </div>

      {/* Editor Main Content: Split layout (3/4 left preview, 1/4 right tools sidebar) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
        
        {/* Left Side: Real-time Live Preview Pane (3/4 of the width) */}
        <div style={{ background: '#07070a', overflowY: 'auto', maxHeight: 'calc(100vh - 70px)', paddingBottom: '100px' }}>
          
          {/* Cover Hero Banner Preview */}
          <div style={{
            width: '100%', height: '42vh', background: caseForm.bg,
            position: 'relative', display: 'flex', alignItems: 'flex-end', overflow: 'hidden'
          }}>
            {caseForm.image_url && (
              <img src={caseForm.image_url} alt="Cover Preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 70%)' }} />
            
            <div style={{ position: 'relative', zIndex: 10, padding: '36px', width: '100%' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#ffcc00', letterSpacing: '2px' }}>
                {caseForm.category || 'BRANDING'}
              </span>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '8px 0 4px 0' }}>
                {caseForm.title || 'Նախագծի վերնագիր'}
              </h1>
              <p style={{ fontSize: '1rem', color: '#ccc', margin: 0, maxWidth: '600px' }}>
                {caseForm.subtitle || 'Նախագծի կարճ նկարագրություն'}
              </p>
            </div>
          </div>

          {/* Project Details Columns */}
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '48px' }}>
            
            {/* Left Block Preview Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', minWidth: 0 }}>
              {blocks.length === 0 ? (
                <div style={{ border: '2px dashed #333', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#666' }}>
                  <h4>Նախագիծը դատարկ է</h4>
                  <p style={{ fontSize: '0.85rem' }}>Ավելացրեք տեքստային կամ մեդիա բլոկներ աջակողմյան վահանակից՝ էջի բովանդակությունը ձևավորելու համար:</p>
                </div>
              ) : (
                blocks.map((block, idx) => {
                  if (block.type === 'text') {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(block.title_am || block.title_en) && (
                          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                            {block.title_am || block.title_en}
                          </h2>
                        )}
                        <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#bbb', margin: 0, whiteSpace: 'pre-line' }}>
                          {block.content_am || block.content_en}
                        </p>
                      </div>
                    );
                  }

                  if (block.type === 'image' && block.image_url) {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #222', maxWidth: block.fullWidth ? '100%' : '560px' }}>
                          <img src={block.image_url} alt="Specimen block" style={{ width: '100%', display: 'block' }} />
                        </div>
                        {(block.caption_am || block.caption_en) && (
                          <span style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                            {block.caption_am || block.caption_en}
                          </span>
                        )}
                      </div>
                    );
                  }

                  if (block.type === 'embed' && block.embed_url) {
                    let embedSrc = block.embed_url;
                    if (embedSrc.includes('youtube.com/watch?v=')) {
                      embedSrc = `https://www.youtube.com/embed/${embedSrc.split('v=')[1].split('&')[0]}`;
                    } else if (embedSrc.includes('youtu.be/')) {
                      embedSrc = `https://www.youtube.com/embed/${embedSrc.split('youtu.be/')[1]}`;
                    }
                    return (
                      <div key={idx} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' }}>
                        <iframe src={embedSrc} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                      </div>
                    );
                  }

                  if (block.type === 'color_palette' && block.colors) {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#fff' }}>Բրենդի Գունապնակ (Brand Palette)</h4>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {block.colors.map((color, cIdx) => (
                            <div key={cIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: color, border: '2px solid #222' }} />
                              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#aaa' }}>{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'typography_showcase' && block.fonts) {
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#fff' }}>Տառատեսակներ (Typography Showcase)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {block.fonts.map((fName, fIdx) => (
                            <div key={fIdx} style={{ padding: '16px', background: '#121216', borderRadius: '10px', border: '1px solid #222' }}>
                              <span style={{ fontSize: '0.75rem', color: '#888' }}>{fName}</span>
                              <div style={{ fontFamily: `${fName}, sans-serif`, fontSize: '1.6rem', marginTop: '6px', color: '#fff' }}>
                                {block.previewText || 'Հրանտ Հակոբյան Դիզայն'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })
              )}
            </div>

            {/* Right Meta Sidebar Preview */}
            <div style={{
              background: '#121216', border: '1px solid #22222a', borderRadius: '16px',
              padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
              height: 'fit-content'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Կարգ</span>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '3px' }}>{caseForm.category || 'Branding'}</div>
              </div>
              {caseForm.client && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Հաճախորդ</span>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '3px' }}>{caseForm.client}</div>
                </div>
              )}
              {caseForm.year && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Տարեթիվ</span>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '3px' }}>{caseForm.year}</div>
                </div>
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
              Նախագծի Տվյալներ (Metadata)
            </span>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Նախագծի ID*</label>
              <input 
                type="text" 
                value={caseForm.id} 
                disabled={!isNew}
                onChange={e => setCaseForm(prev => ({ ...prev, id: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Վերնագիր*</label>
              <input 
                type="text" 
                value={caseForm.title} 
                onChange={e => setCaseForm(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Ենթավերնագիր*</label>
              <input 
                type="text" 
                value={caseForm.subtitle} 
                onChange={e => setCaseForm(prev => ({ ...prev, subtitle: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Կատեգորիա</label>
                <input 
                  type="text" 
                  value={caseForm.category} 
                  onChange={e => setCaseForm(prev => ({ ...prev, category: e.target.value }))}
                  style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Տարեթիվ</label>
                <input 
                  type="text" 
                  value={caseForm.year} 
                  onChange={e => setCaseForm(prev => ({ ...prev, year: e.target.value }))}
                  style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Հաճախորդ</label>
              <input 
                type="text" 
                value={caseForm.client} 
                onChange={e => setCaseForm(prev => ({ ...prev, client: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Ֆոնի CSS / Gradient</label>
              <input 
                type="text" 
                value={caseForm.bg} 
                onChange={e => setCaseForm(prev => ({ ...prev, bg: e.target.value }))}
                style={{ width: '100%', height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Cover նկար (URL կամ Վերբեռնել)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={caseForm.image_url} 
                  onChange={e => setCaseForm(prev => ({ ...prev, image_url: e.target.value }))}
                  style={{ flex: 1, height: '36px', background: '#1e1e24', border: '1px solid #333', borderRadius: '6px', padding: '0 10px', color: '#fff', fontSize: '0.85rem' }} 
                />
                <label style={{ height: '36px', padding: '0 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid #444', borderRadius: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.78rem', color: '#fff' }}>
                  {uploading ? '...' : 'Վերբեռնել'}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploading} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

          </div>

          {/* Blocks Builder List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #22222a', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
              Բլոկների Կարգավորում
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blocks.map((block, index) => (
                <div key={index} style={{ background: '#1a1a22', border: '1px solid #333', borderRadius: '8px', padding: '12px' }}>
                  
                  {/* Block Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00ffcc', textTransform: 'uppercase' }}>
                      #{index + 1}: {block.type === 'text' ? 'Տեքստ' : block.type === 'image' ? 'Նկար' : block.type === 'embed' ? 'Տեսանյութ' : block.type === 'color_palette' ? 'Գույներ' : 'Տառատեսակներ'}
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
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer', marginTop: '2px' }}>
                        <input type="checkbox" checked={!!block.fullWidth} onChange={e => updateBlock(index, { ...block, fullWidth: e.target.checked })} style={{ accentColor: '#00ffcc' }} />
                        Ամբողջ լայնությամբ (Full Width)
                      </label>
                    </div>
                  )}

                  {block.type === 'embed' && (
                    <div>
                      <input 
                        type="text" 
                        placeholder="YouTube/Vimeo կամ Iframe հղում..." 
                        value={block.embed_url} 
                        onChange={e => updateBlock(index, { ...block, embed_url: e.target.value })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {block.type === 'color_palette' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(block.colors || []).map((col, cIdx) => (
                          <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#121216', padding: '3px', borderRadius: '4px', border: '1px solid #333' }}>
                            <input 
                              type="color" 
                              value={col} 
                              onChange={e => {
                                const newCols = [...(block.colors || [])];
                                newCols[cIdx] = e.target.value;
                                updateBlock(index, { ...block, colors: newCols });
                              }}
                              style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            />
                            <button type="button" onClick={() => {
                              const newCols = (block.colors || []).filter((_: any, i: number) => i !== cIdx);
                              updateBlock(index, { ...block, colors: newCols });
                            }} style={{ border: 'none', background: 'transparent', color: '#ff6b6b', cursor: 'pointer', padding: '0 4px', fontSize: '0.75rem' }}>✕</button>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => {
                            const newCols = [...(block.colors || []), '#ffffff'];
                            updateBlock(index, { ...block, colors: newCols });
                          }} 
                          style={{ padding: '4px 8px', background: '#2a2a35', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          + Գույն
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === 'typography_showcase' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Տառատեսակներ (Outfit, Inter)..." 
                        value={(block.fonts || []).join(', ')} 
                        onChange={e => updateBlock(index, { ...block, fonts: e.target.value.split(',').map(s => s.trim()) })}
                        style={{ width: '100%', height: '30px', background: '#121216', border: '1px solid #333', borderRadius: '4px', padding: '0 8px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Ցուցադրման տեքստ..." 
                        value={block.previewText || ''} 
                        onChange={e => updateBlock(index, { ...block, previewText: e.target.value })}
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
              <button onClick={() => addBlock('embed')} style={{ flex: '1 1 45%', padding: '8px', background: 'rgba(255, 187, 40, 0.15)', border: '1px solid rgba(255, 187, 40, 0.3)', borderRadius: '6px', color: '#fbbf24', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Տեսանյութ</button>
              <button onClick={() => addBlock('color_palette')} style={{ flex: '1 1 45%', padding: '8px', background: 'rgba(255, 128, 66, 0.15)', border: '1px solid rgba(255, 128, 66, 0.3)', borderRadius: '6px', color: '#f97316', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Գույներ</button>
              <button onClick={() => addBlock('typography_showcase')} style={{ flex: '1 1 100%', padding: '8px', background: 'rgba(167, 243, 208, 0.2)', border: '1px solid rgba(167, 243, 208, 0.4)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>+ Տառատեսակներ</button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
