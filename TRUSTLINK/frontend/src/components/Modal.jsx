// Bottom-sheet modal — mirrors the prototype's modal-backdrop / modal pattern.

export default function Modal({ open, onClose, children }) {
  return (
    <div className={`modal-backdrop ${open ? 'show' : ''}`} onClick={(e) => e.target.classList.contains('modal-backdrop') && onClose?.()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grip" />
        {children}
      </div>
    </div>
  );
}
