import React from "react";
import "./nuestravision.css";

const NuestraVision = () => {
  return (
    <section className="mission-section">
      <div className="container">
        <div className="mission-grid">
          <div className="mission-card">
            <div className="mission-icon">🎯</div>
            <h3>Nuestra Misión</h3>
            <p>Conectar a las personas con las experiencias que aman y crear comunidades vibrantes alrededor de eventos únicos.</p>
          </div>

          <div className="mission-card">
            <div className="mission-icon">👁️</div>
            <h3>Nuestra Visión</h3>
            <p>Ser la plataforma número uno en Latinoamérica para descubrimiento y reserva de eventos en tiempo real.</p>
          </div>

          <div className="mission-card">
            <div className="mission-icon">💡</div>
            <h3>Nuestros Valores</h3>
            <p>Transparencia, seguridad, innovación y compromiso con la excelencia en cada interacción.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NuestraVision;