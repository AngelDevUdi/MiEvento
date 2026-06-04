import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../../api/api';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';
import './EscanearBoletas.css';

// ✅ Caché en memoria (se limpia al recargar la página)
const scanCache = new Map();

const EscanearBoletas = ({ userId }) => {
  const [itemInfo, setItemInfo] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanQuality, setScanQuality] = useState(0);
  const scanAttemptsRef = useRef([]);
  const lastToastRef = useRef({});
  const scannerRef = useRef(null);
  const processingRef = useRef(false); // ✅ ref para evitar doble procesamiento sin lag de estado

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;
    return () => { scanner.clear().catch(console.error); };
  }, []);

  const onScanSuccess = (decodedText) => {
    pushScanAttempt(true);
    if (processingRef.current) return; // ✅ usar ref evita stale closure
    processingRef.current = true;
    setProcessing(true); // spinner inmediato

    (async () => {
      try {
        const secretKey = 'clave_secreta_porteros_2026';
        const bytes = CryptoJS.AES.decrypt(decodedText, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedData) throw new Error('Descifrado fallido');
        const data = JSON.parse(decryptedData);

        if (data.boletaId && data.eventoId) {
          const found = await fetchBoletaInfo(data.boletaId, data.usuarioId, data.eventoId, data.numeroBoleta);
          if (!found) showToast('error', 'Boleta no encontrada');
        } else if (data.reservaId) {
          const found = await fetchReservaInfo(data.reservaId, data.usuarioId);
          if (!found) showToast('error', 'Reserva no encontrada');
        } else {
          throw new Error('Tipo de código inválido');
        }
      } catch {
        showToast('error', 'QR inválido o no autorizado');
      } finally {
        // ✅ Si no se mostró modal, liberar el lock
        if (!showModal) resetProcessing();
      }
    })();
  };

  const resetProcessing = () => {
    processingRef.current = false;
    setProcessing(false);
  };

  const onScanFailure = () => { pushScanAttempt(false); };

  const pushScanAttempt = (success) => {
    const arr = scanAttemptsRef.current;
    arr.push(success ? 1 : 0);
    if (arr.length > 20) arr.shift();
    const quality = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100);
    setScanQuality(quality);
  };

  const showToast = (type, message) => {
    const now = Date.now();
    if (now - (lastToastRef.current[message] || 0) < 3000) return;
    lastToastRef.current[message] = now;
    toast[type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'](message);
  };

  // ✅ Consultas en paralelo con caché
  const fetchBoletaInfo = async (solicitudId, usuarioId, eventoId, numeroBoleta) => {
    const cacheKey = `boleta_${solicitudId}`;
    
    try {
      // ✅ Lanzar las 3 consultas en paralelo
      const [solicitudDoc, boleteriaDoc] = await Promise.all([
        scanCache.has(`sol_${solicitudId}`)
          ? { exists: () => true, data: () => scanCache.get(`sol_${solicitudId}`) }
          : getDoc(doc(db, "SOLICITUDES_BOLETAS", solicitudId)),
        scanCache.has(`bol_${eventoId}`)
          ? { exists: () => true, data: () => scanCache.get(`bol_${eventoId}`) }
          : getDoc(doc(db, "BOLETERIA", eventoId)),
      ]);

      if (!solicitudDoc.exists()) return false;
      const solicitud = solicitudDoc.data();
      scanCache.set(`sol_${solicitudId}`, solicitud); // guardar en caché

      if (solicitud.usuarioId !== usuarioId || solicitud.estado !== 'ACTIVADA' || solicitud.eventoId !== eventoId) return false;

      if (!boleteriaDoc.exists()) return false;
      const bolerias = boleteriaDoc.data();
      scanCache.set(`bol_${eventoId}`, bolerias);

      const boleta = bolerias.boletas?.[solicitudId];
      if (!boleta || boleta.numeroBoleta !== numeroBoleta || boleta.estado !== 'ACTIVA') return false;

      // ✅ Consulta de evento: solo si no está en caché
      let evento;
      if (scanCache.has(`evt_${eventoId}`)) {
        evento = scanCache.get(`evt_${eventoId}`);
      } else {
        const eventoDoc = await getDoc(doc(db, "EVENTOS", eventoId));
        if (!eventoDoc.exists()) return false;
        evento = eventoDoc.data();
        scanCache.set(`evt_${eventoId}`, evento);
      }

      setItemType('boleta');
      setItemInfo({
        ...boleta,
        solicitudId,
        eventoId,
        usuarioId,
        ingresados: boleta.ingresados || 0,
        faltantes: boleta.faltantes ?? boleta.cantidad,
        eventoNombre: evento.nombre,
        eventoFecha: evento.fecha?.toDate ? evento.fecha.toDate().toLocaleDateString('es-ES') : evento.fecha,
        tipo: 'boleta'
      });
      setShowModal(true);
      processingRef.current = false; // no resetear spinner, modal está abierto
      setProcessing(false);
      return true;
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al buscar boleta');
      return false;
    }
  };

  const fetchReservaInfo = async (reservaId, usuarioId) => {
    try {
      let reserva;
      if (scanCache.has(`res_${reservaId}`)) {
        reserva = scanCache.get(`res_${reservaId}`);
      } else {
        const reservaDoc = await getDoc(doc(db, "RESERVAS", reservaId));
        if (!reservaDoc.exists()) return false;
        reserva = reservaDoc.data();
        scanCache.set(`res_${reservaId}`, reserva);
      }

      if (reserva.estado !== 'ACTIVADA' && reserva.estado !== 'CONFIRMADA') {
        showToast('error', 'Esta reserva no está disponible');
        return false;
      }

      setItemType('reserva');
      setItemInfo({ ...reserva, id: reservaId, usuarioId, tipo: 'reserva' });
      setShowModal(true);
      processingRef.current = false;
      setProcessing(false);
      return true;
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al buscar reserva');
      return false;
    }
  };

  const handleEntrarTodos = async () => {
    if (!itemInfo || itemType !== 'boleta') return;
    try {
      await updateDoc(doc(db, "BOLETERIA", itemInfo.eventoId), {
        [`boletas.${itemInfo.solicitudId}.estado`]: 'USADA',
        [`boletas.${itemInfo.solicitudId}.ingresados`]: itemInfo.cantidad,
        [`boletas.${itemInfo.solicitudId}.faltantes`]: 0,
        [`boletas.${itemInfo.solicitudId}.updatedAt`]: new Date()
      });
      // ✅ Invalidar caché del evento para que el próximo escaneo sea fresco
      scanCache.delete(`bol_${itemInfo.eventoId}`);
      showToast('success', 'Todos ingresados');
      closeModal();
    } catch { showToast('error', 'Error al actualizar'); }
  };

  const handleEntrarParcial = async () => {
    if (itemType !== 'boleta') return;
    const cantidadIngresar = parseInt(document.getElementById('cantidadInput').value);
    if (!itemInfo || isNaN(cantidadIngresar) || cantidadIngresar <= 0) return;

    const faltantes = itemInfo.faltantes || itemInfo.cantidad;
    if (cantidadIngresar > faltantes) {
      showToast('error', 'No puedes ingresar más personas de las que faltan');
      return;
    }

    const nuevosIngresados = (itemInfo.ingresados || 0) + cantidadIngresar;
    const nuevosFaltantes = itemInfo.cantidad - nuevosIngresados;

    try {
      await updateDoc(doc(db, "BOLETERIA", itemInfo.eventoId), {
        [`boletas.${itemInfo.solicitudId}.estado`]: nuevosFaltantes <= 0 ? 'USADA' : itemInfo.estado,
        [`boletas.${itemInfo.solicitudId}.ingresados`]: nuevosIngresados,
        [`boletas.${itemInfo.solicitudId}.faltantes`]: nuevosFaltantes,
        [`boletas.${itemInfo.solicitudId}.updatedAt`]: new Date()
      });
      scanCache.delete(`bol_${itemInfo.eventoId}`);
      showToast('success', `${cantidadIngresar} persona(s) ingresada(s)`);
      closeModal();
    } catch { showToast('error', 'Error al actualizar'); }
  };

  const handleConfirmarReserva = async () => {
    if (!itemInfo || itemType !== 'reserva') return;
    try {
      await updateDoc(doc(db, "RESERVAS", itemInfo.id), {
        estado: 'USADA',
        updatedAt: new Date()
      });
      scanCache.delete(`res_${itemInfo.id}`); // ✅ invalidar caché
      showToast('success', 'Reserva confirmada y marcada como usada');
      closeModal();
    } catch { showToast('error', 'Error al confirmar reserva'); }
  };

  const closeModal = () => {
    setShowModal(false);
    setItemInfo(null);
    setItemType(null);
    processingRef.current = false;
    setProcessing(false);
  };

  return (
    <div className="escanear-boletas">
      <h3>Escanear Boletas y Reservas</h3>
      <div id="reader">
        <div className="reader-quality-container">
          <div className="reader-quality-bar" style={{ width: `${scanQuality}%` }} />
          <div className="reader-quality-text">{scanQuality}%</div>
        </div>
        {processing && (
          <div className="reader-loading-overlay">
            <div className="reader-spinner" />
          </div>
        )}
      </div>

      {showModal && itemInfo && (
        <div className="modal-overlay">
          <div className="modal">
            {itemType === 'boleta' ? (
              <>
                <h4>Información de Boleta</h4>
                <p><strong>Evento:</strong> {itemInfo.eventoNombre}</p>
                <p><strong>Fecha:</strong> {itemInfo.eventoFecha}</p>
                <p><strong>Cantidad:</strong> {itemInfo.cantidad}</p>
                <p><strong>Estado:</strong> {itemInfo.estado}</p>
                <p><strong>Ingresados:</strong> {itemInfo.ingresados || 0}</p>
                <p><strong>Faltantes:</strong> {itemInfo.faltantes || itemInfo.cantidad}</p>
                {itemInfo.cantidad === 1 ? (
                  <button onClick={handleEntrarTodos}>Marcar como Usada</button>
                ) : (
                  <>
                    <button onClick={handleEntrarTodos}>Entrar Todos</button>
                    <input type="number" min="1" max={itemInfo.faltantes || itemInfo.cantidad} placeholder="Cantidad a ingresar" id="cantidadInput" />
                    <button onClick={handleEntrarParcial}>Ingresar Parcial</button>
                  </>
                )}
              </>
            ) : (
              <>
                <h4>Información de Reserva</h4>
                <p><strong>Lugar:</strong> {itemInfo.lugarNombre}</p>
                <p><strong>Fecha Evento:</strong> {itemInfo.diaReserva}</p>
                <p><strong>Total:</strong> ${itemInfo.total?.toLocaleString('es-ES') || '0'}</p>
                <p><strong>Método de Pago:</strong> {itemInfo.metodoPago}</p>
                <p><strong>Estado:</strong> {itemInfo.estado}</p>
                <button onClick={handleConfirmarReserva}>Confirmar Reserva</button>
              </>
            )}
            <button onClick={closeModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscanearBoletas;