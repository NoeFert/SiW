import {
  Item, ItemActions, ItemContent, ItemDescription,
} from '@/components/ui/8bit/item.jsx';

export default function SpeechBubble({ children, action = null, className = '' }) {
  return (
    <Item className={`pixel-speech pointer-events-auto max-w-2xl rounded-none text-white ${className}`}>
      <ItemContent>
        <ItemDescription className="line-clamp-none whitespace-pre-line text-xs leading-relaxed text-white">
          {children}
        </ItemDescription>
      </ItemContent>
      {action && <ItemActions>{action}</ItemActions>}
    </Item>
  );
}
