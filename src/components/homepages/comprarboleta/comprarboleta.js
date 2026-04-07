import React, { useState, useEffect } from "react";
import { db, auth } from "../../../api/api";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import "./comprarboleta.css";

const ComprarBoleta = ({ eventoId, onClose }) => {
  const [user, setUser] = useState(null);
  const [evento, setEvento] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cantidad: 1,
    metodoPagoId: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchEvento();
    fetchMetodosPago();

    return () => unsubscribe();
  }, [eventoId]);

  const fetchEvento = async () => {
    try {
      const eventoDoc = await getDocs(query(collection(db, "EVENTOS"), where("__name__", "==", eventoId)));
      if (!eventoDoc.empty) {
        const eventoData = eventoDoc.docs[0].data();
        setEvento({ id: eventoDoc.docs[0].id, ...eventoData });
      }
    } catch (error) {
      console.error("Error fetching evento:", error);
      toast.error("Error al cargar el evento");
    }
  };

  const fetchMetodosPago = async () => {
    try {
      if (!evento) return;
      const metodosQuery = query(collection(db, "METODOS_PAGOS"), where("organizadorId", "==", evento.organizadorId));
      const metodosSnapshot = await getDocs(metodosQuery);
      const metodosData = metodosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMetodosPago(metodosData);
    } catch (error) {
      console.error("Error fetching metodos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (evento) {
      fetchMetodosPago();
    }
  }, [evento]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularTotal = () => {
    return (evento?.precio || 0) * formData.cantidad;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes iniciar sesión para comprar boletas");
      return;
    }

    if (!formData.metodoPagoId) {
      toast.error("Selecciona un método de pago");
      return;
    }

    const metodoSeleccionado = metodosPago.find(m => m.id === formData.metodoPagoId);
    if (!metodoSeleccionado) {
      toast.error("Método de pago no válido");
      return;
    }

    try {
      await addDoc(collection(db, "SOLICITUDES_BOLETAS"), {
        usuarioId: user.uid,
        eventoId: eventoId,
        cantidad: parseInt(formData.cantidad),
        total: calcularTotal(),
        metodoPago: metodoSeleccionado.nombre,
        metodoPagoId: formData.metodoPagoId,
        estado: "PENDIENTE",
        fecha: new Date(),
        createdAt: new Date()
      });

      toast.success("Solicitud de boleta enviada exitosamente. El organizador revisará tu pago.");
      onClose();
    } catch (error) {
      console.error("Error creating solicitud:", error);
      toast.error("Error al enviar la solicitud");
    }
  };

  if (loading) {
    return (
      <div className="comprar-boleta-modal">
        <div className="modal-content">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="comprar-boleta-modal">
        <div className="modal-content">
          <p>Evento no encontrado</p>
          <button onClick={onClose} className="close-btn">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="comprar-boleta-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Comprar Boleta</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="evento-info">
          <h4>{evento.nombre}</h4>
          <p><strong>Precio por boleta:</strong> ${evento.precio?.toLocaleString() || '0'}</p>
          <p><strong>Stock disponible:</strong> {evento.stockBoletas}</p>
        </div>

        <form onSubmit={handleSubmit} className="compra-form">
          <div className="form-group">
            <label>Cantidad de boletas:</label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleInputChange}
              min="1"
              max={evento.stockBoletas}
              required
            />
          </div>

          <div className="total-section">
            <h4>Total a pagar: ${calcularTotal().toLocaleString()}</h4>
          </div>

          <div className="form-group">
            <label>Método de pago:</label>
            <select
              name="metodoPagoId"
              value={formData.metodoPagoId}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar método</option>
              {metodosPago.map(metodo => (
                <option key={metodo.id} value={metodo.id}>
                  {metodo.nombre} ({metodo.tipo})
                </option>
              ))}
            </select>
          </div>

          {formData.metodoPagoId && (
            <div className="metodo-detalles">
              {(() => {
                const metodo = metodosPago.find(m => m.id === formData.metodoPagoId);
                if (metodo?.tipo === "QR" && metodo.urlQr) {
                  return (
                    <div className="qr-section">
                      <p>Escanea el código QR para realizar el pago:</p>
                      <img src={metodo.urlQr} alt="Código QR" className="qr-code" />
                    </div>
                  );
                } else if (metodo?.tipo === "TRANSFERENCIA") {
                  return (
                    <div className="transferencia-section">
                      <p><strong>Banco:</strong> {metodo.banco}</p>
                      <p><strong>Número de cuenta:</strong> {metodo.numeroCuenta}</p>
                      <p><strong>Titular:</strong> {metodo.titular}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="instrucciones">
            <p><strong>Instrucciones:</strong></p>
            {formData.metodoPagoId ? (
              <div>
                {(() => {
                  const metodo = metodosPago.find(m => m.id === formData.metodoPagoId);
                  return metodo?.descripcion ? (
                    <p>{metodo.descripcion}</p>
                  ) : (
                    <p>Instrucciones no disponibles para este método de pago.</p>
                  );
                })()}
              </div>
            ) : (
              <p>Selecciona un método de pago para ver las instrucciones.</p>
            )}
            <ol>
              <li>Realiza el pago usando el método seleccionado arriba</li>
              <li>Haz clic en "Pagar" para enviar la solicitud</li>
              <li>El organizador revisará tu pago y aprobará las boletas</li>
            </ol>
          </div>

          <button type="submit" className="pagar-btn">
            Pagar ${calcularTotal().toLocaleString()}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComprarBoleta;