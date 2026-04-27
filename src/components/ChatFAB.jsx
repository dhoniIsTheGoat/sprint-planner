export default function ChatFAB({ onClick, isOpen, hasUnread }) {
  return (
    <button
      onClick={onClick}
      title={isOpen ? 'Close Sprint Assistant' : 'Open Sprint Assistant'}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: isOpen ? '#475569' : '#6366f1',
        border: 'none',
        cursor: 'pointer',
        fontSize: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
        zIndex: 1000,
        transition: 'background 0.2s, transform 0.15s',
        transform: isOpen ? 'rotate(45deg)' : 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.08)' : 'scale(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = isOpen ? 'rotate(45deg)' : 'none'; }}
    >
      {isOpen ? '✕' : '💬'}
      {hasUnread && !isOpen && (
        <span style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#ef4444',
          border: '2px solid white',
        }} />
      )}
    </button>
  );
}
