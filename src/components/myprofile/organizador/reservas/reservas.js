import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { db } from "../../../../api/api";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { toast } from "react-toastify";
import EventLoading from "../../../loading/EventLoading";
import "./reservas.css";

const Reservas = ({ userId, onClose }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeReservas = null;

    const setupRealtimeListener = async () => {
      try {
        // Buscar directamente por organizadorId en lugar de por lugarId
        const reservasQuery = query(
          collection(db, "RESERVAS"),
          where("organizadorId", "==", userId),
          where("estado", "==", "PENDIENTE")
        );
        
        unsubscribeReservas = onSnapshot(reservasQuery, (snapshot) => {
          // Obtener datos de usuarios para enriquecer la información
          const loadUserData = async () => {
            try {
              const usuariosSnapshot = await getDocs(collection(db, "USUARIOS"));
              const usuariosData = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

              const reservasData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                  const fechaA = a.fechaReserva?.toDate ? a.fechaReserva.toDate() : a.fechaReserva;
                  const fechaB = b.fechaReserva?.toDate ? b.fechaReserva.toDate() : b.fechaReserva;
                  return fechaB - fechaA;
                });

              // Combinar datos
              const reservasCompletas = reservasData.map(reserva => {
                const usuario = usuariosData.find(u => u.id === reserva.usuarioId);

                return {
                  ...reserva,
                  usuarioNombre: usuario ? (usuario.name || usuario.nombre || "Usuario desconocido") : "Usuario desconocido",
                  usuarioEmail: usuario ? usuario.email : "",
                  fechaFormatted: reserva.fechaReserva?.toDate ? reserva.fechaReserva.toDate().toLocaleDateString('es-ES') : reserva.fechaReserva,
                  diaReservaFormatted: reserva.diaReserva || "No especificado"
                };
              });

              setReservas(reservasCompletas);
              setLoading(false);
            } catch (error) {
              console.error("Error loading user data:", error);
              setLoading(false);
            }
          };

          loadUserData();
        }, (error) => {
          console.error("Error in realtime listener:", error);
          toast.error("Error al cargar solicitudes de reservas");
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up realtime listener:", error);
        toast.error("Error al cargar solicitudes de reservas");
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribeReservas) {
        unsubscribeReservas();
      }
    };
  }, [userId]);

  const handleEstadoChange = async (reservaId, nuevoEstado) => {
    try {
      // Si el organizador confirma, cambiar directamente a ACTIVADA
      const estadoFinal = nuevoEstado === "CONFIRMADA" ? "ACTIVADA" : nuevoEstado;
      
      await updateDoc(doc(db, "RESERVAS", reservaId), {
        estado: estadoFinal,
        updatedAt: new Date(),
        confirmedAt: estadoFinal === "ACTIVADA" ? new Date() : null
      });

      const mensaje = estadoFinal === "ACTIVADA" 
        ? "Reserva confirmada y activada exitosamente" 
        : "Reserva rechazada exitosamente";
      
      toast.success(mensaje);
      // El listener en tiempo real actualizará automáticamente la lista
    } catch (error) {
      console.error("Error updating reserva:", error);
      toast.error("Error al actualizar reserva");
    }
  };

  if (loading) {
    return ReactDOM.createPortal(
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <div style={{ padding: "40px 20px" }}>
            <EventLoading text="Cargando solicitudes de reservas..." />
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Solicitudes de Reservas</h3>

        {reservas.length === 0 ? (
          <div className="no-reservas">
            <p>No hay solicitudes de reservas pendientes</p>
          </div>
        ) : (
          <div className="reservas-list">
            {reservas.map(reserva => (
              <div key={reserva.id} className="reserva-card">
                <div className="reserva-header">
                  <h4>{reserva.lugarNombre}</h4>
                  <span className={`estado-badge estado-${reserva.estado?.toLowerCase() || 'pendiente'}`}>
                    {reserva.estado || 'PENDIENTE'}
                  </span>
                </div>

                <div className="reserva-info">
                  <p><strong>Usuario:</strong> {reserva.usuarioNombre}</p>
                  <p><strong>Email:</strong> {reserva.usuarioEmail}</p>
                  <p><strong>Dirección:</strong> {reserva.direccion}</p>
                  <p><strong>Capacidad:</strong> {reserva.capacidad} personas</p>
                  <p><strong>Día de Reserva:</strong> {reserva.diaReservaFormatted}</p>
                  <p><strong>Precio Base:</strong> ${reserva.precioBase?.toLocaleString() || '0'}</p>
                  
                  {reserva.servicios && reserva.servicios.length > 0 && (
                    <div className="servicios-reserva">
                      <p><strong>Servicios Seleccionados:</strong></p>
                      <ul>
                        {reserva.servicios.map((servicio, index) => (
                          <li key={index}>
                            {servicio.nombre} {servicio.adicional ? "(adicional)" : "(incluido)"} - ${servicio.precio?.toLocaleString() || '0'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p><strong>Total:</strong> ${reserva.total?.toLocaleString() || '0'}</p>
                  <p><strong>Método de Pago:</strong> {reserva.metodoPago}</p>
                  <p><strong>Fecha de Solicitud:</strong> {reserva.fechaFormatted}</p>
                </div>

                {reserva.estado === 'PENDIENTE' && (
                  <div className="reserva-actions">
                    <button
                      onClick={() => handleEstadoChange(reserva.id, 'CONFIRMADA')}
                      className="approve-btn"
                      title="Confirmar el pago y activar la reserva"
                    >
                      Confirmar y Activar
                    </button>
                    <button
                      onClick={() => handleEstadoChange(reserva.id, 'RECHAZADA')}
                      className="reject-btn"
                      title="Rechazar la solicitud de reserva"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
                {(reserva.estado === 'ACTIVADA' || reserva.estado === 'CONFIRMADA') && (
                  <div className="reserva-status-active">
                    <p className="status-confirmed">✓ Reserva Activada</p>
                  </div>
                )}
                {reserva.estado === 'RECHAZADA' && (
                  <div className="reserva-status-rejected">
                    <p className="status-rejected">✗ Reserva Rechazada</p>
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

export default Reservas;
