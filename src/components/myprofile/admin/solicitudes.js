import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { db } from "../../../api/api";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  deleteField,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./solicitudes.css";

const Solicitudes = ({ onClose }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchId, setSearchId] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [duracion, setDuracion] = useState({ años: 0, meses: 0, días: 0 });
  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "SOLICITUDES"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSolicitudes(data);
        setFiltered(data);
      } catch (error) {
        toast.error("Error al cargar solicitudes");
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  // 🔎 BUSCADOR
  useEffect(() => {
    const result = solicitudes.filter((s) =>
      s.name?.toLowerCase().includes(searchId.toLowerCase())
    );
    setFiltered(result);
  }, [searchId, solicitudes]);

  const calcularMeses = (inicio, fin) => {
    if (!inicio || !fin) return { años: 0, meses: 0, días: 0 };
    
    const start = new Date(inicio);
    const end = new Date(fin);
    
    let años = 0;
    let meses = 0;
    let días = 0;
    
    // Calcular días totales
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Convertir a años, meses y días
    años = Math.floor(diffDays / 365);
    let diasRestantes = diffDays % 365;
    meses = Math.floor(diasRestantes / 30);
    días = diasRestantes % 30;
    
    return { años, meses, días };
  };

  const handleDateChange = (type, value) => {
    if (type === "inicio") {
      setFechaInicio(value);
      const calculated = calcularMeses(value, fechaFin);
      setDuracion(calculated);
    } else if (type === "fin") {
      setFechaFin(value);
      const calculated = calcularMeses(fechaInicio, value);
      setDuracion(calculated);
    }
  };

  const handleApprove = async (solicitudId, userEmail) => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Por favor selecciona fechas de inicio y fin");
      return;
    }

    try {
      const q = query(
        collection(db, "USUARIOS"),
        where("email", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "USUARIOS", userDoc.id), {
          rol: "ORGANIZADOR",
          fechaInicioOrganizador: fechaInicio,
          fechaFinalOrganizador: fechaFin,
          solicitud: deleteField(),
        });
      }

      await deleteDoc(doc(db, "SOLICITUDES", solicitudId));

      setSolicitudes(solicitudes.filter((s) => s.id !== solicitudId));
      setSelected(null);
      setFechaInicio("");
      setFechaFin("");
      setDuracion({ años: 0, meses: 0, días: 0 });

      toast.success("Solicitud aprobada");
    } catch {
      toast.error("Error al aprobar");
    }
  };

  const handleReject = async (solicitudId) => {
    try {
      // Encontrar el usuario para eliminar el campo solicitud
      const solicitud = solicitudes.find(s => s.id === solicitudId);
      if (solicitud) {
        const q = query(
          collection(db, "USUARIOS"),
          where("email", "==", solicitud.email)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, "USUARIOS", userDoc.id), {
            solicitud: deleteField(),
          });
        }
      }

      await deleteDoc(doc(db, "SOLICITUDES", solicitudId));
      setSolicitudes(solicitudes.filter((s) => s.id !== solicitudId));
      setSelected(null);
      toast.success("Solicitud rechazada");
    } catch {
      toast.error("Error al rechazar");
    }
  };

  if (loading) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      className="soladm-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="soladm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="soladm-close-btn" onClick={onClose}>×</button>

        {/* IZQUIERDA */}
        <div className="soladm-left">
          <h3 className="soladm-subtitle">Buscar por nombre</h3>

          <input
            className="soladm-input"
            placeholder="Escribe el nombre..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />

          <div className="soladm-results">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`soladm-result-item ${
                  selected?.id === s.id ? "active" : ""
                }`}
                onClick={() => {
                  setSelected(s);
                  setFechaInicio("");
                  setFechaFin("");
                  setDuracion({ años: 0, meses: 0, días: 0 });
                }}
              >
                {s.name || s.solicitudId}
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA */}
        <div className="soladm-right">
          {!selected ? (
            <div className="soladm-empty">
              Selecciona una solicitud
            </div>
          ) : (
            <div className="soladm-detail">
              <h2>{selected.name}</h2>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>ID Solicitud:</strong> {selected.solicitudId}</p>
              <p><strong>Rol Solicitado:</strong> {selected.rolSolicitado}</p>
              <p><strong>Estado:</strong> {selected.status}</p>
              <p><strong>ID Usuario:</strong> {selected.userId}</p>
              <p>
                <strong>Fecha Solicitud:</strong>{" "}
                {new Date(selected.createdAt?.toDate()).toLocaleDateString()}
              </p>

              <div className="soladm-dates">
                <div className="soladm-date-group">
                  <label><strong>Fecha Inicio:</strong></label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => handleDateChange("inicio", e.target.value)}
                    className="soladm-date-input"
                  />
                </div>
                <div className="soladm-date-group">
                  <label><strong>Fecha Fin:</strong></label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => handleDateChange("fin", e.target.value)}
                    className="soladm-date-input"
                  />
                </div>
              </div>
              <p className="soladm-months"><strong>Duración de membresía:</strong> {duracion.años} {duracion.años === 1 ? 'año' : 'años'}, {duracion.meses} {duracion.meses === 1 ? 'mes' : 'meses'}, {duracion.días} {duracion.días === 1 ? 'día' : 'días'}</p>

              <div className="soladm-actions">
                <button
                  className="soladm-btn soladm-reject"
                  onClick={() => handleReject(selected.id)}
                >
                  Rechazar
                </button>

                <button
                  className="soladm-btn soladm-approve"
                  onClick={() =>
                    handleApprove(selected.id, selected.email)
                  }
                >
                  Aprobar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default Solicitudes;