import React, { useState, useEffect } from "react";
import { db, auth } from "../../../api/api";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import EventLoading from "../../loading/EventLoading";
import ReservaModal from "./reserva/ReservaModal";
import "./reservas.css";

const Reservas = ({ userId }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas'); // 'pendientes', 'activas', 'usadas', 'todas'
  const [selectedReserva, setSelectedReserva] = useState(null);

  useEffect(() => {
    if (!userId) {
      setReservas([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Usar listener en tiempo real con usuarioId
    const reservasQuery = query(
      collection(db, "RESERVAS"),
      where("usuarioId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      reservasQuery,
      (snapshot) => {
        const reservasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReservas(reservasData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching reservas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Lógica de filtrado por 3 opciones
  const reservasFiltradas = filtro === 'pendientes'
    ? reservas.filter(r => r.estado === 'PENDIENTE')
    : filtro === 'activas'
    ? reservas.filter(r => r.estado === 'ACTIVADA' || r.estado === 'CONFIRMADA')
    : filtro === 'usadas'
    ? reservas.filter(r => r.estado === 'USADA')
    : reservas;

  if (loading) return <EventLoading text="Cargando reservas..." />;

  return (
    <div className="reservas-section">
      <h2>Mis Reservas</h2>
      
      {/* Filtro de 3 opciones */}
      <div className="filter-buttons">
        <div>
          <label>
            <input 
              type="radio" 
              name="filtro-reservas" 
              checked={filtro === 'pendientes'}
              onChange={() => setFiltro('pendientes')}
            />
            <span>Pendientes</span>
          </label>
          <label>
            <input 
              type="radio" 
              name="filtro-reservas" 
              checked={filtro === 'activas'}
              onChange={() => setFiltro('activas')}
            />
            <span>Activas</span>
          </label>
          <label>
            <input 
              type="radio" 
              name="filtro-reservas" 
              checked={filtro === 'usadas'}
              onChange={() => setFiltro('usadas')}
            />
            <span>Usadas</span>
          </label>
        </div>
      </div>

      {reservasFiltradas.length === 0 ? (
        <div className="no-reservas-message">
          No tienes reservas {filtro !== 'todas' ? `${filtro}` : ''}.
        </div>
      ) : (
        <div className="reservas-list">
          {reservasFiltradas.map(reserva => (
            <div key={reserva.id} className="reserva-card-usuario">
              <div className="reserva-header">
                <h3>{reserva.lugarNombre}</h3>
                <span className={`estado-badge estado-${reserva.estado?.toLowerCase()}`}>
                  {reserva.estado || 'SIN ESTADO'}
                </span>
              </div>
              <div className="reserva-info">
                <p><strong>📅 Fecha Evento:</strong> {reserva.diaReserva}</p>
                <p><strong>📝 Fecha Reservación:</strong> {new Date(reserva.fechaReserva?.toDate?.() || reserva.fechaReserva).toLocaleDateString('es-ES')}</p>
                <p><strong>💰 Total:</strong> ${reserva.total?.toLocaleString('es-ES') || '0'}</p>
                <p><strong>💳 Método:</strong> {reserva.metodoPago || 'No especificado'}</p>
              </div>
              <div className="reserva-footer">
                <button onClick={() => setSelectedReserva(reserva)} className="reserva-button">Ver Reservación</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ReservaModal 
        isOpen={!!selectedReserva} 
        onClose={() => setSelectedReserva(null)} 
        reserva={selectedReserva} 
        usuarioId={userId} 
      />
    </div>
  );
};

export default Reservas;