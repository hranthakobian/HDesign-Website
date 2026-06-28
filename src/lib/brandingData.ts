export interface BrandingCase {
  id: string;
  title: string;
  color: string;
  image: string;
  tagline: string;
  description: string;
  concept: string;
  typography: string;
  colors: string[];
}

export const brandingCases: BrandingCase[] = [
  {
    id: "pasta",
    title: "Pasta",
    color: "#d32f2f",
    image: "/branding/pasta.png",
    tagline: "Իտալական խոհանոցի ավանդական համի ժամանակակից արտացոլումը",
    description: "Pasta-ն իտալական ռեստորանների ցանց է, որի համար մշակվել է ամբողջական տեսողական ինքնություն: Նպատակն էր համատեղել իտալական տնական մակարոնեղենի ավանդույթները և ժամանակակից արագ սննդի դինամիկան:",
    concept: "Դիզայնի հիմքում ընկած են մակարոնեղենի պարզ և ճկուն գծային կառուցվածքները, որոնք արտացոլված են ինչպես լոգոյի, այնպես էլ փաթեթավորման վրա: Կարմիր գույնն ընտրվել է որպես ախորժաբեր և էներգետիկ հիմնական շեշտադրում:",
    typography: "Outfit, Inter",
    colors: ["#d32f2f", "#f8fafc", "#0f172a"]
  },
  {
    id: "eleven",
    title: "11...",
    color: "#e65100",
    image: "/branding/eleven.png",
    tagline: "Ժամանակի և տարածության մինիմալիստական երկրաչափություն",
    description: "11... բրենդը ներկայացնում է կոնցեպտուալ ժամանակակից արվեստի և ճարտարապետության ստուդիա: Անվանումն ու դիզայնը հղում են կատարում անսահմանությանը և մինիմալիզմին:",
    concept: "Լոգոն կառուցված է երկու զուգահեռ գծերից, որոնք ստեղծում են կառուցվածքային կատարելության զգացողություն: Նարնջագույնը խորհրդանշում է ստեղծարար միտքն ու դինամիկ զարգացումը:",
    typography: "Outfit, sans-serif",
    colors: ["#e65100", "#1e293b", "#ffffff"]
  },
  {
    id: "posters",
    title: "Posters",
    color: "#880e4f",
    image: "/branding/posters.png",
    tagline: "Պաստառային արվեստի և տառաձևերի փորձարարական սինթեզ",
    description: "Experimental Poster Design-ը նախագծերի շարք է, որտեղ ուսումնասիրվում է տառատեսակների ազդեցությունը տեսողական հաղորդակցության մեջ: Յուրաքանչյուր պաստառ ստեղծված է որպես ինքնուրույն արվեստի գործ:",
    concept: "Կոմպոզիցիաները հիմնված են հակադրությունների վրա՝ խոշոր տառաձևեր, վառ երանգներ և մաթեմատիկական ցանցերի (grids) օգտագործում: Գույնը խորը մորեգույնն է, որը ստեղծում է դրամատիկ տեսողական շեշտ:",
    typography: "Custom Geometric Font, Inter",
    colors: ["#880e4f", "#ffeb3b", "#0a0a0a"]
  },
  {
    id: "teal-lines",
    title: "Teal Lines",
    color: "#004d40",
    image: "/branding/teal.png",
    tagline: "Էկոլոգիապես մաքուր տեխնոլոգիաների գծային ինքնություն",
    description: "Teal Lines-ը էներգետիկ արդյունավետության և կայուն զարգացման տեխնոլոգիական ընկերություն է: Տեսողական համակարգը կառուցված է մաքրության և կայունության գաղափարների շուրջ:",
    concept: "Լուծումները կառուցված են բարակ զուգահեռ և հատվող գծերի վրա, որոնք խորհրդանշում են տեխնոլոգիական ցանցերն ու հոսանքները: Մուգ զմրուխտե կանաչը ներկայացնում է էկոլոգիան:",
    typography: "Outfit, Arial",
    colors: ["#004d40", "#a6d5c7", "#ffffff"]
  },
  {
    id: "mobile-ui",
    title: "Mobile UI",
    color: "#311b92",
    image: "/branding/mobile.png",
    tagline: "Բջջային հավելվածների ինտերֆեյսի ճկուն կառուցվածք",
    description: "Mobile UI-ը դիզայն-համակարգերի և բջջային հավելվածների նախատիպերի հավաքածու է: Այն ցույց է տալիս, թե ինչպես կարելի է ստեղծել էրգոնոմիկ և գեղեցիկ ինտերֆեյսներ ժամանակակից սմարթֆոնների համար:",
    concept: "Դիզայնը հիմնված է կատարյալ երկրաչափական մոդուլների և բարձր հակադրությամբ տեքստային բլոկների վրա: Մանուշակագույն երանգը ստեղծում է տեխնոլոգիական և պրեմիում միջավայր:",
    typography: "Inter, Helvetica",
    colors: ["#311b92", "#c7baff", "#f8fafc"]
  }
];

export function getPastelColor(colorStr: string): string {
  if (!colorStr) return "#B7DAD4"; // fallback
  
  // Find all hex colors in the string (e.g. [#0f172a, #1e3a5f])
  const hexMatches = colorStr.match(/#[0-9a-fA-F]{3,6}/g);
  if (!hexMatches || hexMatches.length === 0) return "#B7DAD4";

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (const hex of hexMatches) {
    let cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
    }
    if (cleanHex.length === 6) {
      totalR += parseInt(cleanHex.substring(0, 2), 16);
      totalG += parseInt(cleanHex.substring(2, 4), 16);
      totalB += parseInt(cleanHex.substring(4, 6), 16);
    } else {
      totalR += 183;
      totalG += 218;
      totalB += 212;
    }
  }

  const avgR = Math.round(totalR / hexMatches.length) / 255;
  const avgG = Math.round(totalG / hexMatches.length) / 255;
  const avgB = Math.round(totalB / hexMatches.length) / 255;

  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case avgR: h = (avgG - avgB) / d + (avgG < avgB ? 6 : 0); break;
      case avgG: h = (avgB - avgR) / d + 2; break;
      case avgB: h = (avgR - avgG) / d + 4; break;
    }
    h /= 6;
  }

  const hue = Math.round(h * 360);
  const targetS = Math.min(Math.round(s * 100), 50); 
  const targetL = 82; 

  return `hsl(${hue}, ${targetS}%, ${targetL}%)`;
}

export function getCasePastelColor(work: { title: string; bg: string }): string {
  if (!work) return "#B7DAD4";
  
  const titleLower = work.title ? work.title.toLowerCase().trim() : "";
  
  const staticCase = brandingCases.find(c => 
    c.title.toLowerCase().trim() === titleLower || 
    titleLower.includes(c.title.toLowerCase().trim())
  );
  
  if (staticCase) {
    return getPastelColor(staticCase.color);
  }
  
  return getPastelColor(work.bg);
}

