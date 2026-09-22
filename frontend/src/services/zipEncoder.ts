// ─────────────────────────────────────────────────────────────────────────────
// zipEncoder.ts — Generador de archivos ZIP sin dependencias externas
// Soporta modo STORE (sin compresión), compatible con 7-zip / WinRAR / unzip
// ─────────────────────────────────────────────────────────────────────────────

function crc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = crc32Table();

function crc32Bytes(buf: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const TEXT_ENCODER = new TextEncoder();

export interface ZipEntry {
  /** Ruta relativa con '/' como separador, e.g. "backend/pom.xml" */
  path: string;
  /** Contenido textual del archivo */
  content: string;
}

/**
 * Construye un archivo ZIP a partir de una lista de entradas.
 * Usa modo STORE (sin compresión) — suficiente para proyectos de código fuente.
 */
export function buildZip(entries: ZipEntry[]): Blob {
  const parts: Uint8Array[] = [];
  const centralEntries: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = TEXT_ENCODER.encode(entry.path);
    const dataBytes = TEXT_ENCODER.encode(entry.content);
    const crc = crc32Bytes(dataBytes);
    const size = dataBytes.length;

    // ── Local File Header (30 + nameLen) ──
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lh = new DataView(localHeader.buffer);
    lh.setUint32(0, 0x04034b50, true);   // signature
    lh.setUint16(4, 20, true);           // version needed
    lh.setUint16(6, 0, true);            // flags
    lh.setUint16(8, 0, true);            // compression = STORE
    lh.setUint16(10, 0x0000, true);      // mod time
    lh.setUint16(12, 0x5821, true);      // mod date (2026-09-21)
    lh.setUint32(14, crc, true);         // CRC-32
    lh.setUint32(18, size, true);        // compressed size
    lh.setUint32(22, size, true);        // uncompressed size
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);           // extra field length
    localHeader.set(nameBytes, 30);

    // ── Central Directory Entry (46 + nameLen) ──
    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const cd = new DataView(centralEntry.buffer);
    cd.setUint32(0, 0x02014b50, true);   // signature
    cd.setUint16(4, 20, true);           // version made by
    cd.setUint16(6, 20, true);           // version needed
    cd.setUint16(8, 0, true);            // flags
    cd.setUint16(10, 0, true);           // compression = STORE
    cd.setUint16(12, 0x0000, true);      // mod time
    cd.setUint16(14, 0x5821, true);      // mod date
    cd.setUint32(16, crc, true);
    cd.setUint32(20, size, true);
    cd.setUint32(24, size, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);           // extra field
    cd.setUint16(32, 0, true);           // file comment
    cd.setUint16(34, 0, true);           // disk start
    cd.setUint16(36, 0, true);           // internal attrs
    cd.setUint32(38, 0, true);           // external attrs
    cd.setUint32(42, offset, true);      // local header offset
    centralEntry.set(nameBytes, 46);

    parts.push(localHeader, dataBytes);
    centralEntries.push(centralEntry);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ce of centralEntries) {
    parts.push(ce);
    centralDirSize += ce.length;
    offset += ce.length;
  }

  // ── End of Central Directory (22 bytes) ──
  const endRecord = new Uint8Array(22);
  const end = new DataView(endRecord.buffer);
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);             // disk number
  end.setUint16(6, 0, true);             // disk with central dir
  end.setUint16(8, entries.length, true); // entries on this disk
  end.setUint16(10, entries.length, true);// total entries
  end.setUint32(12, centralDirSize, true);
  end.setUint32(16, centralDirOffset, true);
  end.setUint16(20, 0, true);            // comment length
  parts.push(endRecord);

  // Combinar todas las partes
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }

  return new Blob([result], { type: 'application/zip' });
}
