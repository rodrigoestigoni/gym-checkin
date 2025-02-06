import React from "react";
import ReactDOM from "react-dom";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay com opacidade ajustada para dark */}
      <div 
        className="fixed inset-0 bg-black opacity-50 dark:opacity-70" 
        onClick={onClose} 
      />
      {/* Conteúdo do Modal */}
      <div className="relative z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full p-6 text-gray-900 dark:text-gray-100">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-700 dark:text-gray-300 text-2xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default Modal;
