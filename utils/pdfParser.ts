/**
 * pdfParser.ts — Importação local de faturas (PDF + CSV) — Multi-Banco
 *
 * 100% no navegador. Sem API de IA, sem dependência externa no bundle.
 *
 * Formatos suportados:
 *   PDF  → Nubank, Itaú, Bradesco, Santander, C6, Inter, BTG, XP, Caixa, Genérico
 *   CSV  → Nubank, Inter, Itaú, Bradesco, Santander e formato genérico
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  id: string;
  date: string;          // YYYY-MM-DD
  description: string;
  amount: number;
  installments?: string; // e.g. "1/3"
  originalText: string;
}

export type BankId =
  | 'nubank' | 'itau' | 'bradesco' | 'santander'
  | 'c6' | 'inter' | 'btg' | 'xp' | 'caixa'
  | 'mercadopago' | 'generic';

export interface BankOption {
  id: BankId;
  name: string;
  label: string;
}

export const SUPPORTED_BANKS: BankOption[] = [
  { id: 'nubank',      name: 'Nubank',        label: 'Nubank' },
  { id: 'itau',        name: 'Itaú',          label: 'Itaú' },
  { id: 'bradesco',    name: 'Bradesco',      label: 'Bradesco' },
  { id: 'santander',   name: 'Santander',     label: 'Santander' },
  { id: 'c6',          name: 'C6 Bank',       label: 'C6 Bank' },
  { id: 'inter',       name: 'Inter',         label: 'Banco Inter' },
  { id: 'btg',         name: 'BTG Pactual',   label: 'BTG Pactual' },
  { id: 'xp',          name: 'XP',            label: 'XP/Rico' },
  { id: 'caixa',       name: 'Caixa',         label: 'Caixa Econômica' },
  { id: 'mercadopago', name: 'Mercado Pago',  label: 'Mercado Pago' },
  { id: 'generic',     name: 'Outro',         label: 'Outro Banco' },
];

export interface ParseResult {
  bank: BankId;
  bankName: string;
  transactions: ParsedTransaction[];
  rawLineCount: number;
  format: 'pdf' | 'csv';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
  JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
  FEB: 1, MAY: 4, AUG: 7, SEP: 8, OCT: 9, DEC: 11,
};

const SKIP_PATTERNS = [
  'pagamento recebido', 'pagamento efetuado', 'pagamento em ',
  'saldo anterior', 'saldo total', 'saldo devedor',
  'total nacional', 'total internacional', 'total da fatura',
  'limite de crédito', 'limite disponível', 'limite total',
  'vencimento', 'fechamento', 'data de', 'fatura de',
  'encargos', 'juros', 'multa ',
  'cpf:', 'cnpj:', 'agência', 'conta corrente',
];

function shouldSkip(line: string): boolean {
  const l = line.toLowerCase();
  return SKIP_PATTERNS.some(p => l.includes(p));
}

function parseAmount(raw: string): number {
  const clean = raw.replace(/R\$\s*/g, '').replace(/\s/g, '');
  const negative = clean.startsWith('-');
  const abs = clean.replace(/^-/, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(abs);
  return isNaN(num) ? NaN : (negative ? -num : num);
}

function makeId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function buildDate(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString().split('T')[0];
}

const INSTALLMENT_RE = /[\s-]*(\d{1,2}\/\d{1,2})[\s-]*$/;

function splitInstallments(desc: string): { description: string; installments?: string } {
  const m = desc.match(INSTALLMENT_RE);
  return m
    ? { description: desc.replace(INSTALLMENT_RE, '').trim(), installments: m[1] }
    : { description: desc.trim() };
}

// ─── PDF.js loader ────────────────────────────────────────────────────────────

let pdfjsLib: any = null;

async function getPdfjsLib(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  try {
    const mod = await import('pdfjs-dist');
    try {
      mod.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';
    } catch { /* ignore */ }
    pdfjsLib = mod;
  } catch {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs');
    pdfjsLib = (window as any).pdfjsLib;
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';
    }
  }
  return pdfjsLib;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.type = 'module'; s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(s);
  });
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

export const extractTextFromPdf = async (file: File): Promise<string[]> => {
  const lib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdfDocument = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lineMap: Record<number, { text: string; x: number }[]> = {};
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      (lineMap[y] ??= []).push({ text: item.str, x });
    }
    const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
    for (const y of sortedY) {
      const line = lineMap[y].sort((a, b) => a.x - b.x).map(i => i.text).join(' ').trim();
      if (line) allLines.push(line);
    }
  }
  return allLines;
};

