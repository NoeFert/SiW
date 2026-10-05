// GRAPHICS.md « Interface » : flèche cliquable sans cadre de bouton (« Retour » des écrans,
// navigation de la page de détail). `direction` : 'left' ou 'right' ; `label` : texte lu par les
// lecteurs d'écran. Désactivée, elle est atténuée et non cliquable.
export default function ArrowButton({
  direction, label, onClick, disabled = false, className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`retro text-2xl leading-none text-white enabled:cursor-pointer enabled:hover:text-white/70 disabled:opacity-30 ${className}`}
    >
      {direction === 'left' ? '◀' : '▶'}
    </button>
  );
}
