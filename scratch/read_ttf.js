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

    function readString(off, length, platformID) {
      const slice = buffer.slice(off, off + length);
      if (platformID === 3 || platformID === 0) {
        const swapped = Buffer.alloc(slice.length);
        for (let i = 0; i < slice.length; i += 2) {
          swapped[i] = slice[i + 1] || 0;
          swapped[i + 1] = slice[i];
        }
        return swapped.toString('utf16le').replace(/\0/g, '').trim();
      }
      return slice.toString('utf8').replace(/\0/g, '').trim();
    }

    const nameMap = {};
    if (tables['name']) {
      console.log('\n--- NAME TABLE RECRORDS ---');
      const nameOff = tables['name'].offset;
      const count = buffer.readUInt16BE(nameOff + 2);
      const stringOffset = nameOff + buffer.readUInt16BE(nameOff + 4);
      for (let i = 0; i < count; i++) {
        const recordOff = nameOff + 6 + i * 12;
        const platformID = buffer.readUInt16BE(recordOff);
        const encodingID = buffer.readUInt16BE(recordOff + 2);
        const languageID = buffer.readUInt16BE(recordOff + 4);
        const nameID = buffer.readUInt16BE(recordOff + 6);
        const length = buffer.readUInt16BE(recordOff + 8);
        const offset = buffer.readUInt16BE(recordOff + 10);
        
        const str = readString(stringOffset + offset, length, platformID);
        if (str) {
          nameMap[nameID] = str;
          console.log(`NameID ${nameID} (p${platformID}/e${encodingID}): "${str}"`);
        }
      }
    }

    if (tables['fvar']) {
      console.log('\n--- FVAR TABLE (Variations & Masters) ---');
      const fvarOff = tables['fvar'].offset;
      const axisArrayOffset = fvarOff + buffer.readUInt16BE(fvarOff + 4);
      const axisCount = buffer.readUInt16BE(fvarOff + 8);
      const axisSize = buffer.readUInt16BE(fvarOff + 10);
      const instanceCount = buffer.readUInt16BE(fvarOff + 12);
      const instanceSize = buffer.readUInt16BE(fvarOff + 14);

      console.log('Axes count:', axisCount);
      for (let i = 0; i < axisCount; i++) {
        const aOff = axisArrayOffset + i * axisSize;
        const tag = buffer.toString('ascii', aOff, aOff + 4);
        const minVal = buffer.readInt32BE(aOff + 4) / 65536;
        const defVal = buffer.readInt32BE(aOff + 8) / 65536;
        const maxVal = buffer.readInt32BE(aOff + 12) / 65536;
        const nameID = buffer.readUInt16BE(aOff + 18);
        console.log(`Axis ${i+1}: Tag="${tag}", Min=${minVal}, Default=${defVal}, Max=${maxVal}, Name="${nameMap[nameID] || nameID}"`);
      }

      console.log('\nNamed Instances / Styles count:', instanceCount);
      const instanceArrayOffset = axisArrayOffset + axisCount * axisSize;
      for (let i = 0; i < instanceCount; i++) {
        const instOff = instanceArrayOffset + i * instanceSize;
        const subNameID = buffer.readUInt16BE(instOff);
        const coords = [];
        for (let j = 0; j < axisCount; j++) {
          coords.push(buffer.readInt32BE(instOff + 4 + j * 4) / 65536);
        }
        console.log(`Instance ${i+1}: Style Name="${nameMap[subNameID] || subNameID}" (ID ${subNameID}), Coords=[${coords.join(', ')}]`);
      }
    }
  });
});
