import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../../api/api';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';
import './EscanearBoletas.css';

const EscanearBoletas = ({ userId }) => {
  const [itemInfo, setItemInfo] = useState(null);
  const [itemType, setItemType] = useState(null); // 'boleta' o 'reserva'
  const [showModal, setShowModal] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const onScanSuccess = (decodedText) => {
    try {
      const secretKey = 'clave_secreta_porteros_2026';
      const bytes = CryptoJS.AES.decrypt(decodedText, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) {
        throw new Error('Descifrado fallido');
      }
      const data = JSON.parse(decryptedData);
      
      // Identificar si es boleta o reserva
      if (data.boletaId && data.eventoId) {
        // Es una boleta
        setItemType('boleta');
        fetchBoletaInfo(data.numeroBoleta, data.usuarioId);
      } else if (data.reservaId) {
        // Es una reserva
        setItemType('reserva');
        fetchReservaInfo(data.reservaId, data.usuarioId);
      } else {
        throw new Error('Tipo de código inválido');
      }
    } catch (error) {
      toast.error('QR inválido o no autorizado');
    }
  };

  const onScanFailure = (error) => {
    // ignore
  };

  const fetchReservaInfo = async (reservaId, usuarioId) => {
    try {
      const reservaRef = doc(db, "RESERVAS", reservaId);
      const reservaDoc = await getDoc(reservaRef);

      if (!reservaDoc.exists()) {
        toast.error('Reserva no encontrada');
        return;
      }

      const reserva = reservaDoc.data();
      
      // Verificar que la reserva esté activa o confirmada
      if (reserva.estado !== 'ACTIVADA' && reserva.estado !== 'CONFIRMADA') {
        toast.error('Esta reserva no está disponible');
        return;
      }

      setItemInfo({
        ...reserva,
        id: reservaId,
        usuarioId: usuarioId,
        tipo: 'reserva'
      });
      setShowModal(true);
    } catch (error) {
      console.error(error);
      toast.error('Error al buscar reserva');
    }
  };

  const fetchBoletaInfo = async (numeroBoleta, usuarioId) => {
    try {
      const solicitudesQuery = query(collection(db, "SOLICITUDES_BOLETAS"), where("usuarioId", "==", usuarioId), where("estado", "==", "ACTIVADA"));
      const solicitudesSnapshot = await getDocs(solicitudesQuery);

      for (const solicitudDoc of solicitudesSnapshot.docs) {
        const solicitud = solicitudDoc.data();
        const boleteriaRef = doc(db, "BOLETERIA", solicitud.eventoId);
        const boleteriaDoc = await getDoc(boleteriaRef);

        if (boleteriaDoc.exists()) {
          const boleterias = boleteriaDoc.data().boletas;
          const boleta = boleterias?.[solicitudDoc.id];
          if (boleta && boleta.numeroBoleta === numeroBoleta && boleta.estado === 'ACTIVA') {
            // Obtener información del evento
            const eventoRef = doc(db, "EVENTOS", solicitud.eventoId);
            const eventoDoc = await getDoc(eventoRef);
            if (eventoDoc.exists()) {
              const evento = eventoDoc.data();
              setItemInfo({ 
                ...boleta, 
                solicitudId: solicitudDoc.id, 
                eventoId: solicitud.eventoId, 
                usuarioId: usuarioId,
                ingresados: boleta.ingresados || 0, 
                faltantes: boleta.faltantes !== undefined ? boleta.faltantes : boleta.cantidad,
                eventoNombre: evento.nombre,
                eventoFecha: evento.fecha?.toDate ? evento.fecha.toDate().toLocaleDateString('es-ES') : evento.fecha,
                tipo: 'boleta'
              });
              setShowModal(true);
              return;
            }
          }
        }
      }
      toast.error('Boleta no encontrada');
    } catch (error) {
      console.error(error);
      toast.error('Error al buscar boleta');
    }
  };

  const handleEntrarTodos = async () => {
    if (!itemInfo || itemType !== 'boleta') return;
    try {
      const boleteriaRef = doc(db, "BOLETERIA", itemInfo.eventoId);
      await updateDoc(boleteriaRef, {
        [`boletas.${itemInfo.solicitudId}.estado`]: 'USADA',
        [`boletas.${itemInfo.solicitudId}.ingresados`]: itemInfo.cantidad,
        [`boletas.${itemInfo.solicitudId}.faltantes`]: 0,
        [`boletas.${itemInfo.solicitudId}.updatedAt`]: new Date()
      });
      toast.success('Todos ingresados');
      setShowModal(false);
      setItemInfo(null);
      setItemType(null);
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar');
    }
  };

  const handleEntrarParcial = async () => {
    if (itemType !== 'boleta') return;
    const cantidadInput = document.getElementById('cantidadInput');
    const cantidadIngresar = parseInt(cantidadInput.value);
    if (!itemInfo || isNaN(cantidadIngresar) || cantidadIngresar <= 0) return;

    const faltantes = itemInfo.faltantes || itemInfo.cantidad;
    if (cantidadIngresar > faltantes) {
      toast.error('No puedes ingresar más personas de las que faltan');
      return;
    }

    const nuevosIngresados = (itemInfo.ingresados || 0) + cantidadIngresar;
    const nuevosFaltantes = itemInfo.cantidad - nuevosIngresados;
    const nuevoEstado = nuevosFaltantes <= 0 ? 'USADA' : itemInfo.estado;

    try {
      const boleteriaRef = doc(db, "BOLETERIA", itemInfo.eventoId);
      await updateDoc(boleteriaRef, {
        [`boletas.${itemInfo.solicitudId}.estado`]: nuevoEstado,
        [`boletas.${itemInfo.solicitudId}.ingresados`]: nuevosIngresados,
        [`boletas.${itemInfo.solicitudId}.faltantes`]: nuevosFaltantes,
        [`boletas.${itemInfo.solicitudId}.updatedAt`]: new Date()
      });
      toast.success(`${cantidadIngresar} persona(s) ingresada(s)`);
      setShowModal(false);
      setItemInfo(null);
      setItemType(null);
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar');
    }
  };

  const handleConfirmarReserva = async () => {
    if (!itemInfo || itemType !== 'reserva') return;
    try {
      const reservaRef = doc(db, "RESERVAS", itemInfo.id);
      await updateDoc(reservaRef, {
        estado: 'USADA',
        updatedAt: new Date()
      });
      toast.success('Reserva confirmada y marcada como usada');
      setShowModal(false);
      setItemInfo(null);
      setItemType(null);
    } catch (error) {
      console.error(error);
      toast.error('Error al confirmar reserva');
    }
  };

  return (
    <div className="escanear-boletas">
      <h3>Escanear Boletas y Reservas</h3>
      <div id="reader"></div>
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
            <button onClick={() => {
              setShowModal(false);
              setItemInfo(null);
              setItemType(null);
            }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscanearBoletas;