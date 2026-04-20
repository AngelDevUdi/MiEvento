import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import EventLoading from "../../../loading/EventLoading";
import { db } from "../../../../api/api";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./solicitudesboletas.css";

const SolicitudesBoletas = ({ userId, onClose }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      // Obtener eventos del organizador
      const eventosQuery = query(collection(db, "EVENTOS"), where("organizadorId", "==", userId));
      const eventosSnapshot = await getDocs(eventosQuery);
      const eventosIds = eventosSnapshot.docs.map(doc => doc.id);

      if (eventosIds.length === 0) {
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      // Obtener solicitudes de boletas para esos eventos
      const solicitudesQuery = query(collection(db, "SOLICITUDES_BOLETAS"), where("eventoId", "in", eventosIds));
      const solicitudesSnapshot = await getDocs(solicitudesQuery);
      const solicitudesData = solicitudesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const fechaA = a.fecha?.toDate ? a.fecha.toDate() : a.fecha;
          const fechaB = b.fecha?.toDate ? b.fecha.toDate() : b.fecha;
          return fechaB - fechaA;
        });

      // Obtener datos adicionales (usuarios, eventos, lugares)
      const usuariosSnapshot = await getDocs(collection(db, "USUARIOS"));
      const usuariosData = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const lugaresSnapshot = await getDocs(collection(db, "LUGARES"));
      const lugaresData = lugaresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combinar datos
      const solicitudesCompletas = solicitudesData.map(solicitud => {
        const usuario = usuariosData.find(u => u.id === solicitud.usuarioId);
        const evento = eventosSnapshot.docs.find(e => e.id === solicitud.eventoId)?.data();
        const lugar = lugaresData.find(l => l.id === evento?.lugarId);

        return {
          ...solicitud,
          usuarioNombre: usuario ? (usuario.name || usuario.nombre || "Usuario desconocido") : "Usuario desconocido",
          usuarioEmail: usuario ? usuario.email : "",
          eventoNombre: evento ? evento.nombre : "Evento desconocido",
          lugarNombre: lugar ? lugar.nombre : "Lugar desconocido",
          fechaFormatted: solicitud.fecha?.toDate ? solicitud.fecha.toDate().toLocaleDateString('es-ES') : solicitud.fecha
        };
      });

      setSolicitudes(solicitudesCompletas);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      toast.error("Error al cargar solicitudes de boletas");
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (solicitudId, nuevoEstado) => {
    try {
      // Obtener la solicitud actual
      const solicitudDoc = await getDoc(doc(db, "SOLICITUDES_BOLETAS", solicitudId));
      if (!solicitudDoc.exists()) {
        toast.error("Solicitud no encontrada");
        return;
      }

      const solicitud = solicitudDoc.data();

      if (nuevoEstado === "ACTIVADA") {
        // Verificar stock disponible
        const eventoDoc = await getDoc(doc(db, "EVENTOS", solicitud.eventoId));
        if (!eventoDoc.exists()) {
          toast.error("Evento no encontrado");
          return;
        }

        const evento = eventoDoc.data();
        if (evento.stockBoletas < solicitud.cantidad) {
          toast.error(`Stock insuficiente. Solo quedan ${evento.stockBoletas} boletas disponibles.`);
          return;
        }

        // Descontar del stock del evento
        await updateDoc(doc(db, "EVENTOS", solicitud.eventoId), {
          stockBoletas: evento.stockBoletas - solicitud.cantidad,
          updatedAt: new Date()
        });

        // Crear boleta en la colección BOLETERIA usando el ID del evento como documento
        const boleteriaRef = doc(db, "BOLETERIA", solicitud.eventoId);
        
        // Obtener el documento actual o crear uno nuevo
        const boleteriaDoc = await getDoc(boleteriaRef);
        const currentBoletas = boleteriaDoc.exists() ? boleteriaDoc.data().boletas || {} : {};
        
        // Generar ID único para esta boleta dentro del mapa
        const boletaId = `${solicitudId}`;
        
        // Agregar la nueva boleta al mapa
        currentBoletas[boletaId] = {
          solicitudId: solicitudId,
          usuarioId: solicitud.usuarioId,
          numeroBoleta: `${solicitud.eventoId}-${solicitudId}`,
          cantidad: solicitud.cantidad,
          estado: "ACTIVA",
          fechaCompra: solicitud.fecha,
          precioUnitario: solicitud.total / solicitud.cantidad,
          precioTotal: solicitud.total,
          createdAt: new Date()
        };
        
        // Guardar el documento actualizado
        await setDoc(boleteriaRef, {
          eventoId: solicitud.eventoId,
          boletas: currentBoletas,
          updatedAt: new Date()
        });
      }

      // Actualizar estado de la solicitud
      await updateDoc(doc(db, "SOLICITUDES_BOLETAS", solicitudId), {
        estado: nuevoEstado,
        updatedAt: new Date()
      });

      toast.success(`Solicitud ${nuevoEstado === "ACTIVADA" ? "activada" : nuevoEstado.toLowerCase()} exitosamente`);
      fetchSolicitudes(); // Recargar lista
    } catch (error) {
      console.error("Error updating solicitud:", error);
      toast.error("Error al actualizar solicitud");
    }
  };

  if (loading) {
    return ReactDOM.createPortal(
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <h3>Solicitudes de Boletas</h3>
          <EventLoading text="Cargando solicitudes de boletas..." />
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="organizador-solicitudesboletas-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="organizador-solicitudesboletas-modal" onClick={(e) => e.stopPropagation()}>
        <button className="organizador-solicitudesboletas-close-btn" onClick={onClose}>×</button>
        <h3>Solicitudes de Boletas</h3>

        {solicitudes.length === 0 ? (
          <div className="organizador-solicitudesboletas-no-solicitudes">
            <p>No hay solicitudes de boletas pendientes</p>
          </div>
        ) : (
          <div className="organizador-solicitudesboletas-list">
            {solicitudes.map(solicitud => (
              <div key={solicitud.id} className="organizador-solicitudesboletas-card">
                <div className="organizador-solicitudesboletas-header">
                  <h4>{solicitud.eventoNombre}</h4>
                  <span className={`organizador-solicitudesboletas-estado-badge organizador-solicitudesboletas-estado-${solicitud.estado?.toLowerCase() || 'pendiente'}`}>
                    {solicitud.estado || 'PENDIENTE'}
                  </span>
                </div>

                <div className="organizador-solicitudesboletas-info">
                  <p><strong>Usuario:</strong> {solicitud.usuarioNombre}</p>
                  <p><strong>Email:</strong> {solicitud.usuarioEmail}</p>
                  <p><strong>Lugar:</strong> {solicitud.lugarNombre}</p>
                  <p><strong>Cantidad:</strong> {solicitud.cantidad} boleta(s)</p>
                  <p><strong>Total:</strong> ${solicitud.total?.toLocaleString() || '0'}</p>
                  <p><strong>Método de Pago:</strong> {solicitud.metodoPago}</p>
                  <p><strong>Fecha de Solicitud:</strong> {solicitud.fechaFormatted}</p>
                  {solicitud.comprobanteUrl && (
                    <p><strong>Comprobante:</strong> <a href={solicitud.comprobanteUrl} target="_blank" rel="noopener noreferrer">Ver Comprobante</a></p>
                  )}
                </div>

                {solicitud.estado === 'PENDIENTE' && (
                  <div className="organizador-solicitudesboletas-actions">
                    <button
                      onClick={() => handleEstadoChange(solicitud.id, 'ACTIVADA')}
                      className="organizador-solicitudesboletas-approve-btn"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleEstadoChange(solicitud.id, 'RECHAZADA')}
                      className="organizador-solicitudesboletas-reject-btn"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SolicitudesBoletas;