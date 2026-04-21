import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "../../../api/api";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import ReservarLugar from "../reservarlugar/reservarlugar";
import "./proximamente.css";

const Proximamente = ({ onVerMas }) => {
  const [lugaresFiltrados, setLugaresFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [selectedLugarId, setSelectedLugarId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("todos");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchLugares();

    return () => unsubscribe();
  }, []);

  const fetchLugares = async () => {
    try {
      const lugaresQuery = query(
        collection(db, "LUGARES"),
        where("disponiblePublico", "==", true)
      );
      const lugaresSnapshot = await getDocs(lugaresQuery);
      const lugaresData = lugaresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLugaresFiltrados(lugaresData);
    } catch (error) {
      console.error("Error fetching lugares:", error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = [...new Set(lugaresFiltrados.flatMap(lugar => lugar.tags || []))];

  const lugaresFiltradorPorTag = activeFilter === "todos"
    ? lugaresFiltrados
    : lugaresFiltrados.filter(lugar => lugar.tags && lugar.tags.includes(activeFilter));

  const handleReservar = (lugarId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para hacer reservas");
      return;
    }
    setSelectedLugarId(lugarId);
    setShowCompraModal(true);
  };

  const handleCloseCompraModal = () => {
    setShowCompraModal(false);
    setSelectedLugarId(null);
  };

  if (loading) {
    return (
      <section className="coming-soon-section">
        <div className="container">
          <div className="coming-soon-header">
            <h2>🎉 Próximamente</h2>
            <p>Cargando lugares...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="coming-soon-section">
      <div className="container">
        <div className="coming-soon-header">
          <h2>🎉 Lugares Disponibles para Reservar</h2>
          <p>Reserva los espacios perfectos para tus eventos</p>
        </div>

        {/* Filtro Select */}
        <div className="filter-select-container">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los Lugares</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Grid de lugares */}
        <div className="coming-soon-cards">
          {lugaresFiltradorPorTag.slice(0, 10).map(lugar => (
            <div
              key={lugar.id}
              className="coming-card"
              onClick={() => handleReservar(lugar.id)}
            >
              {lugar.fotos && lugar.fotos.length > 0 && (
                <div
                  className="card-image"
                  style={{ backgroundImage: `url(${lugar.fotos[0]})` }}
                >
                  <div className="card-overlay">
                    <button className="reserve-btn">Reservar Ahora</button>
                  </div>
                </div>
              )}
              <div className="card-content">
                <h3>{lugar.nombre}</h3>
                <p className="lugar-address">📍 {lugar.direccion}</p>
                <div className="lugar-info">
                  <span className="capacidad">👥 {Number(lugar.capacidad || 0).toLocaleString('es-ES')} personas</span>
                  <span className="precio">💰 ${Number(lugar.precioDisponible || 0).toLocaleString('es-ES')}</span>
                </div>
                {lugar.tags && lugar.tags.length > 0 && (
                  <div className="tags-container">
                    {lugar.tags.map((tag, index) => (
                      <span key={index} className="tag-badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {lugaresFiltradorPorTag.length === 0 && (
          <div className="no-events">
            <p>No hay lugares disponibles en esta categoría</p>
          </div>
        )}

        {lugaresFiltradorPorTag.length > 10 && (
          <div className="see-more-container">
            <button className="see-more-btn" onClick={() => onVerMas && onVerMas()}>
              Ver más lugares
            </button>
          </div>
        )}

      </div>

      {showCompraModal && selectedLugarId && (
        <ReservarLugar
          lugarId={selectedLugarId}
          onClose={handleCloseCompraModal}
        />
      )}
    </section>
  );
};

export default Proximamente;