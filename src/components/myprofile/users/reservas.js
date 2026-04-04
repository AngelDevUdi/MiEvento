import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./reservas.css";

const Reservas = ({ userEmail }) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

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

    if (userEmail) {
      fetchReservas();
    }
  }, [userEmail]);

  if (loading) {
    return <div className="reservas-loading">Cargando reservas...</div>;
  }

  return (
    <div className="reservas-section">
      <h2>Mis Reservas</h2>
      {reservas.length === 0 ? (
        <p>No tienes reservas activas.</p>
      ) : (
        <div className="reservas-list">
          {reservas.map(reserva => (
            <div key={reserva.id} className="reserva-card">
              <h3>{reserva.eventName}</h3>
              <p><strong>Fecha:</strong> {reserva.date}</p>
              <p><strong>Ubicación:</strong> {reserva.location}</p>
              <p><strong>Estado:</strong> {reserva.status}</p>
              <p><strong>Fecha de reserva:</strong> {reserva.reservationDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reservas;