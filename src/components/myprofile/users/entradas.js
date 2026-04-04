import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./entradas.css";

const Entradas = ({ userEmail }) => {
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntradas = async () => {
      try {
        const q = query(collection(db, "ENTRADAS"), where("userEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);
        const entradasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEntradas(entradasData);
      } catch (error) {
        console.error("Error fetching entradas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchEntradas();
    }
  }, [userEmail]);

  if (loading) {
    return <div className="entradas-loading">Cargando entradas...</div>;
  }

  return (
    <div className="entradas-section">
      <h2>Mis Entradas</h2>
      {entradas.length === 0 ? (
        <p>No tienes entradas compradas.</p>
      ) : (
        <div className="entradas-list">
          {entradas.map(entrada => (
            <div key={entrada.id} className="entrada-card">
              <h3>{entrada.eventName}</h3>
              <p><strong>Fecha:</strong> {entrada.date}</p>
              <p><strong>Ubicación:</strong> {entrada.location}</p>
              <p><strong>Cantidad:</strong> {entrada.quantity}</p>
              <p><strong>Precio:</strong> {entrada.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Entradas;