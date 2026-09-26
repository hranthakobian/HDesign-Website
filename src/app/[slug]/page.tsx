import { notFound } from "next/navigation";
import { getPage } from "@/lib/themeEngine";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface DynamicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DynamicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || !page.is_published) {
    return { title: "Էջը չի գտնվել | HDesign" };
  }
  return {
    title: `${page.title} | HDesign`,
    description: page.meta?.meta_description || "HDesign Studio"
  };
}

export default async function DynamicCustomPage({ params }: DynamicPageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page || (!page.is_published && process.env.NODE_ENV === "production")) {
    notFound();
  }

  const visibleBlocks = (page.blocks || []).filter(b => !b.hidden);

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh", position: "relative", zIndex: 2 }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.8rem", fontWeight: 800, color: "var(--text, #0f172a)", marginBottom: "0.5rem" }}>
          {page.title}
        </h1>
        {page.meta?.meta_description && (
          <p style={{ color: "var(--muted, #64748b)", fontSize: "1.1rem", maxWidth: "700px" }}>
            {page.meta.meta_description}
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem", paddingBottom: "5rem" }}>
        {visibleBlocks.length === 0 ? (
          <div style={{
            padding: "4rem 2rem",
            textAlign: "center",
            background: "var(--panel, #ffffff)",
            borderRadius: "16px",
            border: "1px dashed var(--panel-border, #cbd5e1)",
            color: "var(--muted, #64748b)"
          }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Այս էջում բլոկներ ավելացված չեն:</p>
            <p style={{ fontSize: "0.9rem" }}>Օգտագործեք Admin Կառուցիչը՝ բլոկներ ավելացնելու համար:</p>
          </div>
        ) : (
          visibleBlocks.map(block => {
            const settings = block.settings || {};
            
            if (block.type === 'text') {
              return (
                <section key={block.id} data-block-id={block.id} data-block-type="text" className="hd-builder-editable-block" style={{
                  background: settings.bg_color || "var(--panel, #ffffff)",
                  padding: "2.5rem",
                  borderRadius: "16px",
                  border: "1px solid var(--panel-border, #e2e8f0)"
                }}>
                  {settings.title && (
                    <h2 data-editable-key="title" style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text)" }}>
                      {settings.title}
                    </h2>
                  )}
                  <div data-editable-key="content" style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "var(--text)", opacity: 0.9, whiteSpace: "pre-line" }}>
                    {settings.content || "Բովանդակություն առկա չէ:"}
                  </div>
                </section>
              );
            }

            if (block.type === 'features') {
              const items = settings.items || [];
              return (
                <section key={block.id} data-block-id={block.id} data-block-type="features" className="hd-builder-editable-block" style={{
                  background: settings.bg_color || "var(--panel, #ffffff)",
                  padding: "2.5rem",
                  borderRadius: "16px",
                  border: "1px solid var(--panel-border, #e2e8f0)"
                }}>
                  {settings.title && (
                    <h2 data-editable-key="title" style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--text)" }}>
                      {settings.title}
                    </h2>
                  )}
                  {settings.subtitle && (
                    <p data-editable-key="subtitle" style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "1.05rem" }}>
                      {settings.subtitle}
                    </p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {items.map((item: any, idx: number) => (
                      <div key={idx} style={{
                        padding: "1.5rem",
                        background: "var(--input-bg, #f8fafc)",
                        borderRadius: "12px",
                        border: "1px solid var(--panel-border, #e2e8f0)"
                      }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "0.75rem", color: "var(--primary-color, #083f39)" }}>
                          <span className={item.icon || "icon-Pattern"} />
                        </div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{item.title}</h3>
                        <p style={{ fontSize: "0.92rem", color: "var(--muted)", margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            // Fallback generic block
            return (
              <div key={block.id} data-block-id={block.id} data-block-type={block.type} className="hd-builder-editable-block" style={{
                padding: "2rem",
                background: "var(--panel, #ffffff)",
                borderRadius: "16px",
                border: "1px solid var(--panel-border, #e2e8f0)"
              }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  {settings.title || block.type}
                </h3>
                {settings.subtitle && <p style={{ color: "var(--muted)" }}>{settings.subtitle}</p>}
                {settings.bio && <p style={{ lineHeight: "1.7" }}>{settings.bio}</p>}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
