import React, { useState, useEffect } from "react";
import { db } from "../../api/api";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "../../api/api";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import ComprarBoleta from "../homepages/comprarboleta/comprarboleta";
import "./EventosView.css";

const EventosView = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [eventosDisponibles, setEventosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [selectedEventoId, setSelectedEventoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchEventosDisponibles();

    return () => unsubscribe();
  }, []);

  const fetchEventosDisponibles = async () => {
    try {
      const eventosQuery = query(collection(db, "EVENTOS"), where("estado", "==", "ACTIVO"));
      const eventosSnapshot = await getDocs(eventosQuery);
      const eventosData = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const lugaresSnapshot = await getDocs(collection(db, "LUGARES"));
      const lugaresData = lugaresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const usuariosSnapshot = await getDocs(collection(db, "USUARIOS"));
      const usuariosData = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const eventosCompletos = eventosData.map(evento => {
        const lugar = lugaresData.find(l => l.id === evento.lugarId);
        const organizador = usuariosData.find(u => u.id === evento.organizadorId);
        return {
          ...evento,
          lugar: lugar || { nombre: "Lugar desconocido", direccion: "" },
          organizadorNombre: organizador ? organizador.nombre : "Organizador desconocido",
          fechaFormatted: evento.fecha?.toDate ? evento.fecha.toDate().toLocaleDateString('es-ES') : evento.fecha,
          horaFormatted: evento.hora
        };
      });

      setEventosDisponibles(eventosCompletos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const allTags = [...new Set(eventosDisponibles.flatMap(evento => evento.tags || []))];

  const eventosFiltrados = eventosDisponibles.filter(evento => {
    const coincideTag = activeFilter === "todos" || (evento.tags && evento.tags.includes(activeFilter));
    const coincideBusqueda = evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             evento.organizadorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             evento.lugar.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return coincideTag && coincideBusqueda;
  });

  const handleReservar = (eventoId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para reservar boletas");
      return;
    }
    setSelectedEventoId(eventoId);
    setShowCompraModal(true);
  };

  const handleBackClick = () => {
    // Pequeño delay para que se vea la transición
    setTimeout(() => {
      onBack();
    }, 300);
  };

  if (loading) {
    return (
      <div className="eventos-view-container">
        <div className="sidebar">
          <button className="back-btn" onClick={onBack}>← Volver</button>
        </div>
        <div className="main-content">
          <p>Cargando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eventos-view-container">
      {/* Sidebar con filtros */}
      <aside className="sidebar">
        <button className="back-btn" onClick={handleBackClick}>← Volver al inicio</button>

        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <h3>Categorías</h3>
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
          <h1>🎫 Eventos Disponibles</h1>
          <p>Reserva tus tickets ahora</p>
        </div>

        <div className="events-grid">
          {eventosFiltrados.length > 0 ? (
            eventosFiltrados.map(evento => (
              <div key={evento.id} className="event-card" onClick={() => handleReservar(evento.id)}>
                <div className="event-image" style={{ backgroundImage: `url(${evento.postimage || 'https://via.placeholder.com/400x300?text=Sin+Imagen'})` }}>
                  <div className="event-overlay">
                    <button className="reserve-btn" onClick={(e) => { e.stopPropagation(); handleReservar(evento.id); }}>Reservar Ahora</button>
                  </div>
                </div>
                <div className="event-content">
                  <h3>{evento.nombre}</h3>
                  <p className="artist">Por: {evento.organizadorNombre}</p>
                  <div className="event-info">
                    <span className="date">📅 {evento.fechaFormatted} {evento.horaFormatted}</span>
                    <span className="location">
                      📍 {evento.lugar.nombre}
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.lugar.direccion)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="maps-btn"
                      >
                        🗺️
                      </a>
                    </span>
                  </div>
                  <div className="event-footer">
                    <span className="price">${evento.precio ? evento.precio.toLocaleString() : '0'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">
              <p>No hay eventos disponibles</p>
            </div>
          )}
        </div>
      </main>

      {showCompraModal && (
        <ComprarBoleta
          eventoId={selectedEventoId}
          onClose={() => {
            setShowCompraModal(false);
            setSelectedEventoId(null);
          }}
        />
      )}
    </div>
  );
};

export default EventosView;