// ─── Bank detection ───────────────────────────────────────────────────────────

export function detectBank(lines: string[]): BankId {
  const sample = lines.slice(0, 40).join(' ').toLowerCase();
  if (sample.includes('nubank')) return 'nubank';
  if (sample.includes('itaú') || sample.includes('itau') || sample.includes('icard')) return 'itau';
  if (sample.includes('bradesco')) return 'bradesco';
  if (sample.includes('santander')) return 'santander';
  if (sample.includes('c6 bank') || sample.includes('c6bank')) return 'c6';
  if (sample.includes('banco inter') || sample.includes('bancointer')) return 'inter';
  if (sample.includes('btg') || sample.includes('pactual')) return 'btg';
  if (sample.includes('xp investimentos') || sample.includes('rico')) return 'xp';
  if (sample.includes('caixa econômica') || sample.includes('caixa economica')) return 'caixa';
  if (sample.includes('mercado pago') || sample.includes('mercadopago')) return 'mercadopago';
  return 'generic';
}

// ─── PDF parsers (per bank) ───────────────────────────────────────────────────

function parseNubank(lines: string[], year: number): ParsedTransaction[] {
  const re = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*?)\s+(-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  return lines.filter(l => !shouldSkip(l)).flatMap(line => {
    const m = line.match(re);
    if (!m) return [];
    const amount = parseAmount(m[4]);
    if (isNaN(amount) || amount <= 0) return [];
    const { description, installments } = splitInstallments(m[3]);
    return [{ id: makeId(), originalText: line, installments,
      date: buildDate(year, MONTH_MAP[m[2].toUpperCase()] ?? 0, parseInt(m[1])), description, amount }];
  });
}

function parseSlashDate(lines: string[], year: number): ParsedTransaction[] {
  const re = /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.+?)\s+R?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  return lines.filter(l => !shouldSkip(l)).flatMap(line => {
    const normalized = line.replace(/\s{2,}/g, ' ').trim();
    const m = normalized.match(re);
    if (!m) return [];
    const amount = parseAmount(m[4]);
    if (isNaN(amount) || amount <= 0) return [];
    const { description, installments } = splitInstallments(m[3]);
    return [{ id: makeId(), originalText: line, installments,
      date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount }];
  });
}

function parseSantander(lines: string[], year: number): ParsedTransaction[] {
  const reWithYear = /^(\d{2})\/(\d{2})\/(\d{2,4})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const reShort    = /^(\d{2})\/(\d{2})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  return lines.filter(l => !shouldSkip(l)).flatMap(line => {
    const n = line.replace(/\s{2,}/g, ' ').trim();
    let m = n.match(reWithYear);
    if (m) {
      const amount = parseAmount(m[5]);
      if (isNaN(amount) || amount <= 0) return [];
      const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
      const { description, installments } = splitInstallments(m[4]);
      return [{ id: makeId(), originalText: line, installments,
        date: buildDate(yr, parseInt(m[2]) - 1, parseInt(m[1])), description, amount }];
    }
    m = n.match(reShort);
    if (m) {
      const amount = parseAmount(m[4]);
      if (isNaN(amount) || amount <= 0) return [];
      const { description, installments } = splitInstallments(m[3]);
      return [{ id: makeId(), originalText: line, installments,
        date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount }];
    }
    return [];
  });
}

