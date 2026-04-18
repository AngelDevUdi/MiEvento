import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import CryptoJS from 'crypto-js';
import { db } from '../../../../api/api';
import { doc, getDoc } from 'firebase/firestore';
import './boleta.css';

const BoletaModal = ({ isOpen, onClose, boleta, usuarioId }) => {
  const [boletaData, setBoletaData] = useState(boleta);

  useEffect(() => {
    setBoletaData(boleta);
  }, [boleta]);

  useEffect(() => {
    if (!isOpen || !boleta || !boleta.eventoId || !boleta.id) {
      return;
    }

    let active = true;
    const boleteriaRef = doc(db, "BOLETERIA", boleta.eventoId);

    const fetchBoleteria = async () => {
      try {
        const docSnapshot = await getDoc(boleteriaRef);
        if (!active || !docSnapshot.exists()) return;

        const boleteriaData = docSnapshot.data();
        const updatedBoleta = boleteriaData.boletas?.[boleta.id];
        if (updatedBoleta) {
          setBoletaData(prevData => ({
            ...prevData,
            ...updatedBoleta,
            estado: updatedBoleta.estado,
            ingresados: updatedBoleta.ingresados || 0,
            faltantes: updatedBoleta.faltantes !== undefined ? updatedBoleta.faltantes : prevData.cantidad
          }));
        }
      } catch (error) {
        console.error("Error loading boleta data:", error);
      }
    };

    fetchBoleteria();

    return () => {
      active = false;
    };
  }, [isOpen, boleta?.eventoId, boleta?.id]);

  if (!isOpen || !boletaData) return null;

  const secretKey = 'clave_secreta_porteros_2026'; // Clave secreta para cifrar
  const qrPayload = {
    numeroBoleta: boletaData.numeroBoleta,
    usuarioId,
    eventoId: boletaData.eventoId,
    boletaId: boletaData.id,
  };
  const qrData = CryptoJS.AES.encrypt(JSON.stringify(qrPayload), secretKey).toString();

  return (
    <div className="boleta-modal-overlay" onClick={onClose}>
      <div className="boleta-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="boleta-modal-header">
          <h3>{boletaData.eventoNombre || 'Boleta'}</h3>
        </div>
        <div className="boleta-details">
          <p><strong>Fecha:</strong> {boletaData.eventoFecha} {boletaData.eventoHora}</p>
          <p><strong>Lugar:</strong> {boletaData.lugarNombre}</p>
          <p><strong>Cantidad:</strong> {boletaData.cantidad} {boletaData.cantidad === 1 ? 'persona' : 'personas'}</p>
          {boletaData.ingresados !== undefined && boletaData.ingresados > 0 && (
            <p><strong>Ingresados:</strong> {boletaData.ingresados}</p>
          )}
          {boletaData.faltantes !== undefined && boletaData.faltantes < boletaData.cantidad && (
            <p><strong>Faltan por entrar:</strong> {boletaData.faltantes}</p>
          )}
          <p><strong>Total:</strong> ${boletaData.precioTotal?.toLocaleString() || '0'}</p>
          <p><strong>Estado:</strong> {boletaData.estado}</p>
        </div>
        <div className="boleta-qrcode">
          <div className="qr-container">
            <QRCode value={qrData} />
            {boletaData.estado !== 'ACTIVA' && (
              <div className="qr-overlay">
                <span className="qr-x">✕</span>
              </div>
            )}
          </div>
          <p className="qr-text">Muestra este código QR al portero para validar tu entrada</p>
        </div>
      </div>
    </div>
  );
};

export default BoletaModal;