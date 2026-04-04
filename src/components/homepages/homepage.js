import React, { useState } from "react";
import "./homepage.css";
import Navbar from "../navbar/navbar";
import Sliders from "../sliders/sliders";
import Footer from "../footer/footer";

const HomePage = ({ onViewChange }) => {
  // Estado para filtrar eventos
  const [activeFilter, setActiveFilter] = useState("todos");

  // Datos de eventos disponibles
  const eventosDisponibles = [
    {
      id: 1,
      title: "Concierto de Rock",
      artist: "The Rockers",
      date: "15 Abr 2024",
      location: "Bogotá",
      price: "$150.000",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop",
      category: "concierto"
    },
    {
      id: 2,
      title: "Festival de Jazz",
      artist: "Jazz Night",
      date: "22 Abr 2024",
      location: "Medellín",
      price: "$120.000",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop",
      category: "festival"
    },
    {
      id: 3,
      title: "Conferencia Tech 2024",
      artist: "TechCon",
      date: "28 Abr 2024",
      location: "Cali",
      price: "$80.000",
      image: "https://images.unsplash.com/photo-1505373877841-8cebaaff6de5?w=400&h=300&fit=crop",
      category: "conferencia"
    },
    {
      id: 4,
      title: "Teatro - Don Quijote",
      artist: "Compañía Teatral",
      date: "05 May 2024",
      location: "Bogotá",
      price: "$95.000",
      image: "https://images.unsplash.com/photo-1507924658113-b2e58a50df60?w=400&h=300&fit=crop",
      category: "teatro"
    },
    {
      id: 5,
      title: "Concierto Pop Stars",
      artist: "Pop Sensation",
      date: "12 May 2024",
      location: "Barranquilla",
      price: "$200.000",
      image: "https://images.unsplash.com/photo-1460749411175-04927f930bae?w=400&h=300&fit=crop",
      category: "concierto"
    },
    {
      id: 6,
      title: "Exposición de Arte",
      artist: "Galería Moderna",
      date: "18 May 2024",
      location: "Bogotá",
      price: "$50.000",
      image: "https://images.unsplash.com/photo-1549887534-7f9485f4d4ff?w=400&h=300&fit=crop",
      category: "arte"
    }
  ];

  // Filtrar eventos
  const eventosFiltrados = activeFilter === "todos" 
    ? eventosDisponibles 
    : eventosDisponibles.filter(e => e.category === activeFilter);

  return (
    <div className="homepage">
      {/* Navbar */}
      <Navbar onViewChange={onViewChange} />

      {/* Slider de Eventos */}
      <section className="slider-section">
        <Sliders />
      </section>

      {/* Sección Próximamente */}
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

      {/* Sección Eventos Disponibles */}
      <section className="available-events-section">
        <div className="container">
          <div className="events-header">
            <h2>🎫 Eventos Disponibles</h2>
            <p>Reserva tus tickets ahora</p>
          </div>

          {/* Filtros */}
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === "todos" ? "active" : ""}`}
              onClick={() => setActiveFilter("todos")}
            >
              Todos
            </button>
            <button 
              className={`filter-btn ${activeFilter === "concierto" ? "active" : ""}`}
              onClick={() => setActiveFilter("concierto")}
            >
              Conciertos
            </button>
            <button 
              className={`filter-btn ${activeFilter === "festival" ? "active" : ""}`}
              onClick={() => setActiveFilter("festival")}
            >
              Festivales
            </button>
            <button 
              className={`filter-btn ${activeFilter === "conferencia" ? "active" : ""}`}
              onClick={() => setActiveFilter("conferencia")}
            >
              Conferencias
            </button>
            <button 
              className={`filter-btn ${activeFilter === "teatro" ? "active" : ""}`}
              onClick={() => setActiveFilter("teatro")}
            >
              Teatro
            </button>
            <button 
              className={`filter-btn ${activeFilter === "arte" ? "active" : ""}`}
              onClick={() => setActiveFilter("arte")}
            >
              Arte
            </button>
          </div>

          {/* Grid de eventos */}
          <div className="events-grid">
            {eventosFiltrados.map(evento => (
              <div key={evento.id} className="event-card">
                <div className="event-image" style={{ backgroundImage: `url(${evento.image})` }}>
                  <div className="event-overlay">
                    <button className="reserve-btn">Reservar Ahora</button>
                  </div>
                </div>
                <div className="event-content">
                  <h3>{evento.title}</h3>
                  <p className="artist">{evento.artist}</p>
                  <div className="event-info">
                    <span className="date">📅 {evento.date}</span>
                    <span className="location">📍 {evento.location}</span>
                  </div>
                  <div className="event-footer">
                    <span className="price">{evento.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {eventosFiltrados.length === 0 && (
            <div className="no-events">
              <p>No hay eventos disponibles en esta categoría</p>
            </div>
          )}
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
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
