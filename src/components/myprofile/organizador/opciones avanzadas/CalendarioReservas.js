import React, { useState, useEffect } from "react";
import { db } from "../../../../api/api";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./calendarioReservas.css";
import { FaCalendarAlt, FaUser, FaClock, FaMapMarkerAlt } from "react-icons/fa";

const CalendarioReservas = ({ userId, onClose }) => {
  const [reservas, setReservas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [reservasMap, setReservasMap] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Obtener eventos del organizador
      const eventosQuery = query(collection(db, "EVENTOS"), where("organizadorId", "==", userId));
      const eventosSnapshot = await getDocs(eventosQuery);
      const eventosData = eventosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventos(eventosData);

      // Obtener reservas del organizador directamente por organizadorId
      const reservasQuery = query(
        collection(db, "RESERVAS"),
        where("organizadorId", "==", userId)
      );
      const reservasSnapshot = await getDocs(reservasQuery);
      
      // Enriquecer datos de reservas
      const reservasData = await Promise.all(
        reservasSnapshot.docs.map(async (docSnap) => {
          const reserva = { id: docSnap.id, ...docSnap.data() };
          
          // Obtener datos del usuario
          if (reserva.usuarioId) {
            const usuarioDoc = await getDoc(doc(db, "USUARIOS", reserva.usuarioId));
            if (usuarioDoc.exists()) {
              reserva.usuarioData = usuarioDoc.data();
            }
          }
          
          // Obtener datos del evento
          const eventoDoc = eventosData.find(e => e.id === reserva.eventoId);
          if (eventoDoc) {
            reserva.eventoData = eventoDoc;
          }
          
          return reserva;
        })
      );

      // Ordenar por fecha de reserva más próxima
      const reservasOrdenadas = reservasData.sort((a, b) => {
        const fechaA = a.fechaReserva?.toDate ? a.fechaReserva.toDate() : new Date(a.fechaReserva);
        const fechaB = b.fechaReserva?.toDate ? b.fechaReserva.toDate() : new Date(b.fechaReserva);
        return fechaA - fechaB;
      });

      setReservas(reservasOrdenadas);

      // Crear mapa de reservas por fecha para el calendario
      const mapa = {};
      reservasOrdenadas.forEach(reserva => {
        const fecha = reserva.fechaReserva?.toDate ? reserva.fechaReserva.toDate() : new Date(reserva.fechaReserva);
        const fechaKey = fecha.toISOString().split('T')[0];
        if (!mapa[fechaKey]) {
          mapa[fechaKey] = [];
        }
        mapa[fechaKey].push(reserva);
      });
      setReservasMap(mapa);

      setLoading(false);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar reservas");
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Días vacíos del mes anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const hasReservasOnDate = (day) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    return reservasMap[dateKey] && reservasMap[dateKey].length > 0;
  };

  const getReservasCount = (day) => {
    if (!day) return 0;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    return reservasMap[dateKey] ? reservasMap[dateKey].length : 0;
  };

  const formatDate = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-ES', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const calendarDays = generateCalendarDays();

  if (loading) {
    return <div className="calendario-loading">Cargando calendario...</div>;
  }

  return (
    <div className="calendario-reservas-content">
        {/* Sección izquierda - Próximas reservas */}
        <div className="reservas-list-section">
          <h3>Próximas Reservas</h3>
          <div className="reservas-list">
            {reservas.length === 0 ? (
              <div className="no-reservas">
                <p>No hay reservas registradas</p>
              </div>
            ) : (
              reservas.map((reserva, index) => (
                <div key={reserva.id} className={`reserva-item ${index === 0 ? 'next' : ''}`}>
                  <div className="reserva-date">
                    {reserva.fechaReserva && (
                      <>
                        <div className="date-day">
                          {new Date(reserva.fechaReserva?.toDate ? reserva.fechaReserva.toDate() : reserva.fechaReserva).getDate()}
                        </div>
                        <div className="date-month">
                          {new Date(reserva.fechaReserva?.toDate ? reserva.fechaReserva.toDate() : reserva.fechaReserva).toLocaleDateString('es-ES', { month: 'short' })}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="reserva-details">
                    <div className="reserva-evento">
                      <FaCalendarAlt className="icon-small" />
                      <span>{reserva.eventoData?.nombre || 'Evento desconocido'}</span>
                    </div>
                    <div className="reserva-usuario">
                      <FaUser className="icon-small" />
                      <span>{reserva.usuarioData?.name || reserva.usuarioData?.nombre || 'Usuario desconocido'}</span>
                    </div>
                    <div className="reserva-dia">
                      <FaClock className="icon-small" />
                      <span>{reserva.diaReserva || 'Día no especificado'}</span>
                    </div>
                    {reserva.eventoData?.lugar && (
                      <div className="reserva-lugar">
                        <FaMapMarkerAlt className="icon-small" />
                        <span>{reserva.eventoData.lugar}</span>
                      </div>
                    )}
                    <div className="reserva-estado">
                      <span className={`estado-badge ${reserva.estado?.toLowerCase()}`}>
                        {reserva.estado || 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección derecha - Calendario */}
        <div className="calendar-section">
          <div className="calendar-header-controls">
            <button className="nav-btn" onClick={previousMonth}>←</button>
            <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <button className="nav-btn" onClick={nextMonth}>→</button>
          </div>

          <div className="calendar-weekdays">
            {dayNames.map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${
                  day ? (hasReservasOnDate(day) ? 'has-reservas' : '') : 'empty'
                }`}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    {hasReservasOnDate(day) && (
                      <span className="reservas-count">{getReservasCount(day)}</span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-color normal"></span>
              <span>Sin reservas</span>
            </div>
            <div className="legend-item">
              <span className="legend-color with-reservas"></span>
              <span>Con reservas</span>
            </div>
          </div>
        </div>
    </div>
  );
};

export default CalendarioReservas;
