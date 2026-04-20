import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { db } from "../../../api/api";
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./promocionar.css";

const Promocionar = ({ onClose }) => {
  const [eventos, setEventos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchEventosAndPromociones();
  }, []);

  const fetchEventosAndPromociones = async () => {
    try {
      // Obtener todos los eventos
      const eventosSnapshot = await getDocs(collection(db, "EVENTOS"));
      const eventosData = eventosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventos(eventosData);

      // Obtener promociones actuales
      const promocionesSnapshot = await getDocs(collection(db, "PROMOCIONES"));
      const promocionesData = promocionesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPromociones(promocionesData);
    } catch (error) {
      console.error("Error fetching:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos por búsqueda
  useEffect(() => {
    const result = eventos.filter((e) =>
      e.nombre?.toLowerCase().includes(searchId.toLowerCase())
    );
    setFiltered(result);
  }, [searchId, eventos]);

  // Verificar si un evento ya está promocionado
  const isPromocionado = (eventoId) => {
    return promociones.some(p => p.eventoId === eventoId);
  };

  // Agregar evento a promociones
  const handleAddPromocion = async (evento) => {
    if (promociones.length >= 10) {
      toast.warning("Máximo 10 eventos en promoción");
      return;
    }

    if (!evento.postimage) {
      toast.error("El evento debe tener una imagen (poster) para promocionarse");
      return;
    }

    try {
      const nuevaPromocion = {
        eventoId: evento.id,
        nombre: evento.nombre,
        descripcion: evento.descripcion || "",
        imagen: evento.postimage,
        precio: evento.precio,
        organizadorId: evento.organizadorId,
        posicion: promociones.length + 1,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, "PROMOCIONES"), nuevaPromocion);
      setPromociones([...promociones, { id: docRef.id, ...nuevaPromocion }]);
      toast.success(`"${evento.nombre}" agregado a promociones`);
    } catch (error) {
      console.error("Error adding promocion:", error);
      toast.error("Error al agregar promoción");
    }
  };

  // Remover evento de promociones
  const handleRemovePromocion = async (promocionId) => {
    try {
      await deleteDoc(doc(db, "PROMOCIONES", promocionId));
      setPromociones(promociones.filter(p => p.id !== promocionId));
      toast.success("Evento removido de promociones");
    } catch (error) {
      console.error("Error removing promocion:", error);
      toast.error("Error al remover promoción");
    }
  };

  // Cambiar posición en lista de promociones
  const handleChangePosition = async (promocionId, nuevaPosicion) => {
    if (nuevaPosicion < 1 || nuevaPosicion > promociones.length) {
      return;
    }

    try {
      const promocionesActualizadas = [...promociones];
      const indexActual = promocionesActualizadas.findIndex(p => p.id === promocionId);
      
      if (indexActual !== -1) {
        const temp = promocionesActualizadas[indexActual];
        promocionesActualizadas[indexActual] = promocionesActualizadas[nuevaPosicion - 1];
        promocionesActualizadas[nuevaPosicion - 1] = temp;

        // Actualizar posiciones en Firestore
        for (let i = 0; i < promocionesActualizadas.length; i++) {
          await updateDoc(doc(db, "PROMOCIONES", promocionesActualizadas[i].id), {
            posicion: i + 1
          });
        }

        setPromociones(promocionesActualizadas);
        toast.success("Posición actualizada");
      }
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Error al actualizar posición");
    }
  };

  if (loading) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="promo-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="promo-close-btn" onClick={onClose}>×</button>

        {/* IZQUIERDA - Lista de eventos */}
        <div className="promo-left">
          <h3 className="promo-subtitle">Buscar Eventos</h3>

          <input
            className="promo-input"
            placeholder="Escribe el nombre del evento..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />

          <div className="promo-results">
            {filtered.length === 0 ? (
              <div className="promo-empty">No hay eventos disponibles</div>
            ) : (
              filtered.map((evento) => (
                <div
                  key={evento.id}
                  className={`promo-result-item ${
                    selected?.id === evento.id ? "active" : ""
                  }`}
                  onClick={() => setSelected(evento)}
                >
                  <div className="promo-item-info">
                    <p className="promo-item-title">{evento.nombre}</p>
                    <p className="promo-item-price">${evento.precio}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DERECHA - Detalles y promociones */}
        <div className="promo-right">
          {!selected ? (
            <div className="promo-empty">
              Selecciona un evento para ver detalles
            </div>
          ) : (
            <div className="promo-detail">
              <h2>{selected.nombre}</h2>
              
              {selected.imagen && (
                <img src={selected.imagen} alt={selected.nombre} className="promo-event-image" />
              )}

              <p><strong>Precio:</strong> ${selected.precio}</p>
              <p><strong>Stock:</strong> {selected.stockBoletas}</p>
              <p><strong>Descripción:</strong> {selected.descripcion || "Sin descripción"}</p>

              {isPromocionado(selected.id) ? (
                <button
                  className="promo-btn promo-btn-remove"
                  onClick={() => {
                    const promo = promociones.find(p => p.eventoId === selected.id);
                    if (promo) handleRemovePromocion(promo.id);
                  }}
                >
                  Remover de Promociones
                </button>
              ) : (
                <button
                  className="promo-btn promo-btn-add"
                  onClick={() => handleAddPromocion(selected)}
                  disabled={promociones.length >= 10}
                >
                  {promociones.length >= 10 ? "Máximo 10 eventos" : "Agregar a Promociones"}
                </button>
              )}
            </div>
          )}

          {/* Lista de promociones actuales */}
          <div className="promo-list-section">
            <h3>Eventos Promocionados ({promociones.length}/10)</h3>
            <div className="promo-list">
              {promociones.length === 0 ? (
                <p className="promo-empty-list">Sin eventos en promoción</p>
              ) : (
                promociones.map((promo, index) => (
                  <div key={promo.id} className="promo-list-item">
                    <div className="promo-list-content">
                      <span className="promo-position">{index + 1}</span>
                      <p className="promo-list-title">{promo.nombre}</p>
                    </div>
                    <div className="promo-list-actions">
                      {index > 0 && (
                        <button
                          className="promo-arrow-btn"
                          onClick={() => handleChangePosition(promo.id, index)}
                          title="Mover arriba"
                        >
                          ↑
                        </button>
                      )}
                      {index < promociones.length - 1 && (
                        <button
                          className="promo-arrow-btn"
                          onClick={() => handleChangePosition(promo.id, index + 2)}
                          title="Mover abajo"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        className="promo-delete-btn"
                        onClick={() => handleRemovePromocion(promo.id)}
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Promocionar;
