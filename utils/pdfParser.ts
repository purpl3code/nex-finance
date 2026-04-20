/**
 * pdfParser.ts — Processamento local de faturas PDF (Multi-Banco)
 *
 * Leitura 100% no navegador. Sem API de IA, sem dependência externa no bundle.
 *
 * Bancos suportados com parser dedicado:
 *   - Nubank       ("DD MMM Descrição [X/Y] valor")
 *   - Itaú         ("DD/MM Descrição valor" ou tabela com colunas)
 *   - Bradesco     ("DD/MM Descrição valor")
 *   - Santander    ("DD/MM/AAAA Descrição valor")
 *   - C6 Bank      (similar Nubank)
 *   - Inter        ("DD/MM Descrição valor" com prefixo R$)
 *   - BTG/XP/Caixa ("DD/MM Descrição valor")
 *   - Genérico     (fallback para qualquer banco)
 */

// ─── Public types ────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  id: string;
  date: string;          // YYYY-MM-DD
  description: string;
  amount: number;
  installments?: string; // e.g. "1/3"
  originalText: string;
}

export type BankId =
  | 'nubank'
  | 'itau'
  | 'bradesco'
  | 'santander'
  | 'c6'
  | 'inter'
  | 'btg'
  | 'xp'
  | 'caixa'
  | 'mercadopago'
  | 'generic';

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
  { id: 'generic',     name: 'Outro',         label: 'Outro / Desconhecido' },
];

export interface ParseResult {
  bank: BankId;
  bankName: string;
  transactions: ParsedTransaction[];
  rawLineCount: number;
}

// ─── Month map PT-BR ─────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
  JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
  FEB: 1, MAY: 4, AUG: 7, SEP: 8, OCT: 9, DEC: 11,
};

// Shared skip-line keywords (non-transaction lines)
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
  // Remove R$, spaces, then normalize
  const clean = raw.replace(/R\$\s*/g, '').replace(/\s/g, '');
  // Handle negative: "- 100,00" or "-100,00"
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
  if (m) {
    return { description: desc.replace(INSTALLMENT_RE, '').trim(), installments: m[1] };
  }
  return { description: desc.trim() };
}

// ─── Load PDF.js ─────────────────────────────────────────────────────────────
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

// ─── Extract raw text lines from PDF ─────────────────────────────────────────
export const extractTextFromPdf = async (file: File): Promise<string[]> => {
  const lib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdfDocument = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    // Group by Y coord (PDF bottom→top)
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

// ─── Bank auto-detection ──────────────────────────────────────────────────────
export function detectBank(lines: string[]): BankId {
  const sample = lines.slice(0, 40).join(' ').toLowerCase();
  if (sample.includes('nubank')) return 'nubank';
  if (sample.includes('itaú') || sample.includes('itau') || sample.includes('icard')) return 'itau';
  if (sample.includes('bradesco')) return 'bradesco';
  if (sample.includes('santander')) return 'santander';
  if (sample.includes('c6 bank') || sample.includes('c6bank')) return 'c6';
  if (sample.includes('banco inter') || sample.includes('inter ')) return 'inter';
  if (sample.includes('btg') || sample.includes('pactual')) return 'btg';
  if (sample.includes('xp investimentos') || sample.includes('xp cartão') || sample.includes('rico')) return 'xp';
  if (sample.includes('caixa econômica') || sample.includes('caixa economica')) return 'caixa';
  if (sample.includes('mercado pago') || sample.includes('mercadopago')) return 'mercadopago';
  return 'generic';
}

// ─── NUBANK parser ────────────────────────────────────────────────────────────
// Format: "03 FEV Ifood*Ifood 2/3 150,00"
function parseNubank(lines: string[], year: number): ParsedTransaction[] {
  const re = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*?)\s+(-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    if (shouldSkip(line)) continue;
    const m = line.match(re);
    if (!m) continue;
    const amount = parseAmount(m[4]);
    if (isNaN(amount) || amount <= 0) continue;
    const { description, installments } = splitInstallments(m[3]);
    results.push({
      id: makeId(), originalText: line, installments,
      date: buildDate(year, MONTH_MAP[m[2].toUpperCase()] ?? 0, parseInt(m[1])),
      description, amount,
    });
  }
  return results;
}

// ─── ITAÚ parser ──────────────────────────────────────────────────────────────
// Formats: "15/02 NETFLIX 55,90"  or  "15/02 NETFLIX R$ 55,90"
// Also handles "15/02/2024 NETFLIX 55,90"
function parseItau(lines: string[], year: number): ParsedTransaction[] {
  // With optional R$ and optional full-year
  const re = /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.+?)\s+R?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    if (shouldSkip(line)) continue;
    const m = line.match(re);
    if (!m) continue;
    const amount = parseAmount(m[4]);
    if (isNaN(amount) || amount <= 0) continue;
    const { description, installments } = splitInstallments(m[3]);
    results.push({
      id: makeId(), originalText: line, installments,
      date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])),
      description, amount,
    });
  }
  return results;
}

// ─── BRADESCO parser ──────────────────────────────────────────────────────────
// Formats: "15/02 NETFLIX 55,90"  or columns separated by many spaces
function parseBradesco(lines: string[], year: number): ParsedTransaction[] {
  const re = /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    if (shouldSkip(line)) continue;
    // Normalize multiple spaces to single
    const normalized = line.replace(/\s{2,}/g, ' ').trim();
    const m = normalized.match(re);
    if (!m) continue;
    const amount = parseAmount(m[4]);
    if (isNaN(amount) || amount <= 0) continue;
    const { description, installments } = splitInstallments(m[3]);
    results.push({
      id: makeId(), originalText: line, installments,
      date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])),
      description, amount,
    });
  }
  return results;
}

