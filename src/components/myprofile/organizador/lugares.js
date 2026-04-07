import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./organizador.css";

const Lugares = ({ userId, onClose }) => {
  const [lugares, setLugares] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLugarId, setEditingLugarId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    urlMaps: "",
    capacidad: "",
    precioDisponible: "",
    descripcion: "",
    serviciosIncluidos: [],
    fotos: [],
    disponiblePublico: false
  });
  const [servicioNombre, setServicioNombre] = useState("");
  const [servicioPrecio, setServicioPrecio] = useState("");
  const [servicioAdicional, setServicioAdicional] = useState(false);
  const [fotoInput, setFotoInput] = useState("");

  useEffect(() => {
    fetchLugares();
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const addServicio = () => {
    if (servicioNombre.trim()) {
      setFormData(prev => ({
        ...prev,
        serviciosIncluidos: [
          ...prev.serviciosIncluidos,
          {
            nombre: servicioNombre.trim(),
            precio: servicioPrecio ? parseFloat(servicioPrecio) : 0,
            adicional: servicioAdicional
          }
        ]
      }));
      setServicioNombre("");
      setServicioPrecio("");
      setServicioAdicional(false);
    }
  };

  const removeServicio = (index) => {
    setFormData(prev => ({
      ...prev,
      serviciosIncluidos: prev.serviciosIncluidos.filter((_, i) => i !== index)
    }));
  };

  const addFoto = () => {
    const url = fotoInput.trim();
    if (url) {
      setFormData(prev => ({
        ...prev,
        fotos: [...prev.fotos, url]
      }));
      setFotoInput("");
    }
  };

  const removeFoto = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const resetLugarForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      urlMaps: "",
      capacidad: "",
      precioDisponible: "",
      descripcion: "",
      serviciosIncluidos: [],
      fotos: [],
      disponiblePublico: false
    });
    setEditingLugarId(null);
    setServicioNombre("");
    setServicioPrecio("");
    setServicioAdicional(false);
    setFotoInput("");
  };

  const handleEditLugar = (lugar) => {
    const servicios = (lugar.serviciosIncluidos || []).map(servicio => {
      return typeof servicio === "string"
        ? { nombre: servicio, precio: 0, adicional: false }
        : {
            nombre: servicio.nombre || "",
            precio: servicio.precio ?? 0,
            adicional: servicio.adicional || false
          };
    });

    setFormData({
      nombre: lugar.nombre || "",
      direccion: lugar.direccion || "",
      urlMaps: lugar.urlMaps || "",
      capacidad: lugar.capacidad?.toString() || "",
      precioDisponible: lugar.precioDisponible?.toString() || "",
      descripcion: lugar.descripcion || "",
      serviciosIncluidos: servicios,
      fotos: lugar.fotos || [],
      disponiblePublico: lugar.disponiblePublico || false
    });
    setEditingLugarId(lugar.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const lugarData = {
        ...formData,
        organizadorId: userId,
        capacidad: parseInt(formData.capacidad, 10),
        precioDisponible: parseFloat(formData.precioDisponible),
        serviciosIncluidos: formData.serviciosIncluidos,
        fotos: formData.fotos,
        disponiblePublico: formData.disponiblePublico
      };

      if (editingLugarId) {
        await updateDoc(doc(db, "LUGARES", editingLugarId), {
          ...lugarData,
          updatedAt: new Date()
        });
        toast.success("Lugar actualizado exitosamente");
      } else {
        await addDoc(collection(db, "LUGARES"), {
          ...lugarData,
          createdAt: new Date()
        });
        toast.success("Lugar creado exitosamente");
      }

      resetLugarForm();
      setShowForm(false);
      fetchLugares();
    } catch (error) {
      console.error("Error saving lugar:", error);
      toast.error(`Error al ${editingLugarId ? "actualizar" : "crear"} lugar`);
    }
  };

  const toggleDisponible = async (lugarId, currentStatus) => {
    try {
      await updateDoc(doc(db, "LUGARES", lugarId), {
        disponiblePublico: !currentStatus
      });
      toast.success("Estado actualizado");
      fetchLugares();
    } catch (error) {
      console.error("Error updating lugar:", error);
      toast.error("Error al actualizar lugar");
    }
  };

  const deleteLugar = async (lugarId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este lugar?")) {
      try {
        await deleteDoc(doc(db, "LUGARES", lugarId));
        toast.success("Lugar eliminado");
        fetchLugares();
      } catch (error) {
        console.error("Error deleting lugar:", error);
        toast.error("Error al eliminar lugar");
      }
    }
  };

  return (
    <div className="organizador-section">
      <div className="section-header">
        <h3>Gestionar Lugares</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <button onClick={() => {
        if (showForm && editingLugarId) {
          resetLugarForm();
        }
        setShowForm(!showForm);
      }} className="create-btn">
        {showForm ? "Cancelar" : editingLugarId ? "Editar Lugar" : "Crear Nuevo Lugar"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="lugar-form">
          <div className="form-group">
            <label>Nombre del Lugar:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Dirección:</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>URL de Maps (opcional):</label>
            <input
              type="url"
              name="urlMaps"
              value={formData.urlMaps}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Capacidad:</label>
              <input
                type="number"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Precio Disponible ($):</label>
              <input
                type="number"
                name="precioDisponible"
                value={formData.precioDisponible}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción:</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Servicios:</label>
            <div className="servicios-input">
              <input
                type="text"
                value={servicioNombre}
                onChange={(e) => setServicioNombre(e.target.value)}
                placeholder="Nombre del servicio"
              />
              <input
                type="number"
                value={servicioPrecio}
                onChange={(e) => setServicioPrecio(e.target.value)}
                placeholder="Precio"
                min="0"
                step="0.01"
              />
              <label className="servicio-checkbox">
                <input
                  type="checkbox"
                  checked={servicioAdicional}
                  onChange={(e) => setServicioAdicional(e.target.checked)}
                />
                Costo adicional
              </label>
              <button type="button" onClick={addServicio} className="add-servicio-btn">+</button>
            </div>
            <div className="servicios-list">
              {formData.serviciosIncluidos.map((servicio, index) => (
                <span key={index} className="servicio-tag">
                  {servicio.nombre} - ${servicio.precio.toFixed(2)} {servicio.adicional ? "(adicional)" : "(incluido)"}
                  <button type="button" onClick={() => removeServicio(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Fotos del lugar (URLs):</label>
            <div className="servicios-input">
              <input
                type="url"
                value={fotoInput}
                onChange={(e) => setFotoInput(e.target.value)}
                placeholder="Agregar URL de foto"
              />
              <button type="button" onClick={addFoto} className="add-servicio-btn">+</button>
            </div>
            <div className="fotos-list">
              {formData.fotos.map((foto, index) => (
                <span key={index} className="servicio-tag">
                  <a href={foto} target="_blank" rel="noreferrer">Foto {index + 1}</a>
                  <button type="button" onClick={() => removeFoto(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="disponiblePublico"
                checked={formData.disponiblePublico}
                onChange={handleInputChange}
              />
              Disponible al público
            </label>
          </div>

          <button type="submit" className="submit-btn">{editingLugarId ? "Actualizar Lugar" : "Crear Lugar"}</button>
          {editingLugarId && (
            <button type="button" className="cancel-btn" onClick={() => {
              resetLugarForm();
              setShowForm(false);
            }}>
              Cancelar edición
            </button>
          )}
        </form>
      )}

      <div className="lugares-list">
        {lugares.map(lugar => (
          <div key={lugar.id} className="lugar-card">
            <h4>{lugar.nombre}</h4>
            <button onClick={() => toggleDisponible(lugar.id, lugar.disponiblePublico)} className="toggle-btn">
              {lugar.disponiblePublico ? "Ocultar" : "Mostrar"} al público
            </button>
            <p><strong>Dirección:</strong> {lugar.direccion}</p>
            <p><strong>Capacidad:</strong> {lugar.capacidad} personas</p>
            <p><strong>Precio:</strong> ${lugar.precioDisponible}</p>
            <p><strong>Disponible:</strong> {lugar.disponiblePublico ? "Sí" : "No"}</p>
            {lugar.descripcion && <p><strong>Descripción:</strong> {lugar.descripcion}</p>}
            {lugar.serviciosIncluidos && lugar.serviciosIncluidos.length > 0 && (
              <div>
                <p><strong>Servicios:</strong></p>
                <ul>
                  {lugar.serviciosIncluidos.map((servicio, index) => (
                    <li key={index}>
                      {servicio.nombre || servicio} - ${Number(servicio.precio || 0).toFixed(2)} {servicio.adicional ? "(adicional)" : "(incluido)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lugar.fotos && lugar.fotos.length > 0 && (
              <div>
                <p><strong>Fotos:</strong></p>
                <ul>
                  {lugar.fotos.map((foto, index) => (
                    <li key={index}>
                      <a href={foto} target="_blank" rel="noreferrer">Foto {index + 1}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="lugar-actions">
              <button onClick={() => handleEditLugar(lugar)} className="edit-btn">Editar</button>
              <button onClick={() => deleteLugar(lugar.id)} className="delete-btn">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lugares;