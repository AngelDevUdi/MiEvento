import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, query, where, doc, getDoc, getDocs } from "firebase/firestore";
import EventLoading from "../../loading/EventLoading";
import BoletaModal from "./boleta/BoletaModal";
import "./entradas.css";

const Entradas = ({ userId }) => {
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoleta, setSelectedBoleta] = useState(null);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBoletas([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const solicitudesQuery = query(
      collection(db, "SOLICITUDES_BOLETAS"),
      where("usuarioId", "==", userId),
      where("estado", "==", "ACTIVADA")
    );

    let active = true;

    const fetchBoletas = async () => {
      try {
        const snapshot = await getDocs(solicitudesQuery);
        const boletasPromises = snapshot.docs.map(async (solicitudDoc) => {
          const solicitud = solicitudDoc.data();
          const boleteriaRef = doc(db, "BOLETERIA", solicitud.eventoId);
          const eventoRef = doc(db, "EVENTOS", solicitud.eventoId);

          const [boleteriaDoc, eventoDoc] = await Promise.all([
            getDoc(boleteriaRef),
            getDoc(eventoRef),
          ]);

          if (!boleteriaDoc.exists() || !eventoDoc.exists()) {
            return null;
          }

          const boleteriaData = boleteriaDoc.data();
          const boletaUsuario = boleteriaData.boletas?.[solicitudDoc.id];
          if (!boletaUsuario) {
            return null;
          }

          const evento = eventoDoc.data();
          const lugarRef = doc(db, "LUGARES", evento.lugarId);
          const lugarDoc = await getDoc(lugarRef);
          const lugar = lugarDoc.exists() ? lugarDoc.data() : null;

          return {
            id: solicitudDoc.id,
            eventoId: solicitud.eventoId,
            ...boletaUsuario,
            eventoNombre: evento.nombre || "Evento desconocido",
            eventoFecha: evento.fecha?.toDate ? evento.fecha.toDate().toLocaleDateString('es-ES') : evento.fecha || "Sin fecha",
            eventoHora: evento.hora || "",
            lugarNombre: lugar?.nombre || "Lugar desconocido",
            estado: boletaUsuario.estado || solicitud.estado || "ACTIVADA"
          };
        });

        const boletasCompletas = (await Promise.all(boletasPromises)).filter((boleta) => boleta !== null);
        if (active) {
          setBoletas(boletasCompletas);
        }
      } catch (error) {
        console.error("Error fetching boletas:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBoletas();

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return <EventLoading />;
  }

  if (!userId) {
    return <div className="entradas-error">Debes iniciar sesión para ver tus entradas</div>;
  }
  const boletasOrdenadas = [...boletas].sort((a, b) => {
  if (a.estado === "ACTIVADA" && b.estado !== "ACTIVADA") return -1;
  if (a.estado !== "ACTIVADA" && b.estado === "ACTIVADA") return 1;
  return 0;
});

  const boletasFiltradas = showOnlyActive ? boletasOrdenadas.filter(b => b.estado === 'ACTIVADA') : boletasOrdenadas;

  return (
    <div className="entradas-section">
      <h2>Mis Boletas</h2>
      <div className="filter-buttons">
        <button 
          className={`filter-toggle ${showOnlyActive ? 'active' : ''}`}
          onClick={() => setShowOnlyActive(!showOnlyActive)}
        >
          {showOnlyActive ? 'Mostrar Todas' : 'Mostrar Activas'}
        </button>
      </div>
      {boletasFiltradas.length === 0 ? (
        <p>No tienes boletas {showOnlyActive ? 'activas' : ''}.</p>
      ) : (
        <div className="entradas-list">
          {boletasFiltradas.map(boleta => (
            <div key={boleta.id} className="entrada-card">
              <div className="boleta-header">
                <h3>{boleta.eventoNombre}</h3>
              </div>
              <div className="boleta-info">
                <p><strong>📅 Fecha:</strong> {boleta.eventoFecha} {boleta.eventoHora}</p>
                <p><strong>📍 Lugar:</strong> {boleta.lugarNombre}</p>
                <p><strong>� Cantidad:</strong> {boleta.cantidad} {boleta.cantidad === 1 ? 'persona' : 'personas'}</p>
                <p><strong>💰 Precio unitario:</strong> ${boleta.precioUnitario?.toLocaleString() || '0'}</p>
                <p><strong>💰 Precio total:</strong> ${boleta.precioTotal?.toLocaleString() || '0'}</p>
                <p><strong>📊 Estado:</strong> <span className="estado-activa">{boleta.estado}</span></p>
              </div>
              <div className="boleta-qr">
                <button onClick={() => setSelectedBoleta(boleta)}>Ver Boleta</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <BoletaModal 
        isOpen={!!selectedBoleta} 
        onClose={() => setSelectedBoleta(null)} 
        boleta={selectedBoleta} 
        usuarioId={userId} 
      />
    </div>
  );
};

export default Entradas;