// ─── SANTANDER parser ─────────────────────────────────────────────────────────
// Format: "15/02/2024 NETFLIX 55,90"  or  "15/02 NETFLIX 55,90"
function parseSantander(lines: string[], year: number): ParsedTransaction[] {
  // Santander sometimes uses full year
  const reWithYear = /^(\d{2})\/(\d{2})\/(\d{2,4})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const reShort    = /^(\d{2})\/(\d{2})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    if (shouldSkip(line)) continue;
    const normalized = line.replace(/\s{2,}/g, ' ').trim();

    let m = normalized.match(reWithYear);
    if (m) {
      const amount = parseAmount(m[5]);
      if (isNaN(amount) || amount <= 0) continue;
      const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
      const { description, installments } = splitInstallments(m[4]);
      results.push({ id: makeId(), originalText: line, installments,
        date: buildDate(yr, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
      continue;
    }

    m = normalized.match(reShort);
    if (m) {
      const amount = parseAmount(m[4]);
      if (isNaN(amount) || amount <= 0) continue;
      const { description, installments } = splitInstallments(m[3]);
      results.push({ id: makeId(), originalText: line, installments,
        date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
    }
  }
  return results;
}

// ─── C6 BANK parser ───────────────────────────────────────────────────────────
// Similar to Nubank but sometimes uses DD/MM format
function parseC6(lines: string[], year: number): ParsedTransaction[] {
  // Try Nubank-style first, fallback to DD/MM
  const nuRe = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*?)\s+(-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  const slashRe = /^(\d{2})\/(\d{2})\s+(.*?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    if (shouldSkip(line)) continue;
    let m = line.match(nuRe);
    if (m) {
      const amount = parseAmount(m[4]);
      if (isNaN(amount) || amount <= 0) continue;
      const { description, installments } = splitInstallments(m[3]);
      results.push({ id: makeId(), originalText: line, installments,
        date: buildDate(year, MONTH_MAP[m[2].toUpperCase()] ?? 0, parseInt(m[1])), description, amount });
      continue;
    }
    m = line.match(slashRe);
    if (m) {
      const amount = parseAmount(m[4]);
      if (isNaN(amount) || amount <= 0) continue;
      const { description, installments } = splitInstallments(m[3]);
      results.push({ id: makeId(), originalText: line, installments,
        date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
    }
  }
  return results;
}

// ─── INTER parser ─────────────────────────────────────────────────────────────
// Format: "15/02 NETFLIX R$ 55,90"
function parseInter(lines: string[], year: number): ParsedTransaction[] {
  const re = /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.+?)\s+R?\$?\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  const results: ParsedTransaction[] = [];
  for (const line of lines) {
    if (shouldSkip(line)) continue;
    const normalized = line.replace(/\s{2,}/g, ' ').trim();
    const m = normalized.match(re);
    if (!m) continue;
    const amount = parseAmount(m[4]);
    if (isNaN(amount) || amount <= 0) continue;
    const { description, installments } = splitInstallments(m[3]);
    results.push({ id: makeId(), originalText: line, installments,
      date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
  }
  return results;
}

// ─── GENERIC fallback parser ──────────────────────────────────────────────────
// Tries all common patterns. Used for BTG, XP, Caixa, Mercado Pago, etc.
function parseGeneric(lines: string[], year: number): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  // Pattern A: "DD MMM(pt) desc value" (Nubank-style)
  const patA = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*?)\s+(-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$/i;
  // Pattern B: "DD/MM desc value"
  const patB = /^(\d{2})\/(\d{2})\s+(.*?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  // Pattern C: "DD/MM/YYYY desc value"
  const patC = /^(\d{2})\/(\d{2})\/(\d{2,4})\s+(.*?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;
  // Pattern D: "DD/MM desc R$ value" (Inter, some banks prefix R$)
  const patD = /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.*?)\s+R\$\s*(-?\d{1,3}(?:\.\d{3})*,\d{2})$/i;

  const seen = new Set<string>();

  for (const line of lines) {
    if (shouldSkip(line)) continue;
    const normalized = line.replace(/\s{2,}/g, ' ').trim();

    let matched = false;

    // Pattern A
    let m = normalized.match(patA);
    if (m && !matched) {
      const amount = parseAmount(m[4]);
      if (!isNaN(amount) && amount > 0) {
        const { description, installments } = splitInstallments(m[3]);
        const key = `${m[1]}${m[2]}${description}${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ id: makeId(), originalText: line, installments,
            date: buildDate(year, MONTH_MAP[m[2].toUpperCase()] ?? 0, parseInt(m[1])), description, amount });
        }
        matched = true;
      }
    }

    // Pattern D (R$ prefix)
    m = normalized.match(patD);
    if (m && !matched) {
      const amount = parseAmount(m[4]);
      if (!isNaN(amount) && amount > 0) {
        const { description, installments } = splitInstallments(m[3]);
        const key = `${m[1]}${m[2]}${description}${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ id: makeId(), originalText: line, installments,
            date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
        }
        matched = true;
      }
    }

    // Pattern C (with year)
    m = normalized.match(patC);
    if (m && !matched) {
      const amount = parseAmount(m[5]);
      if (!isNaN(amount) && amount > 0) {
        const yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
        const { description, installments } = splitInstallments(m[4]);
        const key = `${m[1]}${m[2]}${m[3]}${description}${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ id: makeId(), originalText: line, installments,
            date: buildDate(yr, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
        }
        matched = true;
      }
    }

    // Pattern B (DD/MM)
    m = normalized.match(patB);
    if (m && !matched) {
      const amount = parseAmount(m[4]);
      if (!isNaN(amount) && amount > 0) {
        const { description, installments } = splitInstallments(m[3]);
        const key = `${m[1]}${m[2]}${description}${amount}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ id: makeId(), originalText: line, installments,
            date: buildDate(year, parseInt(m[2]) - 1, parseInt(m[1])), description, amount });
        }
      }
    }
  }
  return results;
}

// ─── Unified parse entry point ────────────────────────────────────────────────
export function parseBankTransactions(
  lines: string[],
  year: number,
  bankHint?: BankId
): ParseResult {
  const bank = bankHint ?? detectBank(lines);
  const bankInfo = SUPPORTED_BANKS.find(b => b.id === bank) ?? SUPPORTED_BANKS[SUPPORTED_BANKS.length - 1];

  let transactions: ParsedTransaction[];
  switch (bank) {
    case 'nubank':     transactions = parseNubank(lines, year); break;
    case 'itau':       transactions = parseItau(lines, year); break;
    case 'bradesco':   transactions = parseBradesco(lines, year); break;
    case 'santander':  transactions = parseSantander(lines, year); break;
    case 'c6':         transactions = parseC6(lines, year); break;
    case 'inter':      transactions = parseInter(lines, year); break;
    default:           transactions = parseGeneric(lines, year); break;
  }

  // If dedicated parser found nothing, fallback to generic
  if (transactions.length === 0 && bank !== 'generic') {
    transactions = parseGeneric(lines, year);
  }

  return { bank, bankName: bankInfo.name, transactions, rawLineCount: lines.length };
}

// ─── Legacy export (backward compat) ─────────────────────────────────────────
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
