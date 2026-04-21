const fs = require('fs');

const files = [
  './components/BudgetManager.tsx',
  './components/CategoryManager.tsx',
  './components/CreditCardManager.tsx',
  './components/DashboardWidgets.tsx',
  './components/RecurringManager.tsx',
  './components/ReportView.tsx',
  './components/TransactionForm.tsx',
  './components/TransactionList.tsx'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if(!c.includes('import { AppleEmoji }')) {
    // Insert after import React
    c = c.replace(/import React.*?;\r?\n/, match => match + "import { AppleEmoji } from './ui/AppleEmoji';\n");
    fs.writeFileSync(f, c);
    console.log('Added import to', f);
  }
});

let glass = fs.readFileSync('./components/ui/GlassSelect.tsx', 'utf8');
glass = glass.replace('let selectedLabel = placeholder;', 'let selectedLabel: React.ReactNode = placeholder;');
fs.writeFileSync('./components/ui/GlassSelect.tsx', glass);
console.log('Fixed GlassSelect.tsx');
