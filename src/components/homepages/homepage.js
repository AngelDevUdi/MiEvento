import React from "react";
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

const HomePage = ({ onViewChange }) => {
  return (
    <div className="homepage">
      {/* Navbar */}
      <Navbar onViewChange={onViewChange} />

      {/* Slider de Eventos */}
      <section className="slider-section">
        <Sliders />
      </section>

      {/* Sección Próximamente */}
      <Proximamente />

      {/* Sección Eventos Disponibles */}
      <EventosDisponibles />

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
