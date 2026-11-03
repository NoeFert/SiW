// `direction` : 'left' ou 'right'.
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
