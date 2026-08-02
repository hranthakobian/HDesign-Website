"use client";

import { useState } from "react";
import Link from "next/link";
import HdVideoPlayer from "@/components/HdVideoPlayer";

interface ComponentItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export default function HDesignSamplesPage() {
  const [activeTab, setActiveTab] = useState<string>("hd-button");
  const [copied, setCopied] = useState<boolean>(false);

  // Global styling attributes
  const [width, setWidth] = useState<string>("240px");
  const [height, setHeight] = useState<string>("50px");
  const [thickness, setThickness] = useState<string>("3px");
  const [color, setColor] = useState<string>("#083f39");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [radius, setRadius] = useState<string>("24px");

  // Component-specific attributes
  const [btnText, setBtnText] = useState<string>("Սեղմել այստեղ");
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const [inputPlaceholder, setInputPlaceholder] = useState<string>("Մուտքագրեք տեքստ...");
  const [inputValue, setInputValue] = useState<string>("");
  const [inputType, setInputType] = useState<string>("text");

  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>("Ձեր հաղորդագրությունը...");
  const [textareaDisableResize, setTextareaDisableResize] = useState<boolean>(true);

  const [sliderMin, setSliderMin] = useState<number>(0);
  const [sliderMax, setSliderMax] = useState<number>(100);
  const [sliderVal, setSliderVal] = useState<number>(50);
  const [sliderStep, setSliderStep] = useState<number>(1);

  const [checkedState, setCheckedState] = useState<boolean>(true);
  const [checkboxSize, setCheckboxSize] = useState<string>("18px");

  const [radioState, setRadioState] = useState<boolean>(true);
  const [radioSize, setRadioSize] = useState<string>("18px");

  const [switchState, setSwitchState] = useState<boolean>(true);
  const [switchSize, setSwitchSize] = useState<string>("20px");

  const [selectPlaceholder, setSelectPlaceholder] = useState<string>("Ընտրել տարբերակ...");
  const [selectVal, setSelectVal] = useState<string>("option1");
  const [selectOptions, setSelectOptions] = useState<string>("Տարբերակ 1, Տարբերակ 2, Տարբերակ 3");

  const [segmentVal, setSegmentVal] = useState<string>("tab1");
  const [segmentOptions, setSegmentOptions] = useState<string>("Առաջին, Երկրորդ, Երրորդ");

  const [colorPickerVal, setColorPickerVal] = useState<string>("#083f39");
  const [colorPanelVal, setColorPanelVal] = useState<string>("#083f39");

  const [scrollContentHeight, setScrollContentHeight] = useState<number>(300);

  // hd-reveal specific attributes
  const [revealDirection, setRevealDirection] = useState<string>("up");
  const [revealDelay, setRevealDelay] = useState<number>(0);
  const [revealDuration, setRevealDuration] = useState<number>(800);
  const [revealThreshold, setRevealThreshold] = useState<number>(0.1);
  const [revealKey, setRevealKey] = useState<number>(0);

  // 13 HDesign components details
  const componentsList: ComponentItem[] = [
    { id: "hd-button", name: "Կոճակ (Button)", desc: "Կոճակ անիմացիոն եզրագծերի էֆեկտներով", icon: "icon-Settings" },
    { id: "hd-input", name: "Մուտքի դաշտ (Input)", desc: "Տեքստի մուտքագրման դաշտ caret-ի անիմացիայով", icon: "icon-Cursor" },
    { id: "hd-textarea", name: "Տեքստային տարածք (Textarea)", desc: "Բազմատող տեքստային դաշտ չափափոխման կառավարմամբ", icon: "icon-Info" },
    { id: "hd-slider", name: "Սահիկ (Slider)", desc: "Արժեքների ընտրության գծային սահիկ", icon: "icon-Settings" },
    { id: "hd-checkbox", name: "Հաստատման վանդակ (Checkbox)", desc: "Նշման վանդակ կլորացված անկյուններով", icon: "icon-Info" },
    { id: "hd-radio", name: "Ռադիո կոճակ (Radio)", desc: "Մեկ տարբերակի ընտրություն խմբից", icon: "icon-Info" },
    { id: "hd-switch", name: "Փոխանջատիչ (Switch)", desc: "Միացման-անջատման անիմացիոն տոգլ", icon: "icon-Settings" },
    { id: "hd-select", name: "Ընտրացանկ (Select)", desc: "Գծային ոճով դրոփդաուն ընտրացանկ", icon: "icon-Cursor" },
    { id: "hd-segment", name: "Սեգմենտավորում (Segment)", desc: "Սահմանափակ տարբերակների սեգմենտավորված փոխանջատիչ", icon: "icon-Cursor" },
    { id: "hd-color-picker", name: "Գույնի ընտրիչ (Color Picker)", desc: "Կոմպակտ գունային ներկապնակի կոճակ", icon: "icon-Settings" },
    { id: "hd-color-panel", name: "Գունային վահանակ (Color Panel)", desc: "Ներդրված գունային ընտրության վահանակ", icon: "icon-Settings" },
    { id: "hd-scrollbar", name: "Կոմպակտ սահնակ (Scrollbar)", desc: "Մինիմալիստական սքրոլբարի տարա", icon: "icon-Cursor" },
    { id: "hd-reveal", name: "Սքրոլ Անիմացիա (Scroll Reveal)", desc: "Տարրերի հայտնվելը սքրոլ անելիս", icon: "icon-Info" }
  ];

  // Dynamic component key to force React remount on attribute change
  const componentKey = `${activeTab}-${width}-${height}-${thickness}-${color}-${textColor}-${radius}-${btnText}-${isDisabled}-${inputPlaceholder}-${inputValue}-${inputType}-${textareaPlaceholder}-${textareaDisableResize}-${sliderMin}-${sliderMax}-${sliderVal}-${sliderStep}-${checkedState}-${checkboxSize}-${radioState}-${radioSize}-${switchState}-${switchSize}-${selectPlaceholder}-${selectVal}-${selectOptions}-${segmentVal}-${segmentOptions}-${colorPickerVal}-${colorPanelVal}-${scrollContentHeight}-${revealDirection}-${revealDelay}-${revealDuration}-${revealThreshold}-${revealKey}`;

  function handleTabChange(id: string) {
    setActiveTab(id);
    // Set appropriate defaults for styles
    if (id === "hd-video") {
      setWidth("100%");
      setHeight("260px");
    } else if (id === "hd-checkbox" || id === "hd-radio" || id === "hd-switch" || id === "hd-color-picker") {
      setWidth("auto");
      setHeight("auto");
    } else if (id === "hd-reveal") {
      setWidth("100%");
      setHeight("auto");
    } else {
      setWidth("240px");
      setHeight(id === "hd-textarea" ? "120px" : id === "hd-scrollbar" ? "150px" : id === "hd-color-panel" ? "200px" : "50px");
    }
  }

