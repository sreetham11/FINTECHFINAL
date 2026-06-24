const fs = require('fs');
let code = fs.readFileSync('src/components/MomentCard.tsx', 'utf8');

code = code.replace(
  'const shadowColor = shadowColors[index % shadowColors.length];',
  `const shadowColor = shadowColors[index % shadowColors.length];\n  let cardClass = "";\n  if (variant === "red" || shadowColor === '#C0001F') cardClass = "card-red";\n  else if (shadowColor === '#0033A0') cardClass = "card-blue";\n  else if (shadowColor === '#1A1A1A') cardClass = "card-dark";`
);

code = code.replace(
  'className={`moment-card ${variant === "red" || shadowColor === \'#C0001F\' ? "card-red" : ""} animate-slide-up stagger-${Math.min(index + 1, 8)}`}',
  'className={`moment-card ${cardClass} animate-slide-up stagger-${Math.min(index + 1, 8)}`}'
);

fs.writeFileSync('src/components/MomentCard.tsx', code);
console.log('MomentCard updated');
