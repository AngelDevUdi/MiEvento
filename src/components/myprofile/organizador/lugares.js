import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./lugares.css";

const Lugares = ({ userId, onClose, initialShowForm = false }) => {
  const [lugares, setLugares] = useState([]);
  const [showForm, setShowForm] = useState(initialShowForm);
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
  const [activeSection, setActiveSection] = useState("editar");

  useEffect(() => {
    fetchLugares();
  }, []);

  const formatNumberWithDots = (value) => {
    const digits = String(value).replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumberValue = (value) => {
    const cleaned = String(value).replace(/\./g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

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

    if (name === "capacidad" || name === "precioDisponible") {
      const formattedValue = formatNumberWithDots(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }

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
      capacidad: formatNumberWithDots(lugar.capacidad?.toString() || ""),
      precioDisponible: formatNumberWithDots(lugar.precioDisponible?.toString() || ""),
      descripcion: lugar.descripcion || "",
      serviciosIncluidos: servicios,
      fotos: lugar.fotos || [],
      disponiblePublico: lugar.disponiblePublico || false
    });
    setEditingLugarId(lugar.id);
    setActiveSection("crear");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const lugarData = {
        ...formData,
        organizadorId: userId,
        capacidad: parseNumberValue(formData.capacidad),
        precioDisponible: parseNumberValue(formData.precioDisponible),
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
    <>
      {showForm && (
        <div className="overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            resetLugarForm();
            setActiveSection("editar");
            onClose();
          }
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gestión de lugares</h3>
              <button type="button" onClick={() => {
                resetLugarForm();
                setActiveSection("editar");
                onClose();
              }} className="close-modal-btn">×</button>
            </div>
            <div className="section-switch">
              <button
                type="button"
                className={`switch-btn ${activeSection === "editar" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("editar");
                  setEditingLugarId(null);
                  resetLugarForm();
                }}
              >
                Editar lugares
              </button>
              <button
                type="button"
                className={`switch-btn ${activeSection === "crear" ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("crear");
                  setEditingLugarId(null);
                  resetLugarForm();
                }}
              >
                Crear lugar
              </button>
            </div>
            {activeSection === "crear" && (
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
                      type="text"
                      name="capacidad"
                      value={formData.capacidad}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Precio Disponible ($):</label>
                    <input
                      type="text"
                      name="precioDisponible"
                      value={formData.precioDisponible}
                      onChange={handleInputChange}
                      required
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
                    setActiveSection("editar");
                  }}>
                    Cancelar edición
                  </button>
                )}
              </form>
            )}

            {activeSection === "editar" && (
              <div className="lugares-list">
                {lugares.map(lugar => (
                  <div key={lugar.id} className="lugar-card">
                    {lugar.fotos && lugar.fotos.length > 0 && (
                      <div className="image-slider">
                        {lugar.fotos.map((foto, index) => (
                          <div key={index} className="image-slide">
                            <img src={foto} alt={`Lugar ${lugar.nombre} imagen ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                    <h4>{lugar.nombre}</h4>
                    <p className="lugar-address"><strong>Dirección:</strong> {lugar.direccion}</p>
                    {lugar.descripcion && <p className="lugar-description">{lugar.descripcion}</p>}
                    <p><strong>Capacidad:</strong> {Number(lugar.capacidad || 0).toLocaleString('es-ES')} personas</p>
                    <p><strong>Precio:</strong> ${Number(lugar.precioDisponible || 0).toLocaleString('es-ES')}</p>
                    <p><strong>Disponible:</strong> {lugar.disponiblePublico ? "Sí" : "No"}</p>
                    {lugar.serviciosIncluidos && lugar.serviciosIncluidos.length > 0 && (
                      <div className="servicios-list-card">
                        <p><strong>Servicios:</strong></p>
                        <ul>
                          {lugar.serviciosIncluidos.map((servicio, index) => (
                            <li key={index} className="servicio-item">
                              {servicio.nombre || servicio} - ${Number(servicio.precio || 0).toFixed(2)} {servicio.adicional ? "(adicional)" : "(incluido)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="lugar-actions">
                      <button
                        onClick={() => toggleDisponible(lugar.id, lugar.disponiblePublico)}
                        className={`toggle-btn-publico ${lugar.disponiblePublico ? "toggle-btn-publico" : ""}`}
                      >
                        {lugar.disponiblePublico ? "Ocultar" : "Mostrar"} al público
                      </button>
                      <button onClick={() => handleEditLugar(lugar)} className="edit-btn">Editar</button>
                      <button onClick={() => deleteLugar(lugar.id)} className="delete-btn">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Lugares;