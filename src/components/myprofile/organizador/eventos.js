import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./organizador.css";

const Eventos = ({ userId, onClose }) => {
  const [lugares, setLugares] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha: "",
    hora: "",
    lugarId: "",
    estado: "ACTIVO",
    stockBoletas: "",
    postimage: "",
    precio: "",
    tags: ""
  });

  useEffect(() => {
    fetchLugares();
    fetchEventos();
  }, []);

  const fetchLugares = async () => {
    try {
      const q = query(collection(db, "LUGARES"), where("organizadorId", "==", userId));
      const querySnapshot = await getDocs(q);
      const lugaresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLugares(lugaresData);
    } catch (error) {
      console.error("Error fetching lugares:", error);
      toast.error("Error al cargar lugares");
    }
  };

  const fetchEventos = async () => {
    try {
      const q = query(collection(db, "EVENTOS"), where("organizadorId", "==", userId));
      const querySnapshot = await getDocs(q);
      const eventosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEventos(eventosData);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      toast.error("Error al cargar eventos");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      fecha: "",
      hora: "",
      lugarId: "",
      estado: "ACTIVO",
      stockBoletas: "",
      postimage: "",
      precio: "",
      tags: ""
    });
    setEditingEventId(null);
    setShowForm(false);
  };

  const handleEditEvent = (evento) => {
    const fechaObj = evento.fecha?.toDate ? evento.fecha.toDate() : new Date(evento.fecha);
    const fechaString = fechaObj instanceof Date && !isNaN(fechaObj) ? fechaObj.toISOString().slice(0, 10) : "";
    const horaString = fechaObj instanceof Date && !isNaN(fechaObj) ? fechaObj.toTimeString().slice(0, 5) : "";

    setFormData({
      nombre: evento.nombre || "",
      descripcion: evento.descripcion || "",
      fecha: fechaString,
      hora: horaString,
      lugarId: evento.lugarId || "",
      estado: evento.estado || "ACTIVO",
      stockBoletas: evento.stockBoletas?.toString() || "",
      postimage: evento.postimage || "",
      precio: evento.precio?.toString() || "",
      tags: evento.tags ? evento.tags.join(", ") : ""
    });
    setEditingEventId(evento.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lugares.length === 0) {
      toast.error("Debes crear al menos un lugar antes de crear un evento");
      return;
    }

    const selectedLugar = lugares.find(lugar => lugar.id === formData.lugarId);
    if (!selectedLugar) {
      toast.error("Selecciona un lugar válido para el evento");
      return;
    }

    const stock = parseInt(formData.stockBoletas, 10);
    if (isNaN(stock) || stock < 1) {
      toast.error("El stock debe ser un número válido mayor o igual a 1");
      return;
    }

    if (stock > selectedLugar.capacidad) {
      toast.error(`El stock de boletas no puede ser mayor que la capacidad del lugar (${selectedLugar.capacidad})`);
      return;
    }

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio < 0) {
      toast.error("El precio debe ser un número válido mayor o igual a 0");
      return;
    }

    const tags = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      const eventoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fecha: new Date(`${formData.fecha}T${formData.hora}`),
        hora: formData.hora,
        lugarId: formData.lugarId,
        estado: formData.estado,
        stockBoletas: stock,
        organizadorId: userId,
        postimage: formData.postimage || "",
        precio: precio,
        tags: tags,
        updatedAt: new Date()
      };

      if (editingEventId) {
        await updateDoc(doc(db, "EVENTOS", editingEventId), eventoData);
        toast.success("Evento actualizado exitosamente");
      } else {
        await addDoc(collection(db, "EVENTOS"), {
          ...eventoData,
          createdAt: new Date()
        });
        toast.success("Evento creado exitosamente");
      }

      resetForm();
      fetchEventos();
    } catch (error) {
      console.error("Error saving evento:", error);
      toast.error(`Error al ${editingEventId ? "actualizar" : "crear"} evento`);
    }
  };

  const selectedLugarCapacidad = lugares.find(lugar => lugar.id === formData.lugarId)?.capacidad;

  return (
    <div className="organizador-section">
      <div className="section-header">
        <h3>{editingEventId ? "Editar Evento" : "Crear Eventos"}</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {eventos.length > 0 && (
        <div className="eventos-list">
          <h4>Eventos creados</h4>
          {eventos.map(evento => {
            const lugar = lugares.find(l => l.id === evento.lugarId);
            return (
              <div key={evento.id} className="evento-card">
                <div className="evento-card-header">
                  <strong>{evento.nombre}</strong>
                  <button type="button" onClick={() => handleEditEvent(evento)} className="edit-btn">Editar</button>
                </div>
                {evento.postimage && (
                  <div className="evento-poster-preview">
                    <img src={evento.postimage} alt={evento.nombre} />
                  </div>
                )}
                <p>{evento.descripcion}</p>
                <p><strong>Lugar:</strong> {lugar ? `${lugar.nombre} - ${lugar.direccion}` : evento.lugarId}</p>
                <p><strong>Stock:</strong> {evento.stockBoletas}</p>
                <p><strong>Estado:</strong> {evento.estado}</p>
              </div>
            );
          })}
        </div>
      )}

      {lugares.length === 0 ? (
        <div className="no-lugares">
          <p>No tienes lugares registrados. Crea un lugar primero para poder crear eventos.</p>
          <button onClick={() => setShowForm(false)} className="create-btn" disabled>
            Crear Evento (Requiere lugar)
          </button>
        </div>
      ) : (
        <>
          <button onClick={() => setShowForm(!showForm)} className="create-btn">
            {showForm ? "Cancelar" : "Crear Nuevo Evento"}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="evento-form">
              <div className="form-group">
                <label>Nombre del Evento:</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Hora:</label>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Lugar:</label>
                <select
                  name="lugarId"
                  value={formData.lugarId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccionar lugar</option>
                  {lugares.map(lugar => (
                    <option key={lugar.id} value={lugar.id}>
                      {lugar.nombre} - {lugar.direccion}
                    </option>
                  ))}
                </select>
                {selectedLugarCapacidad && (
                  <small>Capacidad máxima de boletas: {selectedLugarCapacidad}</small>
                )}
              </div>

              <div className="form-group">
                <label>URL del Poster del Evento:</label>
                <input
                  type="url"
                  name="postimage"
                  value={formData.postimage}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estado:</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock de Boletas:</label>
                  <input
                    type="number"
                    name="stockBoletas"
                    value={formData.stockBoletas}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max={selectedLugarCapacidad || undefined}
                  />
                </div>

                <div className="form-group">
                  <label>Precio de Boleta ($):</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Tags (separados por coma):</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="concierto, rock, festival"
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn">
                {editingEventId ? "Actualizar Evento" : "Crear Evento"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default Eventos;