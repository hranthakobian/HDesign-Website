const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');

async function testPdf() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Read Armenian TTF font from public/
  const fontPath = 'public/HDesign.ttf';
  let customFont = null;
  if (fs.existsSync(fontPath)) {
    const fontBytes = fs.readFileSync(fontPath);
    customFont = await pdfDoc.embedFont(fontBytes);
    console.log('Embedded HDesign.ttf successfully');
  }

  const page = pdfDoc.addPage([600, 800]);

  // Test drawing text with opacity: 0
  if (customFont) {
    page.drawText('Ողջույն աշխարհ (Searchable Armenian)', {
      x: 50,
      y: 700,
      size: 24,
      font: customFont,
      color: rgb(0, 0, 0),
      opacity: 0 // invisible text layer
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('scratch/test_out.pdf', pdfBytes);
  console.log('Saved test_out.pdf, size:', pdfBytes.length);
}

testPdf().catch(console.error);
