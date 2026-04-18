import React, { useState, useEffect } from "react";
import { db } from "../../../../api/api";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "react-toastify";
import "./dashboard.css";
import { FaTicketAlt, FaUserCheck, FaChartBar } from "react-icons/fa";

const Dashboard = ({ userId, onClose }) => {
  const [eventos, setEventos] = useState([]);
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    boletasVendidas: 0,
    personasEntradas: 0,
    boletasDisponibles: 0,
    ingresoTotal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const q = query(collection(db, "EVENTOS"), where("organizadorId", "==", userId));
      const querySnapshot = await getDocs(q);
      const eventosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventos(eventosData);
      
      if (eventosData.length > 0) {
        setSelectedEventoId(eventosData[0].id);
        setSelectedEvento(eventosData[0]);
        await cargarEstadisticas(eventosData[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      toast.error("Error al cargar eventos");
      setLoading(false);
    }
  };

  const cargarEstadisticas = async (evento) => {
    try {
      // Obtener solicitudes de boletas para este evento
      const boletasQuery = query(
        collection(db, "SOLICITUDES_BOLETAS"),
        where("eventoId", "==", evento.id)
      );
      const boletasSnapshot = await getDocs(boletasQuery);
      const boletas = boletasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Contar boletas vendidas (estado ACTIVADA)
      const boletasVendidas = boletas.filter(b => b.estado === "ACTIVADA").length;
      
      // Contar personas que entraron (estado ESCANEADA)
      const personasEntradas = boletas.filter(b => b.estado === "ESCANEADA").length;
      
      // Calcular boletas disponibles
      const boletasDisponibles = Math.max(0, (evento.stockBoletas || 0) - boletasVendidas);
      
      // Calcular ingreso total (boletas vendidas * precio)
      const ingresoTotal = boletasVendidas * (evento.precio || 0);

      setEstadisticas({
        boletasVendidas,
        personasEntradas,
        boletasDisponibles,
        ingresoTotal
      });
    } catch (error) {
      console.error("Error loading estadisticas:", error);
      toast.error("Error al cargar estadísticas");
    }
  };

  const handleEventoChange = async (e) => {
    const eventoId = e.target.value;
    setSelectedEventoId(eventoId);
    
    const evento = eventos.find(ev => ev.id === eventoId);
    if (evento) {
      setSelectedEvento(evento);
      await cargarEstadisticas(evento);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Cargando dashboard...</div>;
  }

  if (eventos.length === 0) {
    return (
      <div className="no-eventos">
        <p>No tienes eventos registrados</p>
        <p className="text-muted">Crea un evento para ver sus estadísticas</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">

      <div className="dashboard-select-section">
        <label htmlFor="evento-select">Selecciona un evento:</label>
        <select 
          id="evento-select"
          value={selectedEventoId} 
          onChange={handleEventoChange}
          className="evento-select"
        >
          <option value="">-- Selecciona un evento --</option>
          {eventos.map(evento => (
            <option key={evento.id} value={evento.id}>
              {evento.nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedEvento && (
        <div className="dashboard-content">
          <div className="evento-info">
            <h3>{selectedEvento.nombre}</h3>
            {selectedEvento.postimage && (
              <img src={selectedEvento.postimage} alt={selectedEvento.nombre} className="evento-image" />
            )}
            <p className="evento-description">{selectedEvento.descripcion}</p>
          </div>

          <div className="estadisticas-grid">
            <div className="estadistica-card">
              <div className="card-icon">
                <FaTicketAlt />
              </div>
              <div className="card-content">
                <h4>Boletas Vendidas</h4>
                <p className="card-value">{estadisticas.boletasVendidas}</p>
                <p className="card-subtitle">de {selectedEvento.stockBoletas || 0} disponibles</p>
              </div>
            </div>

            <div className="estadistica-card">
              <div className="card-icon">
                <FaUserCheck />
              </div>
              <div className="card-content">
                <h4>Personas Entraron</h4>
                <p className="card-value">{estadisticas.personasEntradas}</p>
                <p className="card-subtitle">boletas escaneadas</p>
              </div>
            </div>

            <div className="estadistica-card">
              <div className="card-icon">
                <FaChartBar />
              </div>
              <div className="card-content">
                <h4>Boletas Disponibles</h4>
                <p className="card-value">{estadisticas.boletasDisponibles}</p>
                <p className="card-subtitle">aún por vender</p>
              </div>
            </div>

            <div className="estadistica-card ingreso-card">
              <div className="card-icon">
                💰
              </div>
              <div className="card-content">
                <h4>Ingreso Total</h4>
                <p className="card-value">${estadisticas.ingresoTotal.toLocaleString('es-ES')}</p>
                <p className="card-subtitle">a ${selectedEvento.precio || 0} por boleta</p>
              </div>
            </div>
          </div>

          <div className="estadisticas-summary">
            <h4>Resumen</h4>
            <div className="summary-item">
              <span>Capacidad total:</span>
              <strong>{selectedEvento.stockBoletas || 0} personas</strong>
            </div>
            <div className="summary-item">
              <span>Ocupación:</span>
              <strong>{Math.round((estadisticas.boletasVendidas / (selectedEvento.stockBoletas || 1)) * 100)}%</strong>
            </div>
            <div className="summary-item">
              <span>Tasa de entrada:</span>
              <strong>{estadisticas.boletasVendidas > 0 ? Math.round((estadisticas.personasEntradas / estadisticas.boletasVendidas) * 100) : 0}%</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
