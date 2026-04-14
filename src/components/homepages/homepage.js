import React, { useState } from "react";
import "./homepage.css";
import Navbar from "../navbar/navbar";
import Sliders from "../sliders/sliders";
import Footer from "../footer/footer";
import Proximamente from "./proximamente/proximamente";
import EventosDisponibles from "./eventosdisponibles/eventosdisponibles";
import QuienesSomos from "./quienessomos/quienessomos";
import NuestraVision from "./nuestravision/nuestravision";
import PorqueElegirnos from "./porqueelegirnos/porqueelegirnos";
import ComienzaTuAventura from "./comienzatuaventura/comienzatuaventura";
import EventosView from "../views/EventosView";
import LugaresView from "../views/LugaresView";
import EventLoading from "../loading/EventLoading";

const HomePage = ({ onViewChange }) => {
  const [currentSection, setCurrentSection] = useState("home");
  const [isLoading, setIsLoading] = useState(false);

  const handleSectionChange = (section) => {
    setIsLoading(true);
    // Pequeño delay para asegurar que se muestra la pantalla de carga
    setTimeout(() => {
      setCurrentSection(section);
      setIsLoading(false);
    }, 500);
  };

  const handleBackToHome = () => {
    setCurrentSection("home");
  };

  // Mostrar pantalla de carga mientras está cargando
  if (isLoading) {
    return (
      <>
        <Navbar onViewChange={onViewChange} onChange={handleSectionChange} isLoading={true} currentSection={currentSection} />
        <EventLoading text={currentSection === "eventos" ? "Cargando eventos..." : "Cargando lugares..."} />
      </>
    );
  }

  // Mostrar vista de eventos
  if (currentSection === "eventos") {
    return (
      <>
        <Navbar onViewChange={onViewChange} onChange={handleSectionChange} currentSection={currentSection} />
        <EventosView onBack={handleBackToHome} />
      </>
    );
  }

  // Mostrar vista de lugares
  if (currentSection === "lugares") {
    return (
      <>
        <Navbar onViewChange={onViewChange} onChange={handleSectionChange} currentSection={currentSection} />
        <LugaresView onBack={handleBackToHome} />
      </>
    );
  }

  // Homepage por defecto
  return (
    <div className="homepage">
      {/* Navbar */}
      <Navbar onViewChange={onViewChange} onChange={handleSectionChange} />

      {/* Slider de Eventos */}
      <section className="slider-section">
        <Sliders />
      </section>

      {/* Sección Próximamente */}
      <Proximamente onVerMas={() => handleSectionChange("lugares")} />

      {/* Sección Eventos Disponibles */}
      <EventosDisponibles onVerMas={() => handleSectionChange("eventos")} />

      {/* Sección ¿Quiénes Somos? */}
      <QuienesSomos />

      {/* Nuestra Visión */}
      <NuestraVision />

      {/* Por qué elegirnos */}
      <PorqueElegirnos />

      {/* Comienza tu aventura con MiEvento */}
      <ComienzaTuAventura />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
