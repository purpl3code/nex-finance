const fs = require('fs');

let content = fs.readFileSync('components/CreditCardManager.tsx', 'utf8');
content = content.replace(/â€¢/g, '•');
content = content.replace(/â€”/g, '—');
content = content.replace(/Ã€/g, 'À');
content = content.replace(/ðŸ›’/g, '🛒');
fs.writeFileSync('components/CreditCardManager.tsx', content, 'utf8');

// Also check pdfParser
let pdfparser = fs.readFileSync('utils/pdfParser.ts', 'utf8');
pdfparser = pdfparser.replace(/â€”/g, '—');
pdfparser = pdfparser.replace(/â€¢/g, '•');
fs.writeFileSync('utils/pdfParser.ts', pdfparser, 'utf8');

console.log('Fixed mojibake literally');
