import {
  Item, ItemActions, ItemContent, ItemDescription,
} from '@/components/ui/8bit/item.jsx';

// Bulle de message (composant Item 8bitcn, dans la bulle blanche du pack, pixel-speech) des
// tutoriels (technical.md 5.5) et des dialogues des souverains (SovereignDialogue) ; `action` :
// bouton éventuel à droite du texte.
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
