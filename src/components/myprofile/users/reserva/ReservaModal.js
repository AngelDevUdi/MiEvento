import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import CryptoJS from 'crypto-js';
import { db } from '../../../../api/api';
import { doc, onSnapshot } from 'firebase/firestore';
import '../reserva/reserva.css';

const ReservaModal = ({ isOpen, onClose, reserva, usuarioId }) => {
  const [reservaData, setReservaData] = useState(reserva);

  useEffect(() => {
    setReservaData(reserva);
  }, [reserva]);

  useEffect(() => {
    if (!isOpen || !reserva || !reserva.id) {
      return;
    }

    let unsubscribe;
    const reservasRef = doc(db, "RESERVAS", reserva.id);

    // Usar onSnapshot para monitorear cambios en tiempo real
    unsubscribe = onSnapshot(
      reservasRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedReserva = docSnapshot.data();
          setReservaData(prevData => ({
            ...prevData,
            ...updatedReserva,
            estado: updatedReserva.estado
          }));
        }
      },
      (error) => {
        console.error("Error loading reserva data:", error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, reserva?.id]);

  if (!isOpen || !reservaData) return null;

  const secretKey = 'clave_secreta_porteros_2026'; // Clave secreta para cifrar
  const qrPayload = {
    numeroReserva: reservaData.id,
    usuarioId,
    reservaId: reservaData.id,
  };
  const qrData = CryptoJS.AES.encrypt(JSON.stringify(qrPayload), secretKey).toString();

  return (
    <div className="reserva-modal-overlay" onClick={onClose}>
      <div className="reserva-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="reserva-modal-header">
          <h3>{reservaData.lugarNombre || 'Reservación'}</h3>
        </div>
        <div className="reserva-details">
          <p><strong>Fecha de Evento:</strong> {reservaData.diaReserva}</p>
          <p><strong>Fecha de Reservación:</strong> {new Date(reservaData.fechaReserva?.toDate?.() || reservaData.fechaReserva).toLocaleDateString('es-ES')}</p>
          <p><strong>Total:</strong> ${reservaData.total?.toLocaleString('es-ES') || '0'}</p>
          <p><strong>Método de Pago:</strong> {reservaData.metodoPago || 'No especificado'}</p>
          <p><strong>Estado:</strong> {reservaData.estado}</p>
        </div>
        <div className="reserva-qrcode">
          <div className="qr-container">
            <QRCode value={qrData} />
            {reservaData.estado !== 'CONFIRMADA' && reservaData.estado !== 'ACTIVADA' && (
              <div className="qr-overlay">
                <span className="qr-x">✕</span>
              </div>
            )}
          </div>
          <p className="qr-text">Muestra este código QR al portero para confirmar tu llegada</p>
        </div>
      </div>
    </div>
  );
};

export default ReservaModal;
