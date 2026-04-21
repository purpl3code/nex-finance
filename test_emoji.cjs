const fs = require('fs');
const emojis = ['🍕', '🛒', '🏠', '🚗', '🏥', '🎓', '🎮', '👗', '✈️', '🐶', '📱', '💡', '💰', '💳'];

emojis.forEach(e => {
  let arr = Array.from(e);
  let hexes = [];
  for(let char of arr) {
    hexes.push(char.codePointAt(0).toString(16));
  }
  
  // filter fe0f
  const filtered = hexes.filter(h => h !== 'fe0f').join('-');
  console.log(e, '->', filtered);
});
