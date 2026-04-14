import React, { useState, useEffect } from "react";
import { db, auth } from "../../../api/api";
import { collection, getDocs, query, where, addDoc, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import EventLoading from "../../loading/EventLoading";
import "./reservarlugar.css";

const ReservarLugar = ({ lugarId, onClose }) => {
  const [user, setUser] = useState(null);
  const [lugar, setLugar] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lugarLoading, setLugarLoading] = useState(true);
  const [selectedServicios, setSelectedServicios] = useState([]);
  const [formData, setFormData] = useState({
    diaReserva: "",
    metodoPagoId: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchLugar();

    return () => unsubscribe();
  }, [lugarId]);

  const fetchLugar = async () => {
    try {
      const lugarRef = doc(db, "LUGARES", lugarId);
      const lugarDoc = await getDoc(lugarRef);
      if (lugarDoc.exists()) {
        setLugar({ id: lugarDoc.id, ...lugarDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching lugar:", error);
      toast.error("Error al cargar el lugar");
    } finally {
      setLugarLoading(false);
      setLoading(false);
    }
  };

  const fetchMetodosPago = async () => {
    try {
      if (!lugar) return;
      const metodosQuery = query(collection(db, "METODOS_PAGOS"), where("organizadorId", "==", lugar.organizadorId));
      const metodosSnapshot = await getDocs(metodosQuery);
      const metodosData = metodosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMetodosPago(metodosData);
    } catch (error) {
      console.error("Error fetching metodos:", error);
    }
  };

  useEffect(() => {
    if (lugar) {
      fetchMetodosPago();
    }
  }, [lugar]);

  const servicios = (lugar?.serviciosIncluidos || []).map(servicio => {
    if (typeof servicio === "string") {
      return { nombre: servicio, precio: 0, adicional: false };
    }
    return {
      nombre: servicio.nombre || "Servicio",
      precio: servicio.precio ?? 0,
      adicional: servicio.adicional || false
    };
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServicioToggle = (index) => {
    setSelectedServicios(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const calcularTotal = () => {
    const basePrice = Number(lugar?.precioDisponible || 0);
    const serviciosExtras = selectedServicios.reduce((sum, index) => {
      const servicio = servicios[index];
      if (!servicio) return sum;
      return servicio.adicional && Number(servicio.precio) > 0
        ? sum + Number(servicio.precio)
        : sum;
    }, 0);
    return basePrice + serviciosExtras;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes iniciar sesión para hacer reservas");
      return;
    }

    if (!formData.diaReserva) {
      toast.error("Selecciona una fecha para la reserva");
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
      const serviciosSeleccionados = selectedServicios
        .map(index => servicios[index])
        .filter(Boolean)
        .map(servicio => ({
          nombre: servicio.nombre,
          precio: Number(servicio.precio || 0),
          adicional: Boolean(servicio.adicional)
        }));

      await addDoc(collection(db, "RESERVAS"), {
        usuarioId: user.uid,
        usuarioEmail: user.email || "",
        lugarId: lugar.id,
        lugarNombre: lugar.nombre,
        direccion: lugar.direccion || "",
        capacidad: lugar.capacidad || 0,
        precioBase: Number(lugar.precioDisponible || 0),
        servicios: serviciosSeleccionados,
        total: calcularTotal(),
        diaReserva: formData.diaReserva,
        metodoPago: metodoSeleccionado.nombre,
        metodoPagoId: formData.metodoPagoId,
        estado: "PENDIENTE",
        fechaReserva: new Date(),
        createdAt: new Date(),
        organizadorId: lugar.organizadorId || ""
      });

      toast.success("Solicitud de reserva enviada exitosamente. El organizador revisará tu pago.");
      onClose();
    } catch (error) {
      console.error("Error creating reserva:", error);
      toast.error("Error al enviar la reserva");
    }
  };

  if (lugarLoading || loading) {
    return <EventLoading text="Cargando formulario de reserva..." />;
  }

  if (!lugar) {
    return (
      <div className="reservar-lugar-modal">
        <div className="modal-content">
          <p>Lugar no encontrado</p>
          <button onClick={onClose} className="close-btn">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reservar-lugar-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Reservar Lugar</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="evento-info">
          <h4>{lugar.nombre}</h4>
          <p><strong>Dirección:</strong> {lugar.direccion}</p>
          <p><strong>Capacidad:</strong> {Number(lugar.capacidad || 0).toLocaleString('es-ES')} personas</p>
          <p><strong>Precio base:</strong> ${Number(lugar.precioDisponible || 0).toLocaleString('es-ES')}</p>
        </div>

        <form onSubmit={handleSubmit} className="reserva-form">
          <div className="form-group">
            <label>Día de la reservación:</label>
            <input
              type="date"
              name="diaReserva"
              value={formData.diaReserva}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Servicios</label>
            <div className="servicios-list">
              {servicios.length > 0 ? (
                servicios.map((servicio, index) => (
                  <label key={index} className="service-checkbox">
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedServicios.includes(index)}
                        onChange={() => handleServicioToggle(index)}
                      />
                      <span>{servicio.nombre || "Servicio"} {servicio.adicional ? "(adicional)" : "(incluido)"}</span>
                    </div>
                    <span className="service-price">
                      {Number(servicio.precio) > 0 ? `+ $${Number(servicio.precio).toLocaleString('es-ES')}` : "Gratis"}
                    </span>
                  </label>
                ))
              ) : (
                <p>No hay servicios disponibles para este lugar.</p>
              )}
            </div>
            <p className="service-note">Los servicios sin precio no se suman al total. Solo los servicios adicionales con precio se añaden al total.</p>
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
              <li>Haz clic en "Reservar y Pagar" para enviar la reserva</li>
              <li>El organizador revisará tu pago y confirmará la reserva</li>
            </ol>
          </div>

          <button type="submit" className="pagar-btn">
            Reservar y pagar ${calcularTotal().toLocaleString()}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservarLugar;
