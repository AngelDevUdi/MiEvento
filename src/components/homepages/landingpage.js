import React from "react";
import "./landingpage.css";
import Navbar from "../navbar/navbar";
import Footer from "../footer/footer";

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section - Quiénes Somos */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>MiEvento</h1>
          <p>Tu plataforma de confianza para descubrir y reservar los mejores eventosaa</p>
        </div>
      </section>

      {/* Sección Acerca de Nosotros */}
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

      {/* Nuestra Misión */}
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

      {/* Por qué elegirnos */}
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

      {/* CTA de Descargar */}
      <section className="download-section">
        <div className="container">
          <h2>Comienza tu aventura con MiEvento</h2>
          <p>Descarga nuestra app y accede a miles de eventos exclusivos</p>
          <div className="download-buttons">
            <button className="download-btn ios">📱 App Store</button>
            <button className="download-btn android">🤖 Google Play</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
