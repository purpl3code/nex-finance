import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Define the worker URL using Vite's native url resolver
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ParsedTransaction {
  id: string; // generated temporary id
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  installments?: string; // Optional e.g. "1/3"
  originalText: string;
}

const MONTH_MAP: Record<string, number> = {
  'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
  'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
};

export const extractTextFromPdf = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
  const pdfDocument = await loadingTask.promise;
  
  const totalPages = pdfDocument.numPages;
  let allLines: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by their vertical position (y coordinate)
    // to reconstruct lines correctly, as PDF items are absolutely positioned
    const lineMap: Record<number, { text: string; x: number }[]> = {};
    
    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      
      // item.transform is [scaleX, skewY, skewX, scaleY, translateX, translateY]
      // translateY is index 5, translateX is index 4
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      
      if (!lineMap[y]) {
        lineMap[y] = [];
      }
      
      // Ignore empty strings that are just layout gaps sometimes
      if (item.str.trim() !== '') {
         lineMap[y].push({ text: item.str, x });
      }
    }
    
    // Sort by Y descending (PDF coordinates go bottom to top usually)
    const sortedY = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
    
    for (const y of sortedY) {
      // Sort by X ascending (left to right)
      const lineItems = lineMap[y].sort((a, b) => a.x - b.x);
      const fullLineText = lineItems.map(item => item.text).join(' ').trim();
      if (fullLineText) {
        allLines.push(fullLineText);
      }
    }
  }

  return allLines;
};

export const parseNubankTransactions = (lines: string[], currentYear: number): ParsedTransaction[] => {
  const transactions: ParsedTransaction[] = [];
  
  // Regex to match: "DD MMM Description Optional[A/B] Value"
  // Example: "03 FEV Ifood *Ifood 2/3 150,00"
  // Example: "10 JAN Amazon Prime - 14,90" (Refund)
  // Explanation:
  // ^(\d{2})\s+ : 2 digits for day followed by spaces
  // (JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ) : Month abbreviation
  // \s+ : spaces
  // (.*?) : Description (lazy)
  // \s+ : spaces
  // (-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$ : Amount in BRL format at the end
  const nubankRegex = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.*?)\s+(-?\s*\d{1,3}(?:\.\d{3})*,\d{2})$/i;

  for (const line of lines) {
    // Ignore summary lines or payments
    if (line.toLowerCase().includes('pagamento recebido') || 
        line.toLowerCase().includes('fatura') ||
        line.toLowerCase().includes('saldo anterior')) {
      continue;
    }

    const match = line.match(nubankRegex);
    if (match) {
      const day = parseInt(match[1]);
      const monthStr = match[2].toUpperCase();
      const month = MONTH_MAP[monthStr];
      const rawDescription = match[3].trim();
      const rawAmount = match[4].replace(/\s/g, ''); // remove spaces inside amount like "- 14,90"
      
      // Parse amount
      // Remove points used for thousands, replace comma with dot
      let amountNum = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));
      
      // Look for installment pattern like "1/3" or "02/10" inside the description
      const installmentRegex = /[\s-]*(\d{1,2}\/\d{1,2})[\s-]*$/;
      const instMatch = rawDescription.match(installmentRegex);
      
      let description = rawDescription;
      let installments: string | undefined = undefined;
      
      if (instMatch) {
         installments = instMatch[1];
         description = description.replace(installmentRegex, '').trim();
      }

      // Format Date: YYYY-MM-DD
      // Handle year wrap-around logic (e.g. if invoice is in JAN but purchase was DEZ, it was last year)
      // For simplicity, we use currentYear unless it's a huge gap
      let year = currentYear;
      
      const dateObj = new Date(year, month, day);
      const formattedDate = dateObj.toISOString().split('T')[0];

      transactions.push({
        id: Math.random().toString(36).substring(2, 9),
        date: formattedDate,
        description,
        amount: amountNum,
        installments,
        originalText: line
      });
    }
  }

  return transactions;
};
