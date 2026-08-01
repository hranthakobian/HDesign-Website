const https = require('https');

https.get('https://api.hakobian.am/libs/v1/fonts/hdesign.ttf', (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Downloaded hdesign.ttf, size:', buffer.length, 'bytes');

    const numTables = buffer.readUInt16BE(4);
    const tables = {};
    for (let i = 0; i < numTables; i++) {
      const offset = 12 + i * 16;
      const tag = buffer.toString('ascii', offset, offset + 4);
      const tableOffset = buffer.readUInt32BE(offset + 8);
      const tableLength = buffer.readUInt32BE(offset + 12);
      tables[tag] = { offset: tableOffset, length: tableLength };
    }

    if (tables['head']) {
      const headOff = tables['head'].offset;
      const unitsPerEm = buffer.readUInt16BE(headOff + 18);
      console.log('head unitsPerEm:', unitsPerEm);
    }

    if (tables['hhea']) {
      const hheaOff = tables['hhea'].offset;
      const ascender = buffer.readInt16BE(hheaOff + 4);
      const descender = buffer.readInt16BE(hheaOff + 6);
      const lineGap = buffer.readInt16BE(hheaOff + 8);
      console.log(`hhea: Ascender=${ascender}, Descender=${descender}, LineGap=${lineGap}`);
    }

    if (tables['OS/2']) {
      const os2Off = tables['OS/2'].offset;
      const version = buffer.readUInt16BE(os2Off);
      const sTypoAscender = buffer.readInt16BE(os2Off + 68);
      const sTypoDescender = buffer.readInt16BE(os2Off + 70);
      const sTypoLineGap = buffer.readInt16BE(os2Off + 72);
      const usWinAscent = buffer.readUInt16BE(os2Off + 74);
      const usWinDescent = buffer.readUInt16BE(os2Off + 76);
      let sxHeight = 0;
      let sCapHeight = 0;
      if (version >= 2 && tables['OS/2'].length >= 96) {
        sxHeight = buffer.readInt16BE(os2Off + 86);
        sCapHeight = buffer.readInt16BE(os2Off + 88);
      }
      console.log(`OS/2 v${version}: TypoAscent=${sTypoAscender}, TypoDescent=${sTypoDescender}, WinAscent=${usWinAscent}, WinDescent=${usWinDescent}, xHeight=${sxHeight}, CapHeight=${sCapHeight}`);
    }
  });
});
