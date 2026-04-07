import React, { useState, useEffect } from "react";
import { db } from "../../../../api/api";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./metodospagos.css";

const MetodosPagos = ({ userId, onClose }) => {
  const [metodos, setMetodos] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
    setShowForm(false);
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
    setShowForm(true);
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
      fetchMetodos();
    } catch (error) {
      console.error("Error saving metodo:", error);
      toast.error(`Error al ${editingMetodoId ? "actualizar" : "crear"} método de pago`);
    }
  };

  return (
    <div className="organizador-section">
      <div className="section-header">
        <h3>Métodos de Pago</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      {metodos.length > 0 && (
        <div className="metodos-list">
          <h4>Métodos registrados</h4>
          {metodos.map(metodo => (
            <div key={metodo.id} className="metodo-card">
              <div className="metodo-card-header">
                <strong>{metodo.nombre} ({metodo.tipo})</strong>
                <button type="button" onClick={() => handleEditMetodo(metodo)} className="edit-btn">Editar</button>
              </div>
              <p>{metodo.descripcion}</p>
              {metodo.tipo === "QR" && metodo.urlQr && (
                <div className="qr-preview">
                  <img src={metodo.urlQr} alt="Código QR" />
                </div>
              )}
              {metodo.tipo === "TRANSFERENCIA" && (
                <div className="transferencia-info">
                  <p><strong>Banco:</strong> {metodo.banco}</p>
                  <p><strong>Número de cuenta:</strong> {metodo.numeroCuenta}</p>
                  <p><strong>Titular:</strong> {metodo.titular}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowForm(!showForm)} className="create-btn">
        {showForm ? "Cancelar" : "Agregar Método de Pago"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="metodo-form">
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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
            <div className="form-group">
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
              <div className="form-group">
                <label>Banco:</label>
                <input
                  type="text"
                  name="banco"
                  value={formData.banco}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Número de Cuenta:</label>
                <input
                  type="text"
                  name="numeroCuenta"
                  value={formData.numeroCuenta}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
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

          <button type="submit" className="submit-btn">
            {editingMetodoId ? "Actualizar Método" : "Crear Método"}
          </button>
        </form>
      )}
    </div>
  );
};

export default MetodosPagos;