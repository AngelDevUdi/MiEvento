import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "../../../api/api";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import ComprarBoleta from "../comprarboleta/comprarboleta";
import "./eventosdisponibles.css";

const EventosDisponibles = ({ onVerMas }) => {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [eventosDisponibles, setEventosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [selectedEventoId, setSelectedEventoId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchEventosDisponibles();

    return () => unsubscribe();
  }, []);

  const fetchEventosDisponibles = async () => {
    try {
      // Fetch eventos activos
      const eventosQuery = query(collection(db, "EVENTOS"), where("estado", "==", "ACTIVO"));
      const eventosSnapshot = await getDocs(eventosQuery);
      const eventosData = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch lugares
      const lugaresSnapshot = await getDocs(collection(db, "LUGARES"));
      const lugaresData = lugaresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch usuarios (organizadores)
      const usuariosSnapshot = await getDocs(collection(db, "USUARIOS"));
      const usuariosData = usuariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combinar datos
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

  // Obtener tags únicos para filtros
  const allTags = [...new Set(eventosDisponibles.flatMap(evento => evento.tags || []))];

  // Filtrar eventos
  const eventosFiltrados = activeFilter === "todos"
    ? eventosDisponibles
    : eventosDisponibles.filter(evento => evento.tags && evento.tags.includes(activeFilter));

  const handleReservar = (eventoId) => {
    if (!user) {
      toast.error("Debes iniciar sesión para reservar boletas");
      return;
    }
    setSelectedEventoId(eventoId);
    setShowCompraModal(true);
  };

  const handleCloseCompraModal = () => {
    setShowCompraModal(false);
    setSelectedEventoId(null);
  };

  if (loading) {
    return (
      <section className="available-events-section">
        <div className="container">
          <div className="events-header">
            <h2>🎫 Eventos Disponibles</h2>
            <p>Cargando eventos...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="available-events-section">
      <div className="container">
        <div className="events-header">
          <h2>🎫 Eventos Disponibles</h2>
          <p>Reserva tus tickets ahora</p>
        </div>

        {/* Filtros - simplificado por ahora */}
        <div className="filter-buttons">
          <button className={`filter-btn ${activeFilter === "todos" ? "active" : ""}`} onClick={() => setActiveFilter("todos")}>
            Todos los Eventos
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`filter-btn ${activeFilter === tag ? "active" : ""}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid de eventos */}
        <div className="events-grid">
          {eventosFiltrados.slice(0, 10).map(evento => (
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
                      🗺️ Maps
                    </a>
                  </span>
                </div>
                <div className="event-footer">
                  <span className="price">${evento.precio ? evento.precio.toLocaleString() : '0'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {eventosFiltrados.length === 0 && (
          <div className="no-events">
            <p>No hay eventos disponibles en esta categoría</p>
          </div>
        )}

        {eventosFiltrados.length > 10 && (
          <div className="see-more-container">
            <button className="see-more-btn" onClick={() => onVerMas && onVerMas()}>
              Ver más eventos
            </button>
          </div>
        )}
      </div>

      {showCompraModal && (
        <ComprarBoleta
          eventoId={selectedEventoId}
          onClose={handleCloseCompraModal}
        />
      )}
    </section>
  );
};

export default EventosDisponibles;