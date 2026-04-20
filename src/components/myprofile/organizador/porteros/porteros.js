import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { db, auth } from "../../../../api/api";
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import EventLoading from "../../../loading/EventLoading";
import "./porteros.css";

const Porteros = ({ userId, onClose }) => {
  const [porteros, setPorteros] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPorteroId, setEditingPorteroId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    establecimientoId: ""
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const lugaresData = await fetchLugares();
        setLugares(lugaresData);
        if (lugaresData.length > 0) {
          await fetchPorteros(lugaresData);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchLugares = async () => {
    try {
      const q = query(collection(db, "LUGARES"), where("organizadorId", "==", userId));
      const querySnapshot = await getDocs(q);
      const lugaresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLugares(lugaresData);
      return lugaresData;
    } catch (error) {
      console.error("Error fetching lugares:", error);
      toast.error("Error al cargar lugares");
      return [];
    }
  };

  const fetchPorteros = async (lugaresParam) => {
    try {
      // Obtener todos los porteros de los lugares del organizador
      const porterosPromises = lugaresParam.map(async (lugar) => {
        const q = query(collection(db, "USUARIOS"), where("rol", "==", "PORTERO"), where("establecimientoId", "==", lugar.id));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), lugarNombre: lugar.nombre }));
      });

      const porterosArrays = await Promise.all(porterosPromises);
      const allPorteros = porterosArrays.flat();
      setPorteros(allPorteros);
    } catch (error) {
      console.error("Error fetching porteros:", error);
      toast.error("Error al cargar porteros");
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
      name: "",
      email: "",
      establecimientoId: ""
    });
    setEditingPorteroId(null);
    setShowForm(false);
  };

  const handleEditPortero = (portero) => {
    setFormData({
      name: portero.name || "",
      email: portero.email || "",
      establecimientoId: portero.establecimientoId || ""
    });
    setEditingPorteroId(portero.id);
    setShowForm(true);
  };

  const handleDeletePortero = async (porteroId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este portero?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "USUARIOS", porteroId));
      toast.success("Portero eliminado exitosamente");
      fetchPorteros(lugares);
    } catch (error) {
      console.error("Error deleting portero:", error);
      toast.error("Error al eliminar portero");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.establecimientoId) {
      toast.error("Selecciona un establecimiento para el portero");
      return;
    }

    try {
      // Generar contraseña: parte del email antes del @
      const password = formData.email.split('@')[0];

      // Crear cuenta de autenticación
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password);
      const uid = userCredential.user.uid;

      // Guardar datos del portero en Firestore
      const porteroData = {
        uid: uid,
        name: formData.name,
        email: formData.email,
        rol: "PORTERO",
        establecimientoId: formData.establecimientoId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingPorteroId) {
        await updateDoc(doc(db, "USUARIOS", editingPorteroId), porteroData);
        toast.success("Portero actualizado exitosamente");
      } else {
        await setDoc(doc(db, "USUARIOS", uid), porteroData);
        toast.success(`Portero creado exitosamente. Credenciales: Email: ${formData.email}, Contraseña: ${password}`);
      }

      resetForm();
      fetchPorteros(lugares);
    } catch (error) {
      console.error("Error saving portero:", error);
      
      // Manejar errores específicos de autenticación
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Este email ya está registrado en el sistema");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("El email no tiene un formato válido");
      } else if (error.code === 'auth/weak-password') {
        toast.error("La contraseña generada es muy débil");
      } else {
        toast.error(`Error al ${editingPorteroId ? "actualizar" : "crear"} portero: ${error.message}`);
      }
    }
  };

  if (isLoading) {
    return ReactDOM.createPortal(
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <h3>Solicitudes de Boletas</h3>
          <EventLoading text="Cargando solicitudes de boletas..." />
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="portero-componente-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="portero-componente-modal" onClick={(e) => e.stopPropagation()}>
        <button className="portero-componente-close-btn" onClick={onClose}>×</button>
        <h3>Gestión de Porteros</h3>

        {porteros.length > 0 && !showForm && (
          <div className="portero-componente-porteros-list">
            <h3>Porteros registrados</h3>
            {porteros.map(portero => (
              <div key={portero.id} className="portero-componente-portero-card">
                <div className="portero-componente-portero-card-header">
                  <strong>{portero.name}</strong>
                  <div className="portero-componente-portero-actions">
                    <button type="button" onClick={() => handleEditPortero(portero)} className="portero-componente-edit-btn">Editar</button>
                    <button type="button" onClick={() => handleDeletePortero(portero.id)} className="portero-componente-delete-btn">Eliminar</button>
                  </div>
                </div>
                <p><strong>Email:</strong> {portero.email}</p>
                <p><strong>Establecimiento:</strong> {portero.lugarNombre}</p>
                <p><strong>Rol:</strong> {portero.rol}</p>
              </div>
            ))}
          </div>
        )}

        {lugares.length === 0 ? (
          <div className="portero-componente-no-lugares">
            <p>No tienes lugares registrados. Crea un lugar primero para poder asignar porteros.</p>
          </div>
        ) : (
          <>
            <button onClick={() => setShowForm(!showForm)} className="portero-componente-create-btn">
              {showForm ? "Cancelar" : "Agregar Portero"}
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="portero-componente-portero-form">
                <div className="portero-componente-form-group">
                  <label>Nombre del Portero:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="portero-componente-form-group">
                  <label>Email del Portero:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="portero-componente-form-group">
                  <label>Establecimiento:</label>
                  <select
                    name="establecimientoId"
                    value={formData.establecimientoId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar establecimiento</option>
                    {lugares.map(lugar => (
                      <option key={lugar.id} value={lugar.id}>
                        {lugar.nombre} - {lugar.direccion}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="portero-componente-submit-btn">
                  {editingPorteroId ? "Actualizar Portero" : "Crear Portero"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Porteros;
