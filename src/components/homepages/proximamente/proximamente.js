import React from "react";
import "./proximamente.css";

const Proximamente = () => {
  return (
    <section className="coming-soon-section">
      <div className="container">
        <div className="coming-soon-header">
          <h2>🎉 Próximamente</h2>
          <p>Espera los siguientes eventos que están por llegar</p>
        </div>

        <div className="coming-soon-cards">
          <div className="coming-card">
            <div className="coming-badge">Pronto</div>
            <h3>Festival de Música Electrónica</h3>
            <p>Una experiencia única con los mejores DJs del mundo</p>
          </div>

          <div className="coming-card">
            <div className="coming-badge">Pronto</div>
            <h3>Maratón de Películas</h3>
            <p>Marathon de cine clásico y estrenos de 2024</p>
          </div>

          <div className="coming-card">
            <div className="coming-badge">Pronto</div>
            <h3>Torneo de Esports</h3>
            <p>Competición profesional de los videojuegos más populares</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Proximamente;