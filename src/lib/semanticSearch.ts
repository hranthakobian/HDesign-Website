/**
 * Semantic Search & Concept Mapping for HDesign Website
 * Provides:
 * 1. Semantic synonym expansion (Armenian & English)
 * 2. Armenian morphological suffix stripping (stemming)
 * 3. Transliteration mapping (Latin to Armenian phonetics)
 * 4. Multi-modal relevance scoring combining text, semantic concepts, OCR tokens, and Lens visual scores.
 */

// Common Armenian noun & adjective inflections to strip for root matching
const HY_SUFFIXES = [
  'ները', 'ների', 'ներին', 'ներից', 'ներով', 'ներում',
  'երը', 'երի', 'երին', 'երից', 'երով', 'երում',
  'ության', 'ությունը', 'ություն',
  'ական', 'ային',
  'ները', 'ներ',
  'երը', 'եր',
  'ից', 'ով', 'ում', 'ին', 'ի', 'ը', 'ն'
];

/**
 * Normalizes Armenian text: lowercases, trims, and strips common inflectional suffixes
 */
export function stemArmenianWord(word: string): string {
  let clean = word.toLowerCase().trim();
  if (clean.length <= 3) return clean;

  for (const suffix of HY_SUFFIXES) {
    if (clean.endsWith(suffix) && clean.length - suffix.length >= 3) {
      return clean.slice(0, -suffix.length);
    }
  }
  return clean;
}

// Latin-to-Armenian transliteration map for phonetic search
const TRANSLIT_MAP: Record<string, string> = {
  'sh': 'շ', 'ch': 'չ', 'zh': 'ժ', 'dz': 'ձ', 'ts': 'ծ', 'gh': 'ղ',
  'ph': 'փ', 'th': 'թ', 'kh': 'խ', 'vo': 'ո', 'ev': 'և',
  'a': 'ա', 'b': 'բ', 'g': 'գ', 'd': 'դ', 'e': 'ե', 'z': 'զ',
  't': 'տ', 'i': 'ի', 'l': 'լ', 'k': 'կ', 'h': 'հ', 'm': 'մ',
  'y': 'յ', 'n': 'ն', 'o': 'օ', 'p': 'պ', 'j': 'ջ',
  'r': 'ր', 's': 'ս', 'v': 'վ', 'u': 'ու', 'f': 'ֆ'
};

export function transliterateToArmenian(input: string): string {
  let str = input.toLowerCase();
  for (const [lat, arm] of Object.entries(TRANSLIT_MAP)) {
    str = str.split(lat).join(arm);
  }
  return str;
}

// Semantic Concept Clusters
export interface ConceptGroup {
  name: string;
  category: 'app' | 'case' | 'font' | 'image' | 'page' | 'doc';
  terms: string[];
}

export const SEMANTIC_CONCEPTS: ConceptGroup[] = [
  {
    name: 'apps_software',
    category: 'app',
    terms: [
      'հավելված', 'հավելվածներ', 'ծրագիր', 'ծրագրեր', 'գործիք', 'գործիքներ',
      'փլագին', 'փլագիններ', 'մոդուլ', 'սոֆթ', 'app', 'apps', 'software',
      'tool', 'tools', 'plugin', 'plugins', 'extension', 'variable font controller',
      'photoshop', 'illustrator', 'cep', 'apk', 'exe', 'macos', 'windows', 'install'
    ]
  },
  {
    name: 'cases_branding',
    category: 'case',
    terms: [
      'բրենդինգ', 'բրենդավորում', 'բրենդ', 'լոգո', 'տարբերանշան', 'ոճ', 'ինքնություն',
      'փաթեթավորում', 'պաստառ', 'պաստառներ', 'ցուցահանդես', 'արտ', 'դիզայն', 'պորտֆոլիո',
      'նախագիծ', 'աշխատանք', 'աշխատանքներ', 'branding', 'brand', 'logo', 'identity',
      'packaging', 'poster', 'posters', 'art', 'artwork', 'portfolio', 'showcase',
      'exhibition', 'case', 'cases', 'works', 'pasta', 'eleven', 'teal', 'mobile'
    ]
  },
  {
    name: 'fonts_typography',
    category: 'font',
    terms: [
      'տառատեսակ', 'տառատեսակներ', 'տառ', 'տառեր', 'տիպոգրաֆիկա', 'տառաձև', 'գիր',
      'այբուբեն', 'գլիֆ', 'գլիֆներ', 'տեքստ', 'font', 'fonts', 'typeface', 'typefaces',
      'typography', 'glyph', 'glyphs', 'otf', 'ttf', 'woff', 'woff2', 'variable font',
      'specimen', 'weight', 'slant', 'kern', 'ligature'
    ]
  },
  {
    name: 'design_system',
    category: 'doc',
    terms: [
      'կոմպոնենտ', 'բաղադրիչ', 'համակարգ', 'կոճակ', 'մուտքագրում', 'ընտրիչ', 'սվիչ',
      'սլայդեր', 'նախշ', 'տեսանյութ', 'փաստաթուղթ', 'փորձանմուշ', 'component', 'components',
      'button', 'select', 'input', 'slider', 'switch', 'checkbox', 'radio', 'segment',
      'hdesign', 'design system', 'tokens', 'docs', 'samples', 'guide', 'api'
    ]
  },
  {
    name: 'author_profile',
    category: 'page',
    terms: [
      'հրանտ', 'հակոբյան', 'հեղինակ', 'դիզայներ', 'ճարտարապետ', 'մասին', 'կենսագրություն',
      'ռեզյումե', 'փորձ', 'հմտություններ', 'hrant', 'hakobyan', 'author', 'designer',
      'architect', 'bio', 'biography', 'about', 'skills', 'experience', 'resume'
    ]
  },
  {
    name: 'contact_social',
    category: 'page',
    terms: [
      'կապ', 'հաղորդագրություն', 'նամակ', 'էլ․ հասցե', 'էլփոստ', 'հեռախոս', 'հասցե',
      'սոցցանց', 'ինստագրամ', 'տելեգրամ', 'linkedin', 'contact', 'email', 'message',
      'phone', 'social', 'address', 'reach', 'feedback'
    ]
  }
];

export interface ScoredSearchItem<T> {
  item: T;
  score: number;
  matchedConcepts: string[];
  isVisualMatch?: boolean;
  visualSimilarity?: number;
}

/**
 * Calculates a semantic relevance score between a query (and optional OCR / visual matches)
 * and an index item.
 */
export function calculateSemanticScore(
  query: string,
  item: {
    title_hy: string;
    title_en: string;
    subtitle_hy?: string;
    subtitle_en?: string;
    description_hy?: string;
    description_en?: string;
    tags?: string[];
    category?: string;
    type: string;
  },
  ocrKeywords: string[] = [],
  visualSimilarity: number = 0
): { score: number; matchedConcepts: string[] } {
  let score = 0;
  const matchedConcepts: string[] = [];

  const rawQuery = query.trim().toLowerCase();
  if (!rawQuery && ocrKeywords.length === 0 && visualSimilarity === 0) {
    return { score: 1, matchedConcepts: [] };
  }

  // Tokenize & stem query words
  const queryTokens = rawQuery
    .split(/[\s,.;:!?«»()[\]{}"'\/\\]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);

  const queryStems = queryTokens.map(stemArmenianWord);
  const translitQuery = transliterateToArmenian(rawQuery);
  const translitStems = translitQuery.split(/\s+/).map(stemArmenianWord);

  // Combine query tokens with OCR keywords
  const allSearchTokens = Array.from(new Set([...queryTokens, ...ocrKeywords.map(w => w.toLowerCase())]));
  const allStems = Array.from(new Set([...queryStems, ...ocrKeywords.map(stemArmenianWord), ...translitStems]));

  // Item text corpus
  const titleHy = (item.title_hy || '').toLowerCase();
  const titleEn = (item.title_en || '').toLowerCase();
  const subtitleHy = (item.subtitle_hy || '').toLowerCase();
  const subtitleEn = (item.subtitle_en || '').toLowerCase();
  const descHy = (item.description_hy || '').toLowerCase();
  const descEn = (item.description_en || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  const tags = (item.tags || []).map(t => t.toLowerCase());

  const titleText = `${titleHy} ${titleEn}`;
  const allItemText = `${titleHy} ${titleEn} ${subtitleHy} ${subtitleEn} ${descHy} ${descEn} ${category} ${tags.join(' ')}`;
  const itemStems = allItemText
    .split(/[\s,.;:!?«»()[\]{}"'\/\\]+/)
    .map(stemArmenianWord);

  // 1. Exact Full Match
  if (rawQuery.length > 1) {
    if (titleHy === rawQuery || titleEn === rawQuery) {
      score += 150;
    } else if (titleHy.includes(rawQuery) || titleEn.includes(rawQuery)) {
      score += 100;
    } else if (category.includes(rawQuery)) {
      score += 80;
    } else if (subtitleHy.includes(rawQuery) || subtitleEn.includes(rawQuery)) {
      score += 60;
    } else if (allItemText.includes(rawQuery)) {
      score += 40;
    }
  }

  // 2. Token & Stem Matches
  for (const token of allSearchTokens) {
    if (token.length < 2) continue;
    if (titleText.includes(token)) {
      score += 35;
    } else if (allItemText.includes(token)) {
      score += 20;
    }
  }

  for (const stem of allStems) {
    if (stem.length < 3) continue;
    if (itemStems.includes(stem)) {
      score += 25;
    }
  }

  // 3. Semantic Concept Cluster Matching
  for (const concept of SEMANTIC_CONCEPTS) {
    // Check if query matches any term in this concept
    const matchesConcept = allSearchTokens.some(tok =>
      concept.terms.some(term => term === tok || term.includes(tok) || stemArmenianWord(term) === stemArmenianWord(tok))
    );

    if (matchesConcept) {
      matchedConcepts.push(concept.name);
      // If item belongs to this concept's type, give strong semantic boost
      if (item.type === concept.category || (concept.category === 'doc' && item.type === 'doc')) {
        score += 50;
      }
      // Check if item text contains concept terms
      const itemHasConceptTerm = concept.terms.some(term => allItemText.includes(term));
      if (itemHasConceptTerm) {
        score += 30;
      }
    }
  }

  // 4. Visual Similarity Score Boost (from Google Lens)
  if (visualSimilarity > 0) {
    // Proportional boost: 90% similarity adds 135 points!
    score += Math.round(visualSimilarity * 1.5);
  }

  // 5. OCR Direct Word Matches
  for (const word of ocrKeywords) {
    if (word.length >= 3 && allItemText.includes(word.toLowerCase())) {
      score += 40;
    }
  }

  return { score, matchedConcepts };
}