function parseGenericPdf(lines: string[], year: number): ParsedTransaction[] {
  const patA = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*?)\s+(-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  const patB = /^(\d{2})\/(\d{2})\s+(.*?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const patC = /^(\d{2})\/(\d{2})\/(\d{2,4})\s+(.*?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const patD = /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.*?)\s+R\$\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  const seen = new Set<string>();
  const results: ParsedTransaction[] = [];

  for (const line of lines) {
    if (shouldSkip(line)) continue;
    const n = line.replace(/\s{2,}/g, ' ').trim();
    let matched = false;

    for (const [pat, handler] of [
      [patA, (m: RegExpMatchArray) => {
        const amount = parseAmount(m[4]);
        if (isNaN(amount) || amount <= 0) return null;
        const { description, installments } = splitInstallments(m[3]);
        return { date: buildDate(year, MONTH_MAP[m[2].toUpperCase()] ?? 0, parseInt(m[1])), description, amount, installments, key: `${m[1]}${m[2]}${description}${amount}` };
      }],
      [patD, (m: RegExpMatchArray) => {
        const amount = parseAmount(m[4]);
        if (isNaN(amount) || amount <= 0) return null;
        const { description, installments } = splitInstallments(m[3]);
        return { date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount, installments, key: `${m[1]}${m[2]}${description}${amount}` };
      }],
      [patC, (m: RegExpMatchArray) => {
        const amount = parseAmount(m[5]);
        if (isNaN(amount) || amount <= 0) return null;
        const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
        const { description, installments } = splitInstallments(m[4]);
        return { date: buildDate(yr, parseInt(m[2]) - 1, parseInt(m[1])), description, amount, installments, key: `${m[1]}${m[2]}${m[3]}${description}${amount}` };
      }],
      [patB, (m: RegExpMatchArray) => {
        const amount = parseAmount(m[4]);
        if (isNaN(amount) || amount <= 0) return null;
        const { description, installments } = splitInstallments(m[3]);
        return { date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount, installments, key: `${m[1]}${m[2]}${description}${amount}` };
      }],
    ] as [RegExp, (m: RegExpMatchArray) => any][]) {
      if (matched) break;
      const m = n.match(pat);
      if (m) {
        const r = handler(m);
        if (r && !seen.has(r.key)) {
          seen.add(r.key);
          results.push({ id: makeId(), originalText: line, date: r.date, description: r.description, amount: r.amount, installments: r.installments });
          matched = true;
        }
      }
    }
  }
  return results;
}

// ─── Unified PDF parse ────────────────────────────────────────────────────────

export function parseBankTransactions(lines: string[], year: number, bankHint?: BankId): ParseResult {
  const bank = bankHint ?? detectBank(lines);
  const bankInfo = SUPPORTED_BANKS.find(b => b.id === bank) ?? SUPPORTED_BANKS[SUPPORTED_BANKS.length - 1];

  let transactions: ParsedTransaction[];
  switch (bank) {
    case 'nubank':    transactions = parseNubank(lines, year); break;
    case 'santander': transactions = parseSantander(lines, year); break;
    case 'itau': case 'bradesco': case 'c6': case 'inter':
      transactions = parseSlashDate(lines, year); break;
    default: transactions = parseGenericPdf(lines, year); break;
  }

  if (transactions.length === 0 && bank !== 'generic') {
    transactions = parseGenericPdf(lines, year);
  }

  return { bank, bankName: bankInfo.name, transactions, rawLineCount: lines.length, format: 'pdf' };
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function csvDetectSep(line: string): string {
  const semis = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return semis > commas ? ';' : ',';
}

function csvUnquote(v: string): string {
  return v.replace(/^["']|["']$/g, '').trim();
}

/** Parse a single CSV line respecting quoted fields */
function csvSplitLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      inQuote = !inQuote;
    } else if (ch === sep && !inQuote) {
      result.push(csvUnquote(current));
      current = '';
      i++;
      continue;
    } else {
      current += ch;
    }
    i++;
  }
  result.push(csvUnquote(current));
  return result;
}

/** Parse amount from various CSV formats:
 *  - "150.00"  (Nubank ISO)
 *  - "150,00"  (BR)
 *  - "R$ 1.234,56"  (BR with symbol)
 *  - "-150.00" (negative = credit/payment, skip)
 */
function parseCsvAmount(raw: string): number {
  const s = raw.replace(/R\$\s*/g, '').replace(/\s/g, '');
  if (!s) return NaN;
  const negative = s.startsWith('-');
  const abs = s.replace(/^[-+]/, '');

  let num: number;
  // Detect format: if has both . and , → BR format "1.234,56"
  if (abs.includes(',') && abs.includes('.')) {
    // Could be "1.234,56" (BR) or "1,234.56" (US)
    const lastComma = abs.lastIndexOf(',');
    const lastDot = abs.lastIndexOf('.');
    if (lastComma > lastDot) {
      // BR: 1.234,56
      num = parseFloat(abs.replace(/\./g, '').replace(',', '.'));
    } else {
      // US: 1,234.56
      num = parseFloat(abs.replace(/,/g, ''));
    }
  } else if (abs.includes(',')) {
    // Only comma: could be "150,00" (BR decimal) or "1,234" (US thousands)
    const afterComma = abs.split(',')[1] ?? '';
    if (afterComma.length === 2) {
      // BR decimal separator
      num = parseFloat(abs.replace(',', '.'));
    } else {
      // US thousands
      num = parseFloat(abs.replace(',', ''));
    }
  } else {
    num = parseFloat(abs);
  }

  return isNaN(num) ? NaN : (negative ? -num : num);
}

/** Parse a date string in multiple formats → YYYY-MM-DD */
function parseCsvDate(raw: string, year: number): string | null {
  const s = raw.trim();
  // ISO: 2024-02-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
    return buildDate(y, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  }
  // DD/MM (no year)
  const dm = s.match(/^(\d{2})\/(\d{2})$/);
  if (dm) return buildDate(year, parseInt(dm[2]) - 1, parseInt(dm[1]));
  // MM/DD/YYYY (US)
  const mdy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdy && parseInt(mdy[1]) <= 12) {
    return buildDate(parseInt(mdy[3]), parseInt(mdy[1]) - 1, parseInt(mdy[2]));
  }
  return null;
}

