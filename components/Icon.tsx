import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = '' }) => {
  if (!name) return null;

  // 1. Handle Emojis (legacy data support)
  // If the name contains non-ASCII characters, assume it's an emoji string
  if (/[^\u0000-\u007F]+/.test(name)) {
    return <span className={className} style={{ fontSize: size, lineHeight: 1 }}>{name}</span>;
  }

  try {
    // 2. Handle Lucide Icons
    // Convert kebab-case (e.g. "pie-chart") to PascalCase (e.g. "PieChart")
    const iconName = name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    // @ts-ignore - Dynamic access to Lucide icons
    const LucideIcon = LucideIcons[iconName] || LucideIcons[name];

    if (LucideIcon) {
        return <LucideIcon size={size} className={className} />;
    }
  } catch (e) {
      console.warn('Failed to render icon:', name, e);
  }

  // 3. Fallback
  return <span className={`text-xs text-gray-400 font-mono ${className}`} title={name}>{name?.substring(0, 2).toUpperCase()}</span>;
};

export default Icon;