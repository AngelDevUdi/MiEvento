import React, { useState, useEffect } from "react";
import { db } from "../../../api/api";
import { collection, query, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import BoletaModal from "./boleta/BoletaModal";
import "./entradas.css";

const Entradas = ({ userId }) => {
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoleta, setSelectedBoleta] = useState(null);
  const [boleteriaUnsubscribers, setBoleteriaUnsubscribers] = useState(new Map());
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBoletas([]);
      setLoading(false);
      boleteriaUnsubscribers.forEach(unsub => unsub());
      setBoleteriaUnsubscribers(new Map());
      return;
    }

    setLoading(true);

    const solicitudesQuery = query(
      collection(db, "SOLICITUDES_BOLETAS"),
      where("usuarioId", "==", userId),
      where("estado", "==", "ACTIVADA")
    );
    

    const unsubscribe = onSnapshot(
      solicitudesQuery,
      async (snapshot) => {
        try {
          const boletasPromises = snapshot.docs.map(async (solicitudDoc) => {
            const solicitud = solicitudDoc.data();
            const boleteriaRef = doc(db, "BOLETERIA", solicitud.eventoId);
            const boleteriaDoc = await getDoc(boleteriaRef);

            if (!boleteriaDoc.exists()) {
              return null;
            }

            const boleteriaData = boleteriaDoc.data();
            const boletaUsuario = boleteriaData.boletas?.[solicitudDoc.id];
            if (!boletaUsuario) {
              return null;
            }

            const eventoRef = doc(db, "EVENTOS", solicitud.eventoId);
            const eventoDoc = await getDoc(eventoRef);
            if (!eventoDoc.exists()) {
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
          setBoletas(boletasCompletas);

          // Limpiar listeners anteriores
          boleteriaUnsubscribers.forEach(unsub => unsub());
          setBoleteriaUnsubscribers(new Map());

          // Agregar listeners para cada boleteria única
          const newUnsubscribers = new Map();
          const eventoIds = [...new Set(boletasCompletas.map(b => b.eventoId))];
          eventoIds.forEach(eventoId => {
            const boleteriaRef = doc(db, "BOLETERIA", eventoId);
            const unsub = onSnapshot(boleteriaRef, (boleteriaDoc) => {
              if (boleteriaDoc.exists()) {
                const boleteriaData = boleteriaDoc.data();
                setBoletas(prevBoletas =>
                  prevBoletas.map(boleta => {
                    if (boleta.eventoId === eventoId && boleteriaData.boletas?.[boleta.id]) {
                      const updatedBoleta = boleteriaData.boletas[boleta.id];
                      return {
                        ...boleta,
                        ...updatedBoleta,
                        estado: updatedBoleta.estado
                      };
                    }
                    return boleta;
                  })
                );
              }
            });
            newUnsubscribers.set(eventoId, unsub);
          });
          setBoleteriaUnsubscribers(newUnsubscribers);
        } catch (error) {
          console.error("Error fetching boletas:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening boletas en tiempo real:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      boleteriaUnsubscribers.forEach(unsub => unsub());
    };
  }, [userId]);

  if (loading) {
    return <div className="entradas-loading">Cargando entradas...</div>;
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