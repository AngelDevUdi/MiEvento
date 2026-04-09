import React, { useState, useEffect } from "react";
import "./myprofile.css";
import { auth, db } from "../../api/api";
import { onAuthStateChanged } from "firebase/auth";
import { query, where, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, onSnapshot } from "firebase/firestore";
import Navbar from "../navbar/navbar";
import Entradas from "./users/entradas";
import Reservas from "./users/reservas";
import Solicitudes from "./admin/solicitudes";
import Asignar from "./admin/asignar";
import Eventos from "./organizador/eventos";
import Lugares from "./organizador/lugares";
import MetodosPagos from "./organizador/metodospagos/metodospagos";
import SolicitudesBoletas from "./organizador/solicitudesboletas/solicitudesboletas";
import Porteros from "./organizador/porteros/porteros";
import EscanearBoletas from "./porteros/EscanearBoletas";
import { FaClipboardList, FaUserCog, FaCreditCard, FaTicketAlt, FaDoorOpen } from "react-icons/fa";
import { toast } from "react-toastify";
import ConfirmationModal from "../confirmationmodal/confirmationmodal";
import EventLoading from "../loading/EventLoading";

const MyProfile = ({ onViewChange }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [solicitudId, setSolicitudId] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState("Confirmación");
  const [countSolicitudesBoletas, setCountSolicitudesBoletas] = useState(0);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmMode, setConfirmMode] = useState("request");
  const [userDocId, setUserDocId] = useState(null);
  const [countSolicitudes, setCountSolicitudes] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const q = query(collection(db, "USUARIOS"), where("email", "==", currentUser.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const data = userDoc.data();
          setUserData(data);
          setUserDocId(userDoc.id);
          setHasPendingRequest(data.solicitud === "PENDIENTE");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "SOLICITUDES"), (snapshot) => {
      setCountSolicitudes(snapshot.size);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || userData?.rol !== "ORGANIZADOR") return;

    let unsubscribeBoletas = null;
    const eventosQuery = query(collection(db, "EVENTOS"), where("organizadorId", "==", user.uid));

    const unsubscribeEventos = onSnapshot(eventosQuery, (eventosSnapshot) => {
      const eventoIds = eventosSnapshot.docs.map((doc) => doc.id);

      if (unsubscribeBoletas) {
        unsubscribeBoletas();
        unsubscribeBoletas = null;
      }

      if (eventoIds.length === 0) {
        setCountSolicitudesBoletas(0);
        return;
      }

      if (eventoIds.length <= 10) {
        const boletasQuery = query(
          collection(db, "SOLICITUDES_BOLETAS"),
          where("eventoId", "in", eventoIds),
          where("estado", "==", "PENDIENTE")
        );
        unsubscribeBoletas = onSnapshot(boletasQuery, (snapshot) => {
          setCountSolicitudesBoletas(snapshot.size);
        });
      } else {
        unsubscribeBoletas = onSnapshot(collection(db, "SOLICITUDES_BOLETAS"), (snapshot) => {
          const count = snapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            return eventoIds.includes(data.eventoId) && data.estado === "PENDIENTE" ? acc + 1 : acc;
          }, 0);
          setCountSolicitudesBoletas(count);
        });
      }
    });

    return () => {
      if (unsubscribeBoletas) unsubscribeBoletas();
      unsubscribeEventos();
    };
  }, [user, userData?.rol]);

  const handleOpenConfirm = () => {
    const newId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setSolicitudId(newId);
    setConfirmTitle("Empieza a organizar eventos y genera ingresos");
    setConfirmMessage(
  "Crea y gestiona tus propios eventos, alquila espacios y llega a más personas. " +
  "Nuestro equipo revisará tu solicitud y te acompañará en cada paso para que empieces de forma segura.\n\n" +
  "Serás redirigido a WhatsApp para continuar con un asesor.\n" +
  "¿Deseas continuar o cancelar?"
);
    setConfirmMode("request");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (confirmMode === "request") {
      try {
        await addDoc(collection(db, "SOLICITUDES"), {
          userId: user.uid,
          name: userData?.name || user.displayName || "",
          email: user.email,
          rolSolicitado: "ORGANIZADOR",
          status: "PENDIENTE",
          solicitudId,
          createdAt: serverTimestamp(),
        });

        // Actualizar el documento del usuario con solicitud PENDIENTE
        if (userDocId) {
          await updateDoc(doc(db, "USUARIOS", userDocId), {
            solicitud: "PENDIENTE"
          });
        }

        setHasPendingRequest(true);
        setConfirmTitle("Solicitud enviada");
        setConfirmMessage("Tu solicitud ha sido enviada. Un asesor se pondrá en contacto contigo muy pronto para ayudarte a comenzar como organizador.");
        setConfirmMode("sent");

        const whatsappText = encodeURIComponent(`hola quiero volverme organizador y mi id de solicitud es ${solicitudId}`);
        window.open(`https://wa.me/573054715845?text=${whatsappText}`, "_blank");
      } catch (error) {
        console.error(error);
        toast.error("No se pudo enviar tu solicitud. Por favor intenta de nuevo.");
        setShowConfirm(false);
      }
    } else {
      setShowConfirm(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirm(false);
  };

  if (loading) {
    return <EventLoading text="Cargando perfil..." />;
  }

  if (!user) {
    return <div className="myprofile-error">No has iniciado sesión</div>;
  }

  return (
    <div className="myprofile">
      <Navbar onViewChange={onViewChange} />
      <div className="myprofile-content">
        <h1>Mi Perfil</h1>
        <h2>Bienvenido, {(userData?.name || user?.displayName)?.charAt(0).toUpperCase() + (userData?.name || user?.displayName)?.slice(1)}</h2>
        
        
        {userData?.rol === "USUARIO" && (
          <div className="user-sections">
            <Entradas userId={user.uid} />
            <Reservas userEmail={user.email} />
          </div>
        )}
        
        {userData?.rol === "ADMINISTRADOR" && (
          <div className="admin-sections">
            <div className="admin-buttons">
              <button 
                className={`admin-btn ${activeSection === 'solicitudes' ? 'active' : ''}`}
                onClick={() => setActiveSection('solicitudes')}
              >
                <FaClipboardList className="admin-icon" />
                <span>Solicitudes</span>
                {countSolicitudes > 0 && <span className="counter">{countSolicitudes}</span>}
              </button>
              <button 
                className={`admin-btn ${activeSection === 'asignar' ? 'active' : ''}`}
                onClick={() => setActiveSection('asignar')}
              >
                <FaUserCog className="admin-icon" />
                <span>Asignar</span>
              </button>
            </div>
            
            {activeSection === 'solicitudes' && <Solicitudes onClose={() => setActiveSection(null)} />}
            {activeSection === 'asignar' && <Asignar onClose={() => setActiveSection(null)} />}
          </div>
        )}

        {userData?.rol === "ORGANIZADOR" && (
          <div className="organizador-info">
            <p>Licencia de organizador vigente hasta 7 de mayo del 2026. <span className="days-remaining">Días restantes: {Math.ceil((new Date("2026-05-07") - new Date()) / (1000 * 60 * 60 * 24))}</span></p>
            <div className="organizador-buttons">
              <button 
                className={`organizador-btn ${activeSection === 'eventos' ? 'active' : ''}`}
                onClick={() => setActiveSection('eventos')}
              >
                <FaClipboardList className="organizador-icon" />
                <span>Crear Evento</span>
              </button>
              <button 
                className={`organizador-btn ${activeSection === 'lugares' ? 'active' : ''}`}
                onClick={() => setActiveSection('lugares')}
              >
                <FaUserCog className="organizador-icon" />
                <span>Gestionar Lugares</span>
              </button>
              <button 
                className={`organizador-btn ${activeSection === 'metodospagos' ? 'active' : ''}`}
                onClick={() => setActiveSection('metodospagos')}
              >
                <FaCreditCard className="organizador-icon" />
                <span>Métodos de Pago</span>
              </button>
              <button 
                className={`organizador-btn ${activeSection === 'solicitudesboletas' ? 'active' : ''}`}
                onClick={() => setActiveSection('solicitudesboletas')}
              >
                <FaTicketAlt className="organizador-icon" />
                <span>Solicitudes de Boletas</span>
                {countSolicitudesBoletas > 0 && <span className="counter">{countSolicitudesBoletas}</span>}
              </button>
              <button 
                className={`organizador-btn ${activeSection === 'porteros' ? 'active' : ''}`}
                onClick={() => setActiveSection('porteros')}
              >
                <FaDoorOpen className="organizador-icon" />
                <span>Gestión de Porteros</span>
              </button>
            </div>
            
            {activeSection === 'eventos' && <Eventos userId={user.uid} onClose={() => setActiveSection(null)} />}
            {activeSection === 'lugares' && <Lugares userId={user.uid} onClose={() => setActiveSection(null)} initialShowForm={true} />}
            {activeSection === 'metodospagos' && <MetodosPagos userId={user.uid} onClose={() => setActiveSection(null)} />}
            {activeSection === 'solicitudesboletas' && <SolicitudesBoletas userId={user.uid} onClose={() => setActiveSection(null)} />}
            {activeSection === 'porteros' && <Porteros userId={user.uid} onClose={() => setActiveSection(null)} />}
          </div>
        )}

        {userData?.rol === "PORTERO" && (
          <EscanearBoletas userId={user.uid} />
        )}

        {userData?.rol === "USUARIO" && (
          <div className="organizer-request">
            {hasPendingRequest ? (
              <div className="organizer-request-status">Tu solicitud está en estado pendiente</div>
            ) : (
              <button className="organizer-request-btn" onClick={handleOpenConfirm}>
                Convertirme en organizador
              </button>
            )}
          </div>
        )}
        
        <ConfirmationModal
          isOpen={showConfirm}
          title={confirmTitle}
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={handleCloseModal}
        />

        <button onClick={() => onViewChange('home')} className="back-button">
          Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default MyProfile;