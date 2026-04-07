import React from 'react';
import QRCode from 'react-qr-code';
import CryptoJS from 'crypto-js';
import './boleta.css';

const BoletaModal = ({ isOpen, onClose, boleta, usuarioId }) => {
  if (!isOpen || !boleta) return null;

  const secretKey = 'clave_secreta_porteros_2026'; // Clave secreta para cifrar
  const qrPayload = {
    numeroBoleta: boleta.numeroBoleta,
    usuarioId,
    eventoId: boleta.eventoId,
    boletaId: boleta.id,
  };
  const qrData = CryptoJS.AES.encrypt(JSON.stringify(qrPayload), secretKey).toString();

  return (
    <div className="boleta-modal-overlay" onClick={onClose}>
      <div className="boleta-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="boleta-modal-header">
          <h3>{boleta.eventoNombre || 'Boleta'}</h3>
          <p className="boleta-modal-subtitle">No. de boleta: {boleta.numeroBoleta}</p>
        </div>
        <div className="boleta-details">
          <p><strong>Fecha:</strong> {boleta.eventoFecha} {boleta.eventoHora}</p>
          <p><strong>Lugar:</strong> {boleta.lugarNombre}</p>
          <p><strong>Cantidad:</strong> {boleta.cantidad} {boleta.cantidad === 1 ? 'persona' : 'personas'}</p>
          <p><strong>Total:</strong> ${boleta.precioTotal?.toLocaleString() || '0'}</p>
          <p><strong>Estado:</strong> {boleta.estado}</p>
        </div>
        <div className="boleta-qrcode">
          <QRCode value={qrData} />
          <p className="qr-text">Muestra este código QR al portero para validar tu entrada</p>
        </div>
      </div>
    </div>
  );
};

export default BoletaModal;