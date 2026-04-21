const fs = require('fs');

function replaceInFile(file, replaces) {
  let content = fs.readFileSync(file, 'utf8');
  const initial = content;
  
  if (!content.includes('AppleEmoji') && (file.includes('tsx') || file.includes('ts'))) {
    // Add import after first import
    content = content.replace(/^import .*?;$/m, match => match + '\nimport { AppleEmoji } from \'./ui/AppleEmoji\';');
  }

  for (const [from, to] of replaces) {
    // Escape and create regex if needed, wait, basic split/join is safer for strings
    content = content.split(from).join(to);
  }

  if (content !== initial) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}

replaceInFile('./components/BudgetManager.tsx', [
  ['<span>{s.category.emoji} {s.category.name}</span>', '<span><AppleEmoji emoji={s.category.emoji} /> {s.category.name}</span>'],
  ['<div className="text-3xl bg-white/5 p-2 rounded-xl border border-white/5">{category?.emoji}</div>', '<div className="text-3xl bg-white/5 p-2 rounded-xl border border-white/5"><AppleEmoji className="text-3xl" emoji={category?.emoji} /></div>'],
  ['label: `${c.emoji} ${c.name}`', 'label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span>']
]);

replaceInFile('./components/CategoryManager.tsx', [
  ['{cat.emoji}', '<AppleEmoji emoji={cat.emoji} />'],
  ['label: `${c.emoji} ${c.name}`', 'label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span>']
]);

replaceInFile('./components/CreditCardManager.tsx', [
  ["{isRefund ? <RotateCcw size={20}/> : (categories.find(c => c.id === tx.categoryId)?.emoji || '🛒')}", "{isRefund ? <RotateCcw size={20}/> : <AppleEmoji emoji={categories.find(c => c.id === tx.categoryId)?.emoji || '🛒'} />}"],
  ['label: `${c.emoji} ${c.name}`', 'label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span>']
]);

replaceInFile('./components/DashboardWidgets.tsx', [
  ["{item.category?.emoji || (item.isCard ? '💳' : '💰')}", "<AppleEmoji emoji={item.category?.emoji || (item.isCard ? '💳' : '💰')} />"]
]);

replaceInFile('./components/RecurringManager.tsx', [
  ['label: `${c.emoji} ${c.name}`', 'label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span>']
]);

replaceInFile('./components/ReportView.tsx', [
  ["name: cat ? `${cat.emoji} ${cat.name}` : 'Outros',", "name: cat ? <span className=\"flex items-center gap-1.5\"><AppleEmoji emoji={cat.emoji}/> {cat.name}</span> : 'Outros',"]
]);

replaceInFile('./components/TransactionForm.tsx', [
  ['label: `${cat.emoji} ${cat.name} ${cat.isArchived ? \'(Arquivada)\' : \'\'}`', 'label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={cat.emoji}/> {cat.name} {cat.isArchived ? \'(Arquivada)\' : \'\'}</span>']
]);

replaceInFile('./components/TransactionList.tsx', [
  ['<span>{getCategory(item.categoryId)?.emoji}</span>', '<span><AppleEmoji emoji={getCategory(item.categoryId)?.emoji} /></span>'],
  ["{isTransfer ? '🔄' : category?.emoji}", "<AppleEmoji emoji={isTransfer ? '🔄' : category?.emoji} />"]
]);
