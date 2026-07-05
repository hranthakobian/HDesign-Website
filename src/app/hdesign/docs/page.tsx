"use client";

import { useState } from "react";
import Link from "next/link";

interface CodeExampleProps {
  title: string;
  code: string;
  description: string;
}

function CodeExample({ title, code, description }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "var(--shadow)" }}>
      <div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 6px 0" }}>{title}</h3>
        <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem" }}>{description}</p>
      </div>

      <div style={{ position: "relative" }}>
        <pre style={{ 
          background: "rgba(0,0,0,0.2)", 
          padding: "16px 20px", 
          borderRadius: "12px", 
          overflowX: "auto", 
          fontSize: "0.85rem", 
          fontFamily: "Courier New, monospace",
          margin: 0,
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          <code>{code}</code>
        </pre>
        <button 
          onClick={handleCopy}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "var(--btn-bg)",
            border: "1px solid var(--panel-border)",
            borderRadius: "6px",
            color: "var(--text)",
            padding: "4px 8px",
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
        >
          {copied ? "Պատճենված է" : "Պատճենել"}
        </button>
      </div>
    </div>
  );
}

export default function HDesignDocsPage() {
  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/hdesign" style={{ color: "var(--text)", textDecoration: "none", opacity: 0.7 }}>HDesign</Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ fontWeight: "bold" }}>Փաստաթղթեր</span>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>Ինչպես օգտագործել կոմպոնենտները</h1>
        <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.05rem", margin: 0, maxWidth: "700px" }}>
          HDesign-ի կոմպոնենտները գրանցված են որպես Custom Elements (Web Components) և կարող են օգտագործվել ցանկացած HTML/React նախագծում:
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px", marginBottom: "80px" }}>
        
        {/* Button example */}
        <CodeExample 
          title="Կոճակ (<hd-button>)"
          description="Կոճակը ունի պլաստիկ անցումային էֆեկտներ և ճարտարապետական եզրագծերի դիզայն: Աջակցում է custom չափսեր և գույներ:"
          code={`<hd-button 
  data-width="160px" 
  data-height="52px" 
  data-thickness="3px" 
  data-color="#083f39" 
  data-text-color="#ffffff"
>
  Սեղմել այստեղ
</hd-button>`}
        />

        {/* Input example */}
        <CodeExample 
          title="Մուտքագրման Դաշտ (<hd-input>)"
          description="Գծային մուտքագրման դաշտ placeholder-ներով և վիճակների (focus/hover) ինքնաշխատ փոփոխություններով ու caret-ի անիմացիայով:"
          code={`<hd-input 
  placeholder="Ներմուծեք ձեր էլ. հասցեն" 
  data-width="100%" 
  data-height="48px" 
  data-thickness="3px"
data-font-size="14pt" />`}
        />

        {/* Textarea example */}
        <CodeExample 
          title="Տեքստային Դաշտ (<hd-textarea>)"
          description="Բազմատող տեքստային դաշտ, որն աջակցում է նաև հորիզոնական չափափոխման արգելափակում: Օգտակար է նամակների և երկար տեքստերի համար:"
          code={`<hd-textarea 
  placeholder="Ձեր հաղորդագրությունը..." 
  data-width="100%" 
  data-height="120px" 
  data-thickness="3px"
  data-disable-horizontal-resize="true"
data-font-size="14pt" />`}
        />

        {/* Slider example */}
        <CodeExample 
          title="Սահիկ (<hd-slider>)"
          description="Սահիկ արժեքների ընտրության համար՝ նախագծված դիզայն համակարգի գծային սկզբունքներով:"
          code={`<hd-slider 
  min="0" 
  max="100" 
  value="50" 
  step="1"
  data-width="250px"
  data-thickness="3px"
/>`}
        />

        {/* Checkbox example */}
        <CodeExample 
          title="Հաստատման Վանդակ (<hd-checkbox>)"
          description="Մինիմալիստական հաստատման վանդակ` կլորացված անկյուններով և check-ինդիկատորով:"
          code={`<hd-checkbox 
  checked 
  data-size="18px"
/>`}
        />

        {/* Radio example */}
        <CodeExample 
          title="Ռադիո Կոճակ (<hd-radio>)"
          description="Ռադիո կոճակ տարբերակների խմբից մեկն ընտրելու համար: Կարելի է միավորել ընդհանուր name ատրիբուտով:"
          code={`<hd-radio 
  name="sample-group" 
  checked 
  data-size="18px"
/>`}
        />

        {/* Switch example */}
        <CodeExample 
          title="Փոխանջատիչ (<hd-switch>)"
          description="Գեղեցիկ անիմացիոն փոխանջատիչ (toggle) կարգավորումների արագ միացման կամ անջատման համար:"
          code={`<hd-switch 
  checked 
  data-size="20px"
/>`}
        />

        {/* Select example */}
        <CodeExample 
          title="Ընտրացանկ / Դրոփդաուն (<hd-select>)"
          description="Մաքուր գծային դրոփդաուն ընտրացանկ: Տարբերակները տրվում են span տարրերի միջոցով՝ value և selected ատրիբուտներով:"
          code={`<hd-select 
  placeholder="Ընտրեք տարբերակը" 
  data-width="200px" 
  data-height="46px" 
  data-thickness="3px"
>
  <span value="option1">Տարբերակ 1</span>
  <span value="option2" selected>Տարբերակ 2</span>
  <span value="option3">Տարբերակ 3</span>
</hd-select>`}
        />

        {/* Segment example */}
        <CodeExample 
          title="Սեգմենտավորված Կառավարում (<hd-segment>)"
          description="Տաբերի կամ սահմանափակ տարբերակների սեգմենտավորված փոխանջատիչ:"
          code={`<hd-segment 
  data-width="300px" 
  data-height="46px" 
  data-thickness="3px"
>
  <span value="tab1" selected>Առաջին</span>
  <span value="tab2">Երկրորդ</span>
  <span value="tab3">Երրորդ</span>
</hd-segment>`}
        />

        {/* Color Picker example */}
        <CodeExample 
          title="Գույնի Ընտրիչ (<hd-color-picker>)"
          description="Կոմպակտ կոճակ, որի վրա սեղմելիս բացվում է բրաուզերի գունային ներկապնակը և թարմացնում data-color-ը:"
          code={`<hd-color-picker 
  data-color="#083f39" 
  data-width="44px" 
  data-height="44px"
/>`}
        />

        {/* Color Panel example */}
        <CodeExample 
          title="Գունային Վահանակ (<hd-color-panel>)"
          description="Ինտեգրված գունային վահանակ, որը թույլ է տալիս ուղղակիորեն ընտրել գույներ HTML էջի վրա:"
          code={`<hd-color-panel 
  value="#083f39" 
  data-width="100%" 
  data-height="200px"
/>`}
        />

        {/* Scrollbar example */}
        <CodeExample 
          title="Կոմպակտ Սահնակ / Սքրոլբար (<hd-scrollbar>)"
          description="Հատուկ սահնակով (scrollbar) պատված տարան, որը փոխարինում է բրաուզերի ստանդարտ սքրոլբարին ավելի մինիմալիստական գծային տարբերակով:"
          code={`<hd-scrollbar style={{ width: "100%", height: "150px", overflow: "auto" }}>
  <div style={{ padding: "20px", height: "300px", color: "var(--text)" }}>
    Երկար պարունակություն սքրոլ անելու համար...
  </div>
</hd-scrollbar>`}
        />

      </div>
    </main>
  );
}
