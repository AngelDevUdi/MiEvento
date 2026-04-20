import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { db } from "../../../../api/api";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./metodospagos.css";

const MetodosPagos = ({ userId, onClose }) => {
  const [metodos, setMetodos] = useState([]);
  const [activeSection, setActiveSection] = useState("editar");
  const [editingMetodoId, setEditingMetodoId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: "QR",
    nombre: "",
    descripcion: "",
    urlQr: "",
    numeroCuenta: "",
    banco: "",
    titular: ""
  });

  useEffect(() => {
    fetchMetodos();
  }, []);

  const fetchMetodos = async () => {
    try {
      const q = query(collection(db, "METODOS_PAGOS"), where("organizadorId", "==", userId));
      const querySnapshot = await getDocs(q);
      const metodosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMetodos(metodosData);
    } catch (error) {
      console.error("Error fetching metodos:", error);
      toast.error("Error al cargar métodos de pago");
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
      tipo: "QR",
      nombre: "",
      descripcion: "",
      urlQr: "",
      numeroCuenta: "",
      banco: "",
      titular: ""
    });
    setEditingMetodoId(null);
  };

  const handleEditMetodo = (metodo) => {
    setFormData({
      tipo: metodo.tipo || "QR",
      nombre: metodo.nombre || "",
      descripcion: metodo.descripcion || "",
      urlQr: metodo.urlQr || "",
      numeroCuenta: metodo.numeroCuenta || "",
      banco: metodo.banco || "",
      titular: metodo.titular || ""
    });
    setEditingMetodoId(metodo.id);
    setActiveSection("crear");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const metodoData = {
        ...formData,
        organizadorId: userId,
        updatedAt: new Date()
      };

      if (editingMetodoId) {
        await updateDoc(doc(db, "METODOS_PAGOS", editingMetodoId), metodoData);
        toast.success("Método de pago actualizado exitosamente");
      } else {
        await addDoc(collection(db, "METODOS_PAGOS"), {
          ...metodoData,
          createdAt: new Date()
        });
        toast.success("Método de pago creado exitosamente");
      }

      resetForm();
      setActiveSection("editar");
      fetchMetodos();
    } catch (error) {
      console.error("Error saving metodo:", error);
      toast.error(`Error al ${editingMetodoId ? "actualizar" : "crear"} método de pago`);
    }
  };

  return ReactDOM.createPortal(
    <div className="organizador-metodospay-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div className="organizador-metodospay-modal" onClick={(e) => e.stopPropagation()}>
        <button className="organizador-metodospay-close-btn" onClick={onClose}>×</button>
        <h3>Métodos de Pago</h3>
        <div className="organizador-metodospay-section-switch">
          <button
            type="button"
            className={`organizador-metodospay-switch-btn ${activeSection === "editar" ? "organizador-metodospay-active" : ""}`}
            onClick={() => {
              setActiveSection("editar");
              resetForm();
            }}
          >
            Editar métodos
          </button>
          <button
            type="button"
            className={`organizador-metodospay-switch-btn ${activeSection === "crear" ? "organizador-metodospay-active" : ""}`}
            onClick={() => {
              resetForm();
              setActiveSection("crear");
            }}
          >
            Crear método
          </button>
        </div>

        {activeSection === "editar" && metodos.length > 0 && (
          <div className="organizador-metodospay-metodos-list">
            <h4>Métodos registrados</h4>
            {metodos.map(metodo => (
              <div key={metodo.id} className="organizador-metodospay-metodo-card">
                <div className="organizador-metodospay-metodo-card-header">
                  <strong>{metodo.nombre} ({metodo.tipo})</strong>
                  <button type="button" onClick={() => handleEditMetodo(metodo)} className="organizador-metodospay-edit-btn">Editar</button>
                </div>
                <p>{metodo.descripcion}</p>
                {metodo.tipo === "QR" && metodo.urlQr && (
                  <div className="organizador-metodospay-qr-preview">
                    <img src={metodo.urlQr} alt="Código QR" />
                  </div>
                )}
                {metodo.tipo === "TRANSFERENCIA" && (
                  <div className="organizador-metodospay-transferencia-info">
                    <p><strong>Banco:</strong> {metodo.banco}</p>
                    <p><strong>Número de cuenta:</strong> {metodo.numeroCuenta}</p>
                    <p><strong>Titular:</strong> {metodo.titular}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === "crear" && (
          <form onSubmit={handleSubmit} className="organizador-metodospay-metodo-form">
            <div className="organizador-metodospay-form-group">
              <label>Tipo de Método:</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              required
            >
              <option value="QR">Código QR</option>
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
            </select>
          </div>

          <div className="organizador-metodospay-form-group">
            <label>Nombre del Método:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              placeholder="Ej: QR Nequi, Transferencia Bancolombia"
            />
          </div>

          <div className="organizador-metodospay-form-group">
            <label>Descripción:</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows="3"
              placeholder="Instrucciones para el pago"
            />
          </div>

          {formData.tipo === "QR" && (
            <div className="organizador-metodospay-form-group">
              <label>URL del Código QR:</label>
              <input
                type="url"
                name="urlQr"
                value={formData.urlQr}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          )}

          {formData.tipo === "TRANSFERENCIA" && (
            <>
              <div className="organizador-metodospay-form-group">
                <label>Banco:</label>
                <input
                  type="text"
                  name="banco"
                  value={formData.banco}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="organizador-metodospay-form-group">
                <label>Número de Cuenta:</label>
                <input
                  type="text"
                  name="numeroCuenta"
                  value={formData.numeroCuenta}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="organizador-metodospay-form-group">
                <label>Titular de la Cuenta:</label>
                <input
                  type="text"
                  name="titular"
                  value={formData.titular}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="organizador-metodospay-submit-btn">
            {editingMetodoId ? "Actualizar Método" : "Crear Método"}
          </button>
        </form>
      )}
      </div>
    </div>,
    document.body
  );
};

export default MetodosPagos;