/** Find the index of the best-matching column header */
function findCol(headers: string[], patterns: RegExp[]): number {
  for (const pat of patterns) {
    const idx = headers.findIndex(h => pat.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseBankCsv(text: string, year: number, bankHint?: BankId): ParseResult {
  // Normalize line endings and split
  const rows = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmpty = rows.filter(r => r.trim() !== '');
  if (nonEmpty.length < 2) {
    return { bank: 'generic', bankName: 'Genérico', transactions: [], rawLineCount: 0, format: 'csv' };
  }

  // Detect separator from first line
  const sep = csvDetectSep(nonEmpty[0]);
  const headers = csvSplitLine(nonEmpty[0], sep).map(h => h.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''));

  // Auto-detect bank from headers + first few lines
  const bank = bankHint ?? detectBank(nonEmpty.slice(0, 10));
  const bankInfo = SUPPORTED_BANKS.find(b => b.id === bank) ?? SUPPORTED_BANKS[SUPPORTED_BANKS.length - 1];

  // ── Nubank CSV (date,category,title,amount) ──────────────────────────────
  // Nubank uses ISO dates and decimal amounts (positive = expense)
  const isNubankCsv = headers.includes('date') && headers.includes('title') && headers.includes('amount');
  if (isNubankCsv || bank === 'nubank') {
    const dateIdx = headers.indexOf('date');
    const titleIdx = headers.indexOf('title');
    const amtIdx = headers.indexOf('amount');
    const catIdx = headers.indexOf('category');

    const transactions: ParsedTransaction[] = [];
    for (let i = 1; i < nonEmpty.length; i++) {
      const cols = csvSplitLine(nonEmpty[i], sep);
      if (cols.length < 3) continue;
      const rawDate = cols[dateIdx] ?? '';
      const rawDesc = cols[titleIdx] ?? '';
      const rawAmt = cols[amtIdx] ?? '';
      const date = parseCsvDate(rawDate, year);
      if (!date) continue;
      const amount = parseCsvAmount(rawAmt);
      if (isNaN(amount) || amount <= 0) continue; // skip payments (negative)
      const { description, installments } = splitInstallments(rawDesc);
      const _ = catIdx >= 0 ? cols[catIdx] : undefined; // category available but not used here
      transactions.push({ id: makeId(), date, description, amount, installments, originalText: nonEmpty[i] });
    }
    return { bank, bankName: bankInfo.name, transactions, rawLineCount: nonEmpty.length, format: 'csv' };
  }

  // ── Generic / PT-BR CSV ──────────────────────────────────────────────────
  // Try to detect column positions
  const dateIdx = findCol(headers, [/^(data|date|dt\.?$|data_lan|data_movim)/, /data/, /date/]);
  const descIdx = findCol(headers, [
    /^(descri|titulo|title|hist|lançamento|lancamento|estabelecimento|comercio|memo|nome)/,
    /descri/, /hist/, /estabelecimento/
  ]);
  const amtIdx = findCol(headers, [
    /^(valor|amount|vl\.?$|montante|debito|débito)/,
    /valor/, /amount/
  ]);

  if (dateIdx === -1 || amtIdx === -1) {
    // Fallback: try to parse as "no header" positional format
    return { bank, bankName: bankInfo.name, transactions: parseGenericCsvNoHeader(nonEmpty, sep, year), rawLineCount: nonEmpty.length, format: 'csv' };
  }

  const transactions: ParsedTransaction[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const cols = csvSplitLine(nonEmpty[i], sep);
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx] ?? '';
    const rawDesc = descIdx >= 0 ? (cols[descIdx] ?? '') : cols.filter((_, j) => j !== dateIdx && j !== amtIdx).join(' ');
    const rawAmt = cols[amtIdx] ?? '';

    if (!rawDate || !rawAmt) continue;
    const skipLower = rawDesc.toLowerCase();
    if (SKIP_PATTERNS.some(p => skipLower.includes(p))) continue;

    const date = parseCsvDate(rawDate, year);
    if (!date) continue;

    const amount = parseCsvAmount(rawAmt);
    if (isNaN(amount) || amount <= 0) continue;

    const { description, installments } = splitInstallments(rawDesc || 'Compra');
    transactions.push({ id: makeId(), date, description, amount, installments, originalText: nonEmpty[i] });
  }

  return { bank, bankName: bankInfo.name, transactions, rawLineCount: nonEmpty.length, format: 'csv' };
}

/** Last resort: try to find date+amount pattern positionally in each row */
function parseGenericCsvNoHeader(rows: string[], sep: string, year: number): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  // Skip first row (might be header we don't recognize)
  for (let i = 1; i < rows.length; i++) {
    const cols = csvSplitLine(rows[i], sep);
    if (cols.length < 2) continue;
    // Try each column as potential date
    let date: string | null = null;
    let dateColIdx = -1;
    for (let j = 0; j < cols.length; j++) {
      const d = parseCsvDate(cols[j], year);
      if (d) { date = d; dateColIdx = j; break; }
    }
    if (!date) continue;
    // Try each column (except date col) as amount
    for (let j = 0; j < cols.length; j++) {
      if (j === dateColIdx) continue;
      const amount = parseCsvAmount(cols[j]);
      if (!isNaN(amount) && amount > 0) {
        const descCols = cols.filter((_, k) => k !== dateColIdx && k !== j);
        const desc = descCols.join(' ').trim() || 'Compra';
        const { description, installments } = splitInstallments(desc);
        transactions.push({ id: makeId(), date, description, amount, installments, originalText: rows[i] });
        break;
      }
    }
  }
  return transactions;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/** Parse a File object (PDF or CSV) and return structured transactions */
export async function parseInvoiceFile(
  file: File,
  year: number,
  bankHint?: BankId
): Promise<ParseResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
             || file.name.toLowerCase().endsWith('.txt');

  if (isPdf) {
    const lines = await extractTextFromPdf(file);
    return parseBankTransactions(lines, year, bankHint);
  }

  if (isCsv) {
    // Detect encoding: try UTF-8, fallback to latin-1
    let text: string;
    try {
      text = await file.text();
    } catch {
      const buf = await file.arrayBuffer();
      text = new TextDecoder('iso-8859-1').decode(buf);
    }
    return parseBankCsv(text, year, bankHint);
  }

  throw new Error('Formato não suportado. Use um arquivo PDF ou CSV.');
}

// ─── Legacy exports ───────────────────────────────────────────────────────────

export const parseNubankTransactions = (lines: string[], year: number) =>
  parseNubank(lines, year);

// ─── CSV export ───────────────────────────────────────────────────────────────

export const exportInvoiceAsCsv = (
  cardName: string,
  monthLabel: string,
  transactions: Array<{ date: string; description: string; amount: number; categoryName?: string }>,
  totalAmount: number
): void => {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const rows = [
    `"Fatura ${cardName} — ${monthLabel}"`,
    '',
    '"Data","Descrição","Categoria","Valor"',
    ...transactions.map(tx =>
      [
        `"${new Date(tx.date).toLocaleDateString('pt-BR')}"`,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${(tx.categoryName ?? '').replace(/"/g, '""')}"`,
        `"${fmt(tx.amount)}"`,
      ].join(',')
    ),
    '',
    `"","","TOTAL","${fmt(totalAmount)}"`,
  ];

  const csv = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fatura_${cardName.toLowerCase().replace(/\s+/g, '_')}_${monthLabel.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
