import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { BlockDefinition } from '@/lib/themeTypes';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CUSTOM_BLOCKS_FILE = path.join(DATA_DIR, 'custom_blocks.json');

async function getCustomBlocks(): Promise<BlockDefinition[]> {
  try {
    if (fsSync.existsSync(CUSTOM_BLOCKS_FILE)) {
      const content = await fs.readFile(CUSTOM_BLOCKS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom_blocks.json:', err);
  }
  return [];
}

export async function GET() {
  const blocks = await getCustomBlocks();
  return NextResponse.json({ success: true, customBlocks: blocks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, blockDef, type } = body;

    let blocks = await getCustomBlocks();

    if (action === 'delete' || action === 'remove') {
      const targetType = type || blockDef?.type;
      if (!targetType) {
        return NextResponse.json({ success: false, error: 'Type is required to delete block' }, { status: 400 });
      }
      blocks = blocks.filter(b => b.type !== targetType);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(CUSTOM_BLOCKS_FILE, JSON.stringify(blocks, null, 2), 'utf-8');
      return NextResponse.json({ success: true, customBlocks: blocks });
    }

    // Default action: Create or Update block definition
    if (!blockDef || !blockDef.type || !blockDef.name) {
      return NextResponse.json({ success: false, error: 'Block type and name are required' }, { status: 400 });
    }

    const cleanType = blockDef.type.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const existingIndex = blocks.findIndex(b => b.type === cleanType);

    const newDef: BlockDefinition = {
      type: cleanType,
      name: blockDef.name.trim(),
      description: blockDef.description || 'Օգտատիրոջ կողմից ստեղծված նոր բլոկ',
      icon: blockDef.icon || '🧩',
      defaultSettings: blockDef.defaultSettings || {
        title: blockDef.name.trim(),
        subtitle: '',
        content: 'Այստեղ կարող եք գրել ձեր բովանդակությունը...',
        bg_color: 'transparent',
        padding: '60px 0',
        btn_text: 'Իմանալ Ավելին',
        btn_url: '#'
      }
    };

    if (existingIndex >= 0) {
      blocks[existingIndex] = newDef;
    } else {
      blocks.push(newDef);
    }

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CUSTOM_BLOCKS_FILE, JSON.stringify(blocks, null, 2), 'utf-8');

    return NextResponse.json({ success: true, customBlocks: blocks, createdBlock: newDef });
  } catch (err: any) {
    console.error('Error creating custom block:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to save custom block' }, { status: 500 });
  }
}
