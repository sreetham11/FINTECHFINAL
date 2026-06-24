const fs = require('fs');
const file = 'src/components/MomentCard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add variant to props
code = code.replace(
  'interface MomentCardProps {',
  'interface MomentCardProps {\n  variant?: "default" | "red";'
);

// Destructure variant
code = code.replace(
  'export default function MomentCard({ transaction, index, showRotation = true }: MomentCardProps) {',
  'export default function MomentCard({ transaction, index, showRotation = true, variant = "default" }: MomentCardProps) {'
);

// Add class
code = code.replace(
  'className={`moment-card animate-slide-up stagger-${Math.min(index + 1, 8)}`}',
  'className={`moment-card ${variant === "red" ? "moment-card-red" : ""} animate-slide-up stagger-${Math.min(index + 1, 8)}`}'
);

// Add class to timestamp
code = code.replace(
  '<span className="text-mono" style={{ color: \'#999\' }}>',
  '<span className="text-mono moment-timestamp" style={{ color: \'#999\' }}>'
);

// Add class to friend avatar badge
code = code.replace(
  'style={{\n                  width: \'14px\',',
  'className="friend-avatar-badge"\n                style={{\n                  width: \'14px\','
);

fs.writeFileSync(file, code);
console.log("Patched MomentCard.tsx");
