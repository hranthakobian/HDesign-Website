import { 
  getAvailableThemes, 
  getActiveTheme, 
  setActiveTheme, 
  getPage, 
  getAllPages 
} from '../src/lib/themeEngine';

async function main() {
  console.log('1. Testing getAvailableThemes()...');
  const themes = await getAvailableThemes();
  console.log(`   Found ${themes.length} themes:`, themes.map(t => `${t.id} (${t.name})`));
  if (themes.length < 1) throw new Error('Expected at least 1 primary theme (default)');

  const primary = themes.find(t => t.id === 'default');
  if (!primary) throw new Error('Primary theme "default" not found');

  console.log('\n2. Testing getActiveTheme()...');
  const active = await getActiveTheme();
  console.log(`   Active theme: ${active.id} - ${active.name}`);

  console.log('\n3. Testing getAllPages()...');
  const pages = await getAllPages();
  console.log(`   Found ${pages.length} pages:`, pages.map(p => p.slug));

  console.log('\n4. Testing getPage("index")...');
  const page = await getPage('index');
  if (!page) throw new Error('Index page not found');
  console.log(`   Index page title: ${page.title}, blocks count: ${page.blocks.length}`);

  console.log('\n✓ Native Next.js Theme & Data Engine verification succeeded without Twig!');
}

main().catch(err => {
  console.error('Pipeline test failed:', err);
  process.exit(1);
});
