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
  const [searchEvento, setSearchEvento] = useState('');

  useEffect(() => {
    let unsubscribeReservas = null;

    const setupRealtimeListener = async () => {
      try {
        console.log("🔍 Setting up listener for userId:", userId);
        console.log("🔍 Buscando reservas con organizadorId:", userId);
        
        // Buscar directamente por organizadorId - SIN filtro de estado para debug
        const reservasQuery = query(
          collection(db, "RESERVAS"),
          where("organizadorId", "==", userId)
          // Temporalmente removemos el filtro de estado para ver todas las reservas
          // where("estado", "==", "PENDIENTE")
        );
        
        console.log("🔍 Query creado, configurando listener...");
        
        unsubscribeReservas = onSnapshot(reservasQuery, (snapshot) => {
          console.log("✅ Snapshot recibido, documentos encontrados:", snapshot.docs.length);
          
          // Obtener datos de usuarios para enriquecer la información
          const loadUserData = async () => {
            try {
              console.log("📦 Cargando datos de usuarios...");
              const usuariosSnapshot = await getDocs(collection(db, "USUARIOS"));
              const usuariosData = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

              const eventosQuery = query(collection(db, "EVENTOS"), where("organizadorId", "==", userId));
              const eventosSnapshot = await getDocs(eventosQuery);
              const eventosData = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

              const reservasData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                  const fechaA = a.fechaReserva?.toDate ? a.fechaReserva.toDate() : a.fechaReserva;
                  const fechaB = b.fechaReserva?.toDate ? b.fechaReserva.toDate() : b.fechaReserva;
                  return fechaB - fechaA;
                });

              console.log("📋 Datos brutos de reservas:", reservasData);
              console.log("🔎 Reservas con organizadorId coincidente:", reservasData.filter(r => r.organizadorId === userId));
              console.log("🔎 Estados de reservas encontrados:", reservasData.map(r => r.estado));

              // Combinar datos
              const reservasCompletas = reservasData.map(reserva => {
                const usuario = usuariosData.find(u => u.id === reserva.usuarioId);
                const evento = eventosData.find(e => e.id === reserva.eventoId);

                return {
                  ...reserva,
                  usuarioNombre: usuario ? (usuario.name || usuario.nombre || "Usuario desconocido") : "Usuario desconocido",
                  usuarioEmail: usuario ? usuario.email : "",
                  usuarioTelefono: usuario ? usuario.telefono : "",
                  eventoNombre: evento ? evento.nombre : "Evento desconocido",
                  eventoDescripcion: evento ? evento.descripcion : "",
                  fechaFormatted: reserva.fechaReserva?.toDate ? reserva.fechaReserva.toDate().toLocaleDateString('es-ES') : reserva.fechaReserva,
                  diaReservaFormatted: reserva.diaReserva || "No especificado"
                };
              });

              setReservas(reservasCompletas);
              setLoading(false);
              
              console.log("✨ Reservas finales procesadas:", reservasCompletas);
              console.log("📊 Total de reservas para mostrar:", reservasCompletas.length);
              console.log("👤 Usuarios encontrados:", usuariosData.length);
              console.log("🎯 Eventos encontrados:", eventosData.length);
            } catch (error) {
              console.error("Error loading user data:", error);
              setLoading(false);
            }
          };

          loadUserData();
        }, (error) => {
          console.error("❌ Error en realtime listener:", error);
          console.error("❌ Detalles del error:", error.message);
          toast.error("Error al cargar solicitudes de reservas");
          setLoading(false);
        });
      } catch (error) {
        console.error("❌ Error configurando realtime listener:", error);
        console.error("❌ Detalles:", error.message);
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
          <h3>Solicitudes de Boletas</h3>
          <EventLoading text="Cargando solicitudes de boletas..." />
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="organizador-solicitudesdereserva-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="organizador-solicitudesdereserva-modal" onClick={(e) => e.stopPropagation()}>
        <button className="organizador-solicitudesdereserva-close-btn" onClick={onClose}>×</button>
        <h3>Solicitudes de Reservas</h3>
        <div className="organizador-solicitudesdereserva-filter-controls">
          <input
            type="text"
            placeholder="Buscar por nombre de evento"
            value={searchEvento}
            onChange={(e) => setSearchEvento(e.target.value)}
            className="organizador-solicitudesdereserva-search-input"
          />
        </div>

        {reservas.filter(r => r.eventoNombre.toLowerCase().includes(searchEvento.toLowerCase())).length === 0 ? (
          <div className="organizador-solicitudesdereserva-no-reservas">
            <p>No hay solicitudes de reservas pendientes</p>
          </div>
        ) : (
          <div className="organizador-solicitudesdereserva-reservas-list">
            {reservas.filter(r => r.eventoNombre.toLowerCase().includes(searchEvento.toLowerCase())).map(reserva => (
              <div key={reserva.id} className="organizador-solicitudesdereserva-reserva-card">
                <div className="organizador-solicitudesdereserva-reserva-header">
                  <h4>{reserva.lugarNombre}</h4>
                  <span className={`organizador-solicitudesdereserva-estado-badge organizador-solicitudesdereserva-estado-${reserva.estado?.toLowerCase() || 'pendiente'}`}>
                    {reserva.estado || 'PENDIENTE'}
                  </span>
                </div>

                <div className="organizador-solicitudesdereserva-reserva-info">
                  <p><strong>Usuario:</strong> {reserva.usuarioNombre}</p>
                  <p><strong>Email:</strong> {reserva.usuarioEmail}</p>
                  <p><strong>Teléfono:</strong> {reserva.usuarioTelefono ? <a href={`https://wa.me/${reserva.usuarioTelefono}`} target="_blank" rel="noopener noreferrer">{reserva.usuarioTelefono}</a> : 'No disponible'}</p>
                  <p><strong>Dirección:</strong> {reserva.direccion}</p>
                  <p><strong>Capacidad:</strong> {reserva.capacidad} personas</p>
                  <p><strong>Día de Reserva:</strong> {reserva.diaReservaFormatted}</p>
                  <p><strong>Precio Base:</strong> ${reserva.precioBase?.toLocaleString() || '0'}</p>
                  
                  {reserva.servicios && reserva.servicios.length > 0 && (
                    <div className="organizador-solicitudesdereserva-servicios-reserva">
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
                  <div className="organizador-solicitudesdereserva-reserva-actions">
                    <button
                      onClick={() => handleEstadoChange(reserva.id, 'CONFIRMADA')}
                      className="organizador-solicitudesdereserva-approve-btn"
                      title="Confirmar el pago y activar la reserva"
                    >
                      Confirmar y Activar
                    </button>
                    <button
                      onClick={() => handleEstadoChange(reserva.id, 'RECHAZADA')}
                      className="organizador-solicitudesdereserva-reject-btn"
                      title="Rechazar la solicitud de reserva"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
                {(reserva.estado === 'ACTIVADA' || reserva.estado === 'CONFIRMADA') && (
                  <div className="organizador-solicitudesdereserva-reserva-status-active">
                    <p className="organizador-solicitudesdereserva-status-confirmed">✓ Reserva Activada</p>
                  </div>
                )}
                {reserva.estado === 'RECHAZADA' && (
                  <div className="organizador-solicitudesdereserva-reserva-status-rejected">
                    <p className="organizador-solicitudesdereserva-status-rejected">✗ Reserva Rechazada</p>
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