  const highlightSamplesHTML = (code: string): string => {
    if (!code) return "";
    let escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    const values: string[] = [];
    const tags: string[] = [];
    const gts: string[] = [];
    const attrs: string[] = [];
    const bools: string[] = [];

    // 1. Strings/Values (in double quotes)
    escaped = escaped.replace(/"([^"]*)"/g, (match, p1) => {
      const idx = values.length;
      values.push(`<span style="color: #ce9178;">"${p1}"</span>`);
      return `__VAL__${idx}__`;
    });

    // 2. Tag names
    escaped = escaped.replace(/&lt;(\/?[a-zA-Z0-9\-]+)/g, (match, p1) => {
      const idx = tags.length;
      tags.push(`<span style="color: #569cd6; font-weight: 600;">${p1}</span>`);
      return `&lt;__TAG__${idx}__`;
    });

    // 3. Angle brackets
    escaped = escaped.replace(/\/&gt;/g, () => {
      const idx = gts.length;
      gts.push(`<span style="color: #569cd6; font-weight: 600;">/&gt;</span>`);
      return `__GT__${idx}__`;
    });
    escaped = escaped.replace(/&gt;/g, () => {
      const idx = gts.length;
      gts.push(`<span style="color: #569cd6; font-weight: 600;">&gt;</span>`);
      return `__GT__${idx}__`;
    });

    // 4. Attributes
    escaped = escaped.replace(/([a-zA-Z0-9\-]+)(?==)/g, (match, p1) => {
      const idx = attrs.length;
      attrs.push(`<span style="color: #9cdcfe;">${p1}</span>`);
      return `__ATTR__${idx}__`;
    });

    // 5. Booleans
    escaped = escaped.replace(/\b(checked|disabled)\b/g, (match, p1) => {
      const idx = bools.length;
      bools.push(`<span style="color: #9cdcfe;">${p1}</span>`);
      return `__BOOL__${idx}__`;
    });

    // Restore tokens in safe order
    escaped = escaped.replace(/__VAL__(\d+)__/g, (match, p1) => values[parseInt(p1, 10)]);
    escaped = escaped.replace(/__TAG__(\d+)__/g, (match, p1) => tags[parseInt(p1, 10)]);
    escaped = escaped.replace(/__ATTR__(\d+)__/g, (match, p1) => attrs[parseInt(p1, 10)]);
    escaped = escaped.replace(/__BOOL__(\d+)__/g, (match, p1) => bools[parseInt(p1, 10)]);
    escaped = escaped.replace(/__GT__(\d+)__/g, (match, p1) => gts[parseInt(p1, 10)]);

    return escaped;
  };

  // Generate code snippet
  const generateCode = (): string => {
    const thicknessAttr = thickness ? ` data-thickness="${thickness}"` : "";
    const colorAttr = color ? ` data-color="${color}"` : "";
    const textColorAttr = textColor ? ` data-text-color="${textColor}"` : "";
    const radiusAttr = radius ? ` data-radius="${radius}"` : "";
    const widthAttr = width && width !== "auto" ? ` data-width="${width}"` : "";
    const heightAttr = height && height !== "auto" ? ` data-height="${height}"` : "";
    
    const commonData = `${widthAttr}${heightAttr}${thicknessAttr}${colorAttr}${textColorAttr}${radiusAttr}`;
    
    switch(activeTab) {
      case "hd-video":
        return `<hd-video\n  src="https://api.hakobian.am/libs/v1/promo/promo.mp4"\n  poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"\n  ${commonData}\n></hd-video>`;
      case "hd-button":
        return `<hd-button${isDisabled ? " disabled" : ""}${commonData}>\n  ${btnText}\n</hd-button>`;
      case "hd-input":
        return `<hd-input\n  type="${inputType}"\n  placeholder="${inputPlaceholder}"\n  value="${inputValue}"\n  ${isDisabled ? "disabled " : ""}${commonData}\n data-font-size="14pt" />`;
      case "hd-textarea":
        return `<hd-textarea\n  placeholder="${textareaPlaceholder}"\n  value="${inputValue}"\n  data-disable-horizontal-resize="${textareaDisableResize}"\n  ${commonData}\n data-font-size="14pt" data-height="200pt" />`;
      case "hd-slider":
        return `<hd-slider\n  min="${sliderMin}"\n  max="${sliderMax}"\n  value="${sliderVal}"\n  step="${sliderStep}"\n  ${isDisabled ? "disabled " : ""}${commonData}\n/>`;
      case "hd-checkbox":
        const checkSizeAttr = checkboxSize ? ` data-size="${checkboxSize}"` : "";
        return `<hd-checkbox\n  ${checkedState ? "checked " : ""}${isDisabled ? "disabled " : ""}${checkSizeAttr}${colorAttr}${radiusAttr}\n/>`;
      case "hd-radio":
        const radSizeAttr = radioSize ? ` data-size="${radioSize}"` : "";
        return `<hd-radio\n  name="group"\n  ${radioState ? "checked " : ""}${isDisabled ? "disabled " : ""}${radSizeAttr}${colorAttr}\n/>`;
      case "hd-switch":
        const swSizeAttr = switchSize ? ` data-size="${switchSize}"` : "";
        return `<hd-switch\n  ${switchState ? "checked " : ""}${isDisabled ? "disabled " : ""}${swSizeAttr}${colorAttr} data-thickness="4px"\n/>`;
      case "hd-select":
        const selectSpans = selectOptions.split(",").map((opt, i) => {
          const val = `option${i+1}`;
          const sel = val === selectVal ? " selected" : "";
          return `  <span value="${val}"${sel}>${opt.trim()}</span>`;
        }).join("\n");
        return `<hd-select\n  placeholder="${selectPlaceholder}"\n  value="${selectVal}"\n  ${commonData}\n>\n${selectSpans}\n</hd-select>`;
      case "hd-segment":
        const segmentSpans = segmentOptions.split(",").map((opt, i) => {
          const val = `tab${i+1}`;
          const sel = val === segmentVal ? " selected" : "";
          return `  <span value="${val}"${sel}>${opt.trim()}</span>`;
        }).join("\n");
        return `<hd-segment\n  value="${segmentVal}"\n  ${commonData}\n>\n${segmentSpans}\n</hd-segment>`;
      case "hd-color-picker":
        return `<hd-color-picker\n  data-color="${colorPickerVal}"\n  ${commonData}\n/>`;
      case "hd-color-panel":
        return `<hd-color-panel\n  value="${colorPanelVal}"\n  data-width="${width}"\n  data-height="${height}"\n/>`;
      case "hd-scrollbar":
        return `<hd-scrollbar style="width: ${width}; height: ${height}; overflow: auto;">\n  <div style="padding: 20px; height: ${scrollContentHeight}px;">\n    Երկար պարունակություն սքրոլ անելու համար...\n  </div>\n</hd-scrollbar>`;
      case "hd-reveal":
        const dirAttr = revealDirection ? ` data-direction="${revealDirection}"` : "";
        const delayAttr = revealDelay ? ` data-delay="${revealDelay}"` : "";
        const durationAttr = revealDuration ? ` data-duration="${revealDuration}"` : "";
        const thresholdAttr = revealThreshold ? ` data-threshold="${revealThreshold}"` : "";
        return `<hd-reveal${dirAttr}${delayAttr}${durationAttr}${thresholdAttr}>\n  <div style="background: var(--panel); border: 1px solid var(--panel-border); padding: 32px; border-radius: 12px; text-align: center;">\n    <h3>Հայտնվող Տարր</h3>\n    <p>Այս բովանդակությունը կհայտնվի սահուն կերպով</p>\n  </div>\n</hd-reveal>`;
      default:
        return "";
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render current component preview
  function renderActiveComponent() {
    const commonProps = {
      "data-width": width,
      "data-height": height,
      "data-thickness": thickness,
      "data-color": color,
      "data-text-color": textColor,
      "data-radius": radius,
    } as any;

    switch(activeTab) {
      case "hd-video":
        return (
          <HdVideoPlayer
            key={componentKey}
            width={width}
            height={height}
            thickness={thickness}
            color={color}
            textColor={textColor}
            radius={radius}
          />
        );
      case "hd-button":
        return (
          <hd-button key={componentKey} {...commonProps} disabled={isDisabled} onClick={() => alert("Կոճակը սեղմված է")}>
            {btnText}
          </hd-button>
        );
      case "hd-input":
        return (
          <hd-input
            key={componentKey}
            {...commonProps}
            type={inputType}
            placeholder={inputPlaceholder}
            value={inputValue}
            disabled={isDisabled}
            onChange={(e: any) => setInputValue(e.target.value)}
          data-font-size="14pt" />
        );
      case "hd-textarea":
        return (
          <hd-textarea
            key={componentKey}
            {...commonProps}
            placeholder={textareaPlaceholder}
            value={inputValue}
            data-disable-horizontal-resize={textareaDisableResize ? "true" : undefined}
            onChange={(e: any) => setInputValue(e.target.value)}
          data-font-size="14pt" data-height="200pt" />
        );
      case "hd-slider":
        return (
          <hd-slider
            key={componentKey}
            {...commonProps}
            min={sliderMin}
            max={sliderMax}
            value={sliderVal}
            step={sliderStep}
            disabled={isDisabled}
            onInput={(e: any) => setSliderVal(Number(e.target.value))}
          />
        );
      case "hd-checkbox":
        return (
          <hd-checkbox
            key={componentKey}
            checked={checkedState}
            disabled={isDisabled}
            data-size={checkboxSize}
            data-color={color}
            data-radius={radius}
            onChange={(e: any) => setCheckedState(e.target.checked)}
          />
        );
      case "hd-radio":
        return (
          <hd-radio
            key={componentKey}
            checked={radioState}
            disabled={isDisabled}
            data-size={radioSize}
            data-color={color}
            onChange={(e: any) => setRadioState(e.target.checked)}
          />
        );
      case "hd-switch":
        return (
          <hd-switch
            key={componentKey}
            checked={switchState}
            disabled={isDisabled}
            data-size={switchSize}
            data-color={color}
            onChange={(e: any) => setSwitchState(e.target.checked)}
          />
        );
      case "hd-select":
        return (
          <hd-select
            key={componentKey}
            {...commonProps}
            placeholder={selectPlaceholder}
            value={selectVal}
            onChange={(e: any) => setSelectVal(e.target.value)}
          >
            {selectOptions.split(",").map((opt, i) => (
              <span key={i} value={`option${i+1}`} {...(selectVal === `option${i+1}` ? { selected: true } : {})}>
                {opt.trim()}
              </span>
            ))}
          </hd-select>
        );
      case "hd-segment":
        return (
          <hd-segment
            key={componentKey}
            {...commonProps}
            value={segmentVal}
            onChange={(e: any) => setSegmentVal(e.target.value)}
          >
            {segmentOptions.split(",").map((opt, i) => (
              <span key={i} value={`tab${i+1}`} {...(segmentVal === `tab${i+1}` ? { selected: true } : {})}>
                {opt.trim()}
              </span>
            ))}
          </hd-segment>
        );
      case "hd-color-picker":
        return (
          <hd-color-picker
            key={componentKey}
            {...commonProps}
            data-color={colorPickerVal}
            onChange={(e: any) => setColorPickerVal(e.target.value)}
          />
        );
      case "hd-color-panel":
        return (
          <hd-color-panel
            key={componentKey}
            value={colorPanelVal}
            data-width={width}
            data-height={height}
            onChange={(e: any) => setColorPanelVal(e.target.value)}
          />
        );
      case "hd-scrollbar":
        return (
          <hd-scrollbar key={componentKey} style={{ width: width || "100%", height: height || "150px", overflow: "auto", border: "1px solid var(--panel-border)", borderRadius: "8px", background: "rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "20px", height: `${scrollContentHeight}px`, color: "inherit", boxSizing: "border-box" }}>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.95rem", fontWeight: "bold" }}>HDesign Կոմպակտ Սքրոլբար</p>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", opacity: 0.7, lineHeight: "1.4" }}>Այս կոմպոնենտը փոխարինում է բրաուզերի ստանդարտ սքրոլբարին ավելի մինիմալիստական տարբերակով:</p>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", opacity: 0.7, lineHeight: "1.4" }}>Սքրոլ արեք այս վահանակը ներքև՝ տեքստի շարունակությունը կարդալու և սքրոլի անիմացիան տեսնելու համար:</p>
              <div style={{ marginTop: "50px", border: "1px dashed var(--panel-border)", padding: "10px", borderRadius: "6px", textAlign: "center", fontSize: "0.8rem", opacity: 0.5 }}>
                Վերջնամաս (Ընդհանուր բարձրություն՝ {scrollContentHeight}px)
              </div>
            </div>
          </hd-scrollbar>
        );
      case "hd-reveal":
        return (
          <hd-reveal
            key={`${componentKey}-${revealKey}`}
            data-direction={revealDirection}
            data-delay={revealDelay}
            data-duration={revealDuration}
            data-threshold={revealThreshold}
            style={{ width: "100%" }}
          >
            <div style={{
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              padding: "32px",
              borderRadius: "16px",
              textAlign: "center",
              boxShadow: "var(--shadow)",
              color: "var(--text)"
            }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: "bold" }}>Հայտնվող Տարր</h3>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>Այս բովանդակությունը կհայտնվի սահուն կերպով</p>
            </div>
          </hd-reveal>
        );
      default:
        return null;
    }
  }

  return (
    <main className="shell" style={{ marginTop: "140px", minHeight: "80vh", paddingBottom: "80px" }}>
      {/* Title */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/hdesign" style={{ color: "var(--text)", textDecoration: "none", opacity: 0.7 }}>HDesign</Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ fontWeight: "bold" }}>Փորձանմուշներ</span>
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--text)", margin: 0 }}>Ինտերակտիվ Լաբորատորիա (Playground)</h1>
        <p style={{ color: "var(--text)", opacity: 0.8, fontSize: "1.05rem", margin: 0, maxWidth: "700px" }}>
          Փորձարկեք HDesign-ի բոլոր 12 կոմպոնենտները իրական ժամանակում: Փոփոխեք ատրիբուտները, տեսեք արդյունքը և պատճենեք պատրաստի HTML/JSX կոդը:
        </p>
      </div>

      {/* Main Builder Area */}
      <style>{`
        .playground-dashboard-grid {
          display: grid;
          grid-template-columns: 280px 1fr 340px;
          gap: 24px;
          max-width: 1500px;
          margin: 0 auto;
          width: 100%;
          align-items: start;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .playground-sidebar-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #ffffff;
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.08);
          max-height: 500px;
          height: 500px;
          overflow: hidden;
          color: #1a1a1a;
        }
        .playground-preview-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
          height: 500px !important;
          max-height: 500px !important;
          min-height: 500px !important;
        }
        .playground-controls-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #ffffff;
          border: 1px solid var(--panel-border);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.08);
          max-height: 500px;
          height: 500px;
          overflow: hidden;
          color: #1a1a1a;
        }
        @media (max-width: 1100px) {
          .playground-dashboard-grid {
            grid-template-columns: 220px 1fr;
          }
          .playground-controls-column {
            grid-column: span 2;
            max-height: 400px;
            height: 400px;
          }
        }
        @media (max-width: 768px) {
          .playground-dashboard-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .playground-sidebar-column {
            max-height: none;
            height: auto;
            padding: 12px 14px;
            border-radius: 16px;
          }
          .playground-sidebar-column h3 {
            border-bottom: none !important;
            margin-bottom: 4px !important;
            padding: 2px 4px !important;
          }
          .playground-sidebar-column hd-scrollbar {
            height: auto !important;
            max-height: none !important;
          }
          .playground-components-list {
            flex-direction: row !important;
            overflow-x: auto !important;
            padding-right: 0 !important;
            padding-bottom: 6px !important;
            gap: 8px !important;
            -webkit-overflow-scrolling: touch;
          }
          .playground-tab-btn {
            width: auto !important;
            flex-shrink: 0 !important;
            flex-direction: row !important;
            align-items: center !important;
            padding: 8px 14px !important;
            border-radius: 20px !important;
          }
          .playground-tab-desc {
            display: none !important;
          }
          .playground-preview-column {
            height: 500px !important;
            max-height: 500px !important;
            min-height: 500px !important;
            gap: 16px;
          }
          .playground-controls-column {
            grid-column: span 1;
            max-height: 480px;
            height: auto;
            padding: 16px;
            border-radius: 16px;
          }
          .playground-controls-column hd-scrollbar {
            height: auto !important;
            max-height: 380px !important;
          }
        }
        @media (max-width: 480px) {
          .playground-dashboard-grid {
            gap: 12px;
          }
          .playground-sidebar-column {
            padding: 10px 12px;
          }
          .playground-tab-btn {
            padding: 6px 12px !important;
          }
          .playground-tab-btn span {
            font-size: 0.8rem !important;
          }
          .playground-controls-column {
            padding: 12px;
            max-height: 420px;
          }
          .playground-controls-column hd-scrollbar {
            max-height: 340px !important;
          }
        }
      `}</style>

      {/* Main Builder Area */}
      <div className="playground-dashboard-grid">
        
        {/* Column 1: Components List Sidebar */}
        <div className="playground-sidebar-column">
          <h3 style={{ fontSize: "1rem", fontWeight: "800", padding: "8px 12px", margin: "0 0 8px 0", borderBottom: "1px solid var(--panel-border)", opacity: 0.8 }}>
            ԿՈՄՊՈՆԵՆՏՆԵՐ
          </h3>
          <hd-scrollbar style={{ height: "420px", overflow: "auto", overscrollBehavior: "contain" }}>
            <div className="playground-components-list" style={{ display: "flex", flexDirection: "column", gap: "6px", paddingRight: "10px" }}>
              {componentsList.map((comp) => {
                const isActive = activeTab === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => handleTabChange(comp.id)}
                    className={`playground-tab-btn ${isActive ? 'active' : ''}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "4px",
                      width: "100%",
                      padding: "8px 12px",
                      background: isActive ? "var(--btn-bg)" : "transparent",
                      border: isActive ? "1px solid var(--panel-border)" : "1px solid transparent",
                      borderRadius: "10px",
                      color: "var(--text)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                      {comp.name}
                    </span>
                    <span className="playground-tab-desc" style={{ fontSize: "0.7rem", opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {comp.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </hd-scrollbar>
        </div>

        {/* Column 2: Live Preview & Generated Code */}
        <div className="playground-preview-column">
          
          {/* Live Preview Arena */}
          <div style={{
            background: "rgba(10, 15, 14, 0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--panel-border)",
            borderRadius: "20px",
            boxShadow: "0 0 30px rgba(0, 0, 0, 0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flex: 1
          }}>
            <div style={{
              padding: "12px 20px",
              borderBottom: "1px solid var(--panel-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(0,0,0,0.1)",
              height: "38px"
            }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.6 }}>ԻՐԱԿԱՆ ԺԱՄԱՆԱԿՈՒՄ ԴԻՏՈՒՄ</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f" }} />
              </div>
            </div>

            {/* Checkered Canvas */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              flex: 1,
              position: "relative",
              backgroundImage: "radial-gradient(rgba(0,0,0,0.15) 1.5px, transparent 0)",
              backgroundSize: "20px 20px",
              backgroundPosition: "center",
              backgroundColor: "#f5f5f5",
              color: "#1a1a1a"
            }}>
              <div style={{ width: "100%", maxWidth: "320px", display: "flex", justifyContent: "center", color: "#1a1a1a" }}>
                {renderActiveComponent()}
              </div>
            </div>
          </div>

          {/* Generated Code Card */}
          <div style={{
            background: "rgba(10, 15, 14, 0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--panel-border)",
            borderRadius: "20px",
            boxShadow: "0 0 30px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            height: "180px",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              padding: "12px 0px 12px 20px",
              borderBottom: "1px solid var(--panel-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#000000",
              color: "#ffffff",
              height: "38px"
            }}>
              <span style={{ fontSize: "0.72rem", fontWeight: "bold", color: "#ffffff", opacity: 0.8 }}>ՍՏԱՑՎԱԾ ԿՈԴԸ</span>
              <button
                onClick={handleCopyCode}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: "0 20px 0 0",
                  outline: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#b0b0b0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
              >
                <span className="icon-Attech" style={{ fontSize: "0.85rem" }} />
                <span>{copied ? "ՊԱՏՃԵՆՎԱԾ Է!" : "ՊԱՏՃԵՆԵԼ"}</span>
              </button>
            </div>
            <hd-scrollbar style={{ flex: 1, overflow: "auto", overscrollBehavior: "contain", background: "#121817" }}>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
                {highlightSamplesHTML(generateCode()).split("\n").map((line, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "start", fontFamily: "Consolas, monospace !important", fontSize: "0.82rem", lineHeight: "1.5" }}>
                    <span style={{
                      width: "24px",
                      textAlign: "right",
                      marginRight: "16px",
                      color: "rgba(255, 255, 255, 0.25)",
                      userSelect: "none",
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <code
                      style={{
                        flex: 1,
                        minWidth: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: "Consolas, monospace !important",
                        color: "#e6edf3"
                      }}
                      dangerouslySetInnerHTML={{ __html: line || " " }}
                    />
                  </div>
                ))}
              </div>
            </hd-scrollbar>
          </div>
        </div>

        {/* Column 3: Component Customizer Sidebar */}
        <div className="playground-controls-column">
          <h3 style={{ fontSize: "1rem", fontWeight: "800", margin: 0, paddingBottom: "10px", borderBottom: "1px solid var(--panel-border)", opacity: 0.8 }}>
            ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ
          </h3>

          <hd-scrollbar style={{ height: "420px", overflow: "auto", overscrollBehavior: "contain" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingRight: "10px" }}>
              
              {/* --- Stylistic Attributes Section --- */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px" }}>ԴԻԶԱՅՆԻ ՈՃ</span>
                
                {/* Width control (Only if applicable) */}
                {width !== "auto" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Լայնություն (Width)</span>
                    <hd-select value={width} onChange={(e: any) => setWidth(e.target.value)} data-height="38px" data-thickness="2px">
                      <span value="100%">100% (Լրիվ)</span>
                      <span value="300px">300px</span>
                      <span value="200px">200px</span>
                      <span value="150px">150px</span>
                    </hd-select>
                  </label>
                )}

                {/* Height control (Only if applicable) */}
                {height !== "auto" && activeTab !== "hd-scrollbar" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Բարձրություն (Height)</span>
                    <hd-select value={height} onChange={(e: any) => setHeight(e.target.value)} data-height="38px" data-thickness="2px">
                      <span value="38px">38px (Կոմպակտ)</span>
                      <span value="50px">50px (Ստանդարտ)</span>
                      <span value="62px">62px (Խոշոր)</span>
                      {activeTab === "hd-textarea" || activeTab === "hd-color-panel" ? (
                        <>
                          <span value="120px">120px</span>
                          <span value="200px">200px</span>
                        </>
                      ) : null}
                    </hd-select>
                  </label>
                )}

                {/* Line thickness control */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Գծի հաստություն</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={thickness.replace("px", "")}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && e.target.value !== "") setThickness(`${val}px`);
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 1;
                        setThickness(`${Math.min(5, Math.max(1, val))}px`);
                      }}
                      style={{
                        width: "50px",
                        padding: "2px 4px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "var(--text)",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "4px",
                        textAlign: "center",
                        outline: "none"
                      }}
                    />
                  </div>
                  <hd-slider min="1" max="5" value={thickness.replace("px", "")} onInput={(e: any) => setThickness(`${e.target.value}px`)} />
                </div>

                {/* Border radius control */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Կլորացման շառավիղ</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={radius.replace("px", "")}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && e.target.value !== "") setRadius(`${val}px`);
                      }}
                      onBlur={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        setRadius(`${Math.min(30, Math.max(0, val))}px`);
                      }}
                      style={{
                        width: "50px",
                        padding: "2px 4px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "var(--text)",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "4px",
                        textAlign: "center",
                        outline: "none"
                      }}
                    />
                  </div>
                  <hd-slider min="0" max="30" value={radius.replace("px", "")} onInput={(e: any) => setRadius(`${e.target.value}px`)} />
                </div>

                {/* Primary Theme color input */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Հիմնական գույն (Theme Color)</span>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {["#083f39", "#111111", "#e74c3c", "#3498db", "#f1c40f"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: c,
                          border: color === c ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          padding: 0
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={color.startsWith("#") ? color : "#083f39"}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: 0
                      }}
                    />
                  </div>
                </div>

                {/* Text color input */}
                {activeTab !== "hd-color-panel" && activeTab !== "hd-scrollbar" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Տեքստի գույն</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {["#ffffff", "#254d4e", "#111111", "#ffcccc"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setTextColor(c)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: c,
                            border: textColor === c ? "2px solid var(--text)" : "1px solid rgba(255,255,255,0.2)",
                            cursor: "pointer",
                            padding: 0
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={textColor.startsWith("#") ? textColor : "#ffffff"}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{
                          width: "28px",
                          height: "28px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          padding: 0
                        }}
                      />
                    </div>
                  </div>
                )}

              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: 0 }} />

              {/* --- Component-Specific Settings Section --- */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", opacity: 0.5, letterSpacing: "1px" }}>ԿՈՄՊՈՆԵՆՏԻ ՊԱՐԱՄԵՏՐԵՐ</span>
                
                {/* 1. hd-button settings */}
                {activeTab === "hd-button" && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Կոճակի տեքստը</span>
                      <input
                        type="text"
                        value={btnText}
                        onChange={(e) => setBtnText(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={isDisabled} onChange={(e: any) => setIsDisabled(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Պասիվ (Disabled)</span>
                    </label>
                  </>
                )}

                {/* 2. hd-input settings */}
                {activeTab === "hd-input" && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Placeholder տեքստ</span>
                      <input
                        type="text"
                        value={inputPlaceholder}
                        onChange={(e) => setInputPlaceholder(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Արժեք (Value)</span>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Տեսակը (Type)</span>
                      <hd-select value={inputType} onChange={(e: any) => setInputType(e.target.value)} data-height="38px" data-thickness="2px">
                        <span value="text">Տեքստ (Text)</span>
                        <span value="password">Գաղտնաբառ (Password)</span>
                        <span value="email">Էլ. հասցե (Email)</span>
                      </hd-select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={isDisabled} onChange={(e: any) => setIsDisabled(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Պասիվ (Disabled)</span>
                    </label>
                  </>
                )}

                {/* 3. hd-textarea settings */}
                {activeTab === "hd-textarea" && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Placeholder տեքստ</span>
                      <input
                        type="text"
                        value={textareaPlaceholder}
                        onChange={(e) => setTextareaPlaceholder(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={textareaDisableResize} onChange={(e: any) => setTextareaDisableResize(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Արգելել հորիզոնական չափափոխումը</span>
                    </label>
                  </>
                )}

                {/* 4. hd-slider settings */}
                {activeTab === "hd-slider" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Մինիմում (Min)</span>
                        <input
                          type="number"
                          value={sliderMin}
                          onChange={(e) => setSliderMin(Number(e.target.value))}
                          style={{
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--panel-border)",
                            borderRadius: "8px",
                            color: "var(--text)",
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            fontFamily: "inherit"
                          }}
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Մաքսիմում (Max)</span>
                        <input
                          type="number"
                          value={sliderMax}
                          onChange={(e) => setSliderMax(Number(e.target.value))}
                          style={{
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--panel-border)",
                            borderRadius: "8px",
                            color: "var(--text)",
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            fontFamily: "inherit"
                          }}
                        />
                      </label>
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Քայլ (Step)</span>
                      <input
                        type="number"
                        value={sliderStep}
                        onChange={(e) => setSliderStep(Number(e.target.value))}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Արժեք (Value): {sliderVal}</span>
                      <input
                        type="range"
                        min={sliderMin}
                        max={sliderMax}
                        step={sliderStep}
                        value={sliderVal}
                        onChange={(e) => setSliderVal(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--accent)" }}
                      />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={isDisabled} onChange={(e: any) => setIsDisabled(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Պասիվ (Disabled)</span>
                    </label>
                  </>
                )}

                {/* 5. hd-checkbox settings */}
                {activeTab === "hd-checkbox" && (
                  <>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={checkedState} onChange={(e: any) => setCheckedState(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Ընտրված է (Checked)</span>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Չափս (Size): {checkboxSize}</span>
                      <hd-select value={checkboxSize} onChange={(e: any) => setCheckboxSize(e.target.value)} data-height="38px" data-thickness="2px">
                        <span value="14px">14px (Փոքր)</span>
                        <span value="18px">18px (Միջին)</span>
                        <span value="24px">24px (Խոշոր)</span>
                      </hd-select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={isDisabled} onChange={(e: any) => setIsDisabled(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Պասիվ (Disabled)</span>
                    </label>
                  </>
                )}

                {/* 6. hd-radio settings */}
                {activeTab === "hd-radio" && (
                  <>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={radioState} onChange={(e: any) => setRadioState(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Ընտրված է (Checked)</span>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Չափս (Size): {radioSize}</span>
                      <hd-select value={radioSize} onChange={(e: any) => setRadioSize(e.target.value)} data-height="38px" data-thickness="2px">
                        <span value="14px">14px (Փոքր)</span>
                        <span value="18px">18px (Միջին)</span>
                        <span value="24px">24px (Խոշոր)</span>
                      </hd-select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={isDisabled} onChange={(e: any) => setIsDisabled(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Պասիվ (Disabled)</span>
                    </label>
                  </>
                )}

                {/* 7. hd-switch settings */}
                {activeTab === "hd-switch" && (
                  <>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={switchState} onChange={(e: any) => setSwitchState(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Միացված է (Active)</span>
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Չափս (Size): {switchSize}</span>
                      <hd-select value={switchSize} onChange={(e: any) => setSwitchSize(e.target.value)} data-height="38px" data-thickness="2px">
                        <span value="16px">16px (Փոքր)</span>
                        <span value="20px">20px (Միջին)</span>
                        <span value="26px">26px (Խոշոր)</span>
                      </hd-select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <hd-checkbox checked={isDisabled} onChange={(e: any) => setIsDisabled(e.target.checked)} />
                      <span style={{ fontSize: "0.85rem" }}>Պասիվ (Disabled)</span>
                    </label>
                  </>
                )}

                {/* 8. hd-select settings */}
                {activeTab === "hd-select" && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Placeholder տեքստ</span>
                      <input
                        type="text"
                        value={selectPlaceholder}
                        onChange={(e) => setSelectPlaceholder(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Տարբերակներ (ստորակետով)</span>
                      <input
                        type="text"
                        value={selectOptions}
                        onChange={(e) => setSelectOptions(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Ընտրված արժեք</span>
                      <hd-select value={selectVal} onChange={(e: any) => setSelectVal(e.target.value)} data-height="38px" data-thickness="2px">
                        {selectOptions.split(",").map((opt, i) => (
                          <span key={i} value={`option${i+1}`}>{opt.trim()}</span>
                        ))}
                      </hd-select>
                    </label>
                  </>
                )}

                {/* 9. hd-segment settings */}
                {activeTab === "hd-segment" && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Տաբեր (ստորակետով սահմանազատված)</span>
                      <input
                        type="text"
                        value={segmentOptions}
                        onChange={(e) => setSegmentOptions(e.target.value)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid var(--panel-border)",
                          borderRadius: "8px",
                          color: "var(--text)",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          fontFamily: "inherit"
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Ընտրված տաբ (Active Tab)</span>
                      <hd-select value={segmentVal} onChange={(e: any) => setSegmentVal(e.target.value)} data-height="38px" data-thickness="2px">
                        {segmentOptions.split(",").map((opt, i) => (
                          <span key={i} value={`tab${i+1}`}>{opt.trim()}</span>
                        ))}
                      </hd-select>
                    </label>
                  </>
                )}

                {/* 10. hd-color-picker settings */}
                {activeTab === "hd-color-picker" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Ընտրված Գույնը (Hex): {colorPickerVal}</span>
                    <input
                      type="color"
                      value={colorPickerVal}
                      onChange={(e) => setColorPickerVal(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "8px",
                        background: "transparent",
                        cursor: "pointer"
                      }}
                    />
                  </label>
                )}

                {/* 11. hd-color-panel settings */}
                {activeTab === "hd-color-panel" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Ընտրված Գույնը: {colorPanelVal}</span>
                    <input
                      type="color"
                      value={colorPanelVal}
                      onChange={(e) => setColorPanelVal(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        border: "1px solid var(--panel-border)",
                        borderRadius: "8px",
                        background: "transparent",
                        cursor: "pointer"
                      }}
                    />
                  </label>
                )}

                {/* 12. hd-scrollbar settings */}
                {activeTab === "hd-scrollbar" && (
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Պարունակության բարձրություն: {scrollContentHeight}px</span>
                    <hd-slider
                      min="150"
                      max="600"
                      value={scrollContentHeight}
                      onInput={(e: any) => setScrollContentHeight(Number(e.target.value))}
                    />
                  </label>
                )}

                {/* 13. hd-reveal settings */}
                {activeTab === "hd-reveal" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Անիմացիայի ուղղություն</span>
                      <hd-select value={revealDirection} onChange={(e: any) => setRevealDirection(e.target.value)} data-height="38px" data-thickness="2px">
                        <span value="up">Վերև (Up)</span>
                        <span value="down">Ներքև (Down)</span>
                        <span value="left">Աջից ձախ (Left)</span>
                        <span value="right">Ձախից աջ (Right)</span>
                        <span value="scale">Մասշտաբավորում (Scale)</span>
                        <span value="fade">Ֆեյդ / Մարում (Fade)</span>
                      </hd-select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Ուշացում (Delay): {revealDelay}ms</span>
                      <hd-slider
                        min="0"
                        max="1000"
                        step="50"
                        value={revealDelay}
                        onInput={(e: any) => setRevealDelay(Number(e.target.value))}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Տևողություն (Duration): {revealDuration}ms</span>
                      <hd-slider
                        min="200"
                        max="2000"
                        step="100"
                        value={revealDuration}
                        onInput={(e: any) => setRevealDuration(Number(e.target.value))}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Շեմ (Threshold): {revealThreshold}</span>
                      <hd-slider
                        min="0"
                        max="1"
                        step="0.05"
                        value={revealThreshold}
                        onInput={(e: any) => setRevealThreshold(Number(e.target.value))}
                      />
                    </label>

                    <hd-button 
                      onClick={() => setRevealKey(prev => prev + 1)}
                      data-width="100%" 
                      data-height="38px"
                      data-thickness="2px"
                    >
                      Կրկնել Անիմացիան
                    </hd-button>
                  </div>
                )}


              </div>

            </div>
          </hd-scrollbar>
        </div>

      </div>

      {/* Structured Forms Showcase Section */}
      <div>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text)", marginBottom: "32px", textAlign: "center" }}>
          Կոմպոնենտների Համատեղ Կիրառում
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }} className="samples-showcase-grid">
          
          {/* Card 1: Sample Form */}
          <div style={{ 
            background: "var(--panel)", 
            border: "1px solid var(--panel-border)", 
            borderRadius: "24px", 
            padding: "32px", 
            boxShadow: "var(--shadow)", 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px" 
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Մուտքի Ձևանմուշ (Login)</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.5 }}>Օգտագործված են hd-input, hd-checkbox և hd-button</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <hd-input placeholder="Էլ. հասցե կամ օգտանուն" data-width="100%" data-height="46px" data-thickness="3px" data-font-size="14pt" />
              <hd-input type="password" placeholder="Գաղտնաբառ" data-width="100%" data-height="46px" data-thickness="3px" data-font-size="14pt" />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem" }}>
                  <hd-checkbox data-size="14px" checked />
                  <span>Հիշել ինձ</span>
                </label>
                <a href="#" style={{ fontSize: "0.85rem", color: "var(--text)", opacity: 0.8, textDecoration: "none" }}>
                  Մոռացե՞լ եք գաղտնաբառը
                </a>
              </div>
              
              <hd-button data-width="100%" data-height="48px" data-thickness="3px">
                Մուտք Գործել
              </hd-button>
            </div>
          </div>

          {/* Card 2: Interactive Settings panel preview */}
          <div style={{ 
            background: "var(--panel)", 
            border: "1px solid var(--panel-border)", 
            borderRadius: "24px", 
            padding: "32px", 
            boxShadow: "var(--shadow)", 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px" 
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Անհատականացում (Settings)</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.5 }}>Օգտագործված են hd-switch, hd-segment, hd-slider</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Ծանուցումներ</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Ստանալ ծանուցումներ էլ. փոստով</span>
                </div>
                <hd-switch checked data-size="18px" data-thickness="4px" />
              </div>
              
              <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: 0 }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Թեմայի Գույն</span>
                <hd-segment data-width="100%" data-height="38px" data-thickness="2px">
                  <span value="light" selected>Բաց</span>
                  <span value="dark">Մութ</span>
                  <span value="green">Կանաչ</span>
                </hd-segment>
              </div>
              
              <hr style={{ border: "none", borderTop: "1px solid var(--panel-border)", margin: 0 }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Ձայնի Բարձրություն</span>
                <hd-slider min="0" max="100" value="80" data-width="100%" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
