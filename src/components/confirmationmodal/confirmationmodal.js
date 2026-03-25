import React from "react";
import "./confirmationmodal.css";

const ConfirmationModal = ({
  isOpen,
  title = "Confirmación",
  message = "¿Estás seguro?",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-buttons">
          <button className="btn btn-yes" onClick={onConfirm}>
            Confirmar
          </button>
          <button className="btn btn-no" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;