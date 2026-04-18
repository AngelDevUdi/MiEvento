import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, query, where, getDocs } from "firebase/firestore";
import EventLoading from "../../loading/EventLoading";
import { toast } from "react-toastify";
import "./reservas.css";

const Reservas = ({ userEmail }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyActive, setShowOnlyActive] = useState(true); // 🔥 Estado para el filtro

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const q = query(collection(db, "RESERVAS"), where("userEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);
        const reservasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReservas(reservasData);
      } catch (error) {
        console.error("Error fetching reservas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) { fetchReservas(); }
  }, [userEmail]);

  // 🔥 Lógica de filtrado
  const reservasFiltradas = showOnlyActive 
    ? reservas.filter(r => r.status === 'ACTIVADA' || r.status === 'CONFIRMADA') 
    : reservas;

  if (loading) return <EventLoading text="Cargando reservas..." />;

  return (
    <div className="reservas-section">
      <h2>Mis Reservas</h2>
      
      {/* 🔥 El Botón Gemelo */}
      <div className="filter-buttons">
        <button 
          className={`filter-toggle ${showOnlyActive ? 'active' : ''}`}
          onClick={() => {
            if (!showOnlyActive && reservasFiltradas.length === 0) {
              toast.info("No tienes reservas activas actualmente", {
                position: "top-right",
                autoClose: 3000,
                theme: "dark",
              });
            }
            setShowOnlyActive(!showOnlyActive);
          }}
        >
          {showOnlyActive ? 'Mostrar Todas' : 'Mostrar Activas'}
        </button>
      </div>

      {/* 🔥 Quitamos las letras de "No tienes..." y dejamos limpio si es 0 */}
      {reservasFiltradas.length === 0 ? null : (
        <div className="reservas-list">
          {reservasFiltradas.map(reserva => (
            <div key={reserva.id} className="reserva-card">
              <h3>{reserva.eventName}</h3>
              <p><strong>Fecha:</strong> {reserva.date}</p>
              <p><strong>Ubicación:</strong> {reserva.location}</p>
              <p><strong>Estado:</strong> {reserva.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reservas;