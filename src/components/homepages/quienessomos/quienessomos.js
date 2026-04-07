import React from "react";
import "./quienessomos.css";

const QuienesSomos = () => {
  return (
    <section className="about-section">
      <div className="container">
        <div className="about-header">
          <h2>¿Quiénes Somos?</h2>
        </div>

        <div className="about-content">
          <div className="about-text">
            <p>
              MiEvento es una plataforma innovadora diseñada para conectar a personas con
              los eventos más emocionantes de su ciudad. Desde conciertos y festivales hasta
              conferencias y encuentros sociales, nos dedicamos a hacer que cada experiencia
              sea inolvidable.
            </p>
            <p>
              Nuestro compromiso es proporcionar una experiencia segura, confiable y fácil
              de usar para que disfrutes cada momento sin preocupaciones.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuienesSomos;