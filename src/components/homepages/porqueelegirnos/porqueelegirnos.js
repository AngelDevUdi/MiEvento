import React from "react";
import "./porqueelegirnos.css";

const PorqueElegirnos = () => {
  return (
    <section className="why-us-section">
      <div className="container">
        <h2>¿Por qué elegirnos?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>100% Seguro</h3>
            <p>Tus datos y pagos están protegidos con encriptación de nivel bancario</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Rápido y Fácil</h3>
            <p>Reserva tus tickets en segundos con nuestro sistema intuitivo</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Amplia Variedad</h3>
            <p>Miles de eventos de diferentes categorías y artistas</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Soporte 24/7</h3>
            <p>Equipo disponible para resolver cualquier inquietud</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PorqueElegirnos;