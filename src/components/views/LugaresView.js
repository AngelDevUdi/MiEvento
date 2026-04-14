import React, { useState, useEffect } from "react";
import { db } from "../../api/api";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "../../api/api";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import ComprarBoleta from "../homepages/comprarboleta/comprarboleta";
import EventLoading from "../loading/EventLoading";
import "./LugaresView.css";

const LugaresView = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [lugaresFiltrados, setLugaresFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [selectedLugarId, setSelectedLugarId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const lugaresFiltradorPorTag = lugaresFiltrados.filter(lugar => {
    const coincideTag = activeFilter === "todos" || (lugar.tags && lugar.tags.includes(activeFilter));
    const coincideBusqueda = lugar.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             lugar.direccion.toLowerCase().includes(searchTerm.toLowerCase());
    return coincideTag && coincideBusqueda;
  });

  const handleReservar = (lugarId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para hacer reservas");
      return;
    }
    setSelectedLugarId(lugarId);
    setShowCompraModal(true);
  };

  const handleBackClick = () => {
    // Pequeño delay para que se vea la transición
    setTimeout(() => {
      onBack();
    }, 300);
  };

  if (loading) {
    return <EventLoading />;
  }

  return (
    <div className="lugares-view-container">
      {/* Sidebar con filtros */}
      <aside className="sidebar">
        <button className="back-btn" onClick={handleBackClick}>← Volver al inicio</button>

        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar lugares..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <h3>Tipo de Evento</h3>
          <button
            className={`filter-tag ${activeFilter === "todos" ? "active" : ""}`}
            onClick={() => setActiveFilter("todos")}
          >
            Todos
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`filter-tag ${activeFilter === tag ? "active" : ""}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        <div className="header">
          <h1>🏢 Lugares Disponibles</h1>
          <p>Reserva el espacio perfecto para tu evento</p>
        </div>

        <div className="lugares-grid">
          {lugaresFiltradorPorTag.length > 0 ? (
            lugaresFiltradorPorTag.map(lugar => (
              <div
                key={lugar.id}
                className="lugar-card"
                onClick={() => handleReservar(lugar.id)}
              >
                {lugar.fotos && lugar.fotos.length > 0 && (
                  <div className="lugar-image" style={{ backgroundImage: `url(${lugar.fotos[0]})` }}>
                    <div className="lugar-overlay">
                      <button className="reserve-btn" onClick={(e) => { e.stopPropagation(); handleReservar(lugar.id); }}>Reservar Ahora</button>
                    </div>
                  </div>
                )}
                <div className="lugar-content">
                  <h3>{lugar.nombre}</h3>
                  <p className="lugar-description">{lugar.direccion}</p>
                  <div className="lugar-info">
                    <span className="capacidad">👥 {Number(lugar.capacidad || 0).toLocaleString('es-ES')} personas</span>
                    <span className="precio">💰 ${Number(lugar.precioDisponible || 0).toLocaleString('es-ES')}</span>
                  </div>
                  {lugar.descripcion && (
                    <p className="description">{lugar.descripcion.substring(0, 80)}...</p>
                  )}
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
            ))
          ) : (
            <div className="no-lugares">
              <p>No hay lugares disponibles</p>
            </div>
          )}
        </div>
      </main>

      {showCompraModal && selectedLugarId && (
        <ComprarBoleta
          eventoId={selectedLugarId}
          onClose={() => {
            setShowCompraModal(false);
            setSelectedLugarId(null);
          }}
        />
      )}
    </div>
  );
};

export default LugaresView;
