import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../../api/api';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';
import './EscanearBoletas.css';

const EscanearBoletas = ({ userId }) => {
  const [boletaInfo, setBoletaInfo] = useState(null);
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
      const secretKey = 'clave_secreta_porteros_2026'; // Clave secreta para descifrar
      const bytes = CryptoJS.AES.decrypt(decodedText, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) {
        throw new Error('Descifrado fallido');
      }
      const data = JSON.parse(decryptedData);
      fetchBoletaInfo(data.numeroBoleta, data.usuarioId);
    } catch (error) {
      toast.error('QR inválido o no autorizado');
    }
  };

  const onScanFailure = (error) => {
    // ignore
  };

  const fetchBoletaInfo = async (numeroBoleta, usuarioId) => {
    try {
      const solicitudesQuery = query(collection(db, "SOLICITUDES_BOLETAS"), where("usuarioId", "==", usuarioId), where("estado", "==", "APROBADA"));
      const solicitudesSnapshot = await getDocs(solicitudesQuery);

      for (const solicitudDoc of solicitudesSnapshot.docs) {
        const solicitud = solicitudDoc.data();
        const boleteriaRef = doc(db, "BOLETERIA", solicitud.eventoId);
        const boleteriaDoc = await getDoc(boleteriaRef);

        if (boleteriaDoc.exists()) {
          const boleta = boleteriaDoc.data().boletas[solicitudDoc.id];
          if (boleta && boleta.numeroBoleta === numeroBoleta) {
            // Obtener información del evento
            const eventoQuery = query(collection(db, "EVENTOS"), where("__name__", "==", solicitud.eventoId));
            const eventoSnapshot = await getDocs(eventoQuery);
            if (!eventoSnapshot.empty) {
              const evento = eventoSnapshot.docs[0].data();
              setBoletaInfo({ 
                ...boleta, 
                solicitudId: solicitudDoc.id, 
                eventoId: solicitud.eventoId, 
                ingresados: boleta.ingresados || 0, 
                faltantes: boleta.faltantes || boleta.cantidad,
                eventoNombre: evento.nombre,
                eventoFecha: evento.fecha?.toDate ? evento.fecha.toDate().toLocaleDateString('es-ES') : evento.fecha
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
    if (!boletaInfo) return;
    try {
      const boleteriaRef = doc(db, "BOLETERIA", boletaInfo.eventoId);
      await updateDoc(boleteriaRef, {
        [`boletas.${boletaInfo.solicitudId}.estado`]: 'USADA',
        [`boletas.${boletaInfo.solicitudId}.ingresados`]: boletaInfo.cantidad,
        [`boletas.${boletaInfo.solicitudId}.faltantes`]: 0
      });
      toast.success('Todos ingresados');
      setShowModal(false);
      setBoletaInfo(null);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleEntrarParcial = async () => {
    const cantidadInput = document.getElementById('cantidadInput');
    const cantidadIngresar = parseInt(cantidadInput.value);
    if (!boletaInfo || isNaN(cantidadIngresar) || cantidadIngresar <= 0) return;

    const faltantes = boletaInfo.faltantes || boletaInfo.cantidad;
    if (cantidadIngresar > faltantes) {
      toast.error('No puedes ingresar más personas de las que faltan');
      return;
    }

    const nuevosIngresados = (boletaInfo.ingresados || 0) + cantidadIngresar;
    const nuevosFaltantes = boletaInfo.cantidad - nuevosIngresados;
    const nuevoEstado = nuevosFaltantes <= 0 ? 'USADA' : boletaInfo.estado;

    try {
      const boleteriaRef = doc(db, "BOLETERIA", boletaInfo.eventoId);
      await updateDoc(boleteriaRef, {
        [`boletas.${boletaInfo.solicitudId}.estado`]: nuevoEstado,
        [`boletas.${boletaInfo.solicitudId}.ingresados`]: nuevosIngresados,
        [`boletas.${boletaInfo.solicitudId}.faltantes`]: nuevosFaltantes
      });
      toast.success(`${cantidadIngresar} persona(s) ingresada(s)`);
      setShowModal(false);
      setBoletaInfo(null);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  return (
    <div className="escanear-boletas">
      <h3>Escanear Boletas</h3>
      <div id="reader"></div>
      {showModal && boletaInfo && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Información de Boleta</h4>
            <p><strong>Evento:</strong> {boletaInfo.eventoNombre}</p>
            <p><strong>Fecha:</strong> {boletaInfo.eventoFecha}</p>
            <p><strong>Cantidad:</strong> {boletaInfo.cantidad}</p>
            <p><strong>Estado:</strong> {boletaInfo.estado}</p>
            <p><strong>Ingresados:</strong> {boletaInfo.ingresados || 0}</p>
            <p><strong>Faltantes:</strong> {boletaInfo.faltantes || boletaInfo.cantidad}</p>
            {boletaInfo.cantidad === 1 ? (
              <button onClick={handleEntrarTodos}>Marcar como Usada</button>
            ) : (
              <>
                <button onClick={handleEntrarTodos}>Entrar Todos</button>
                <input type="number" min="1" max={boletaInfo.faltantes || boletaInfo.cantidad} placeholder="Cantidad a ingresar" id="cantidadInput" />
                <button onClick={handleEntrarParcial}>Ingresar Parcial</button>
              </>
            )}
            <button onClick={() => setShowModal(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscanearBoletas;