import React, { useState, useEffect } from "react";
import "./sliders.css";

const Sliders = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Array de slides con imágenes de ejemplo
  const slides = [
    {
      id: 1,
      title: "Bienvenido a MiEvento",
      subtitle: "Descubre los mejores eventos",
      image: "https://images.unsplash.com/photo-1540575467063-178f50002c4b?w=1200&h=500&fit=crop",
      color: "#4a90e2"
    },
    {
      id: 2,
      title: "Experiencias Únicas",
      subtitle: "Vive momentos inolvidables",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=500&fit=crop",
      color: "#28a745"
    },
    {
      id: 3,
      title: "Comunidad Vibrante",
      subtitle: "Conecta con personas como tú",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=500&fit=crop",
      color: "#ff6b6b"
    }
  ];

  // Auto-avance de slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Funciones de navegación
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="sliders-container">
      {/* Slides */}
      <div className="slides-wrapper">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide-overlay"></div>
            <div className="slide-content">
              <h1 className="slide-title">{slide.title}</h1>
              <p className="slide-subtitle">{slide.subtitle}</p>
              <button className="slide-btn">Explorar Eventos</button>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de navegación */}
      <button className="slider-nav-btn prev" onClick={prevSlide}>
        ❮
      </button>
      <button className="slider-nav-btn next" onClick={nextSlide}>
        ❯
      </button>

      {/* Indicadores (dots) */}
      <div className="slider-indicators">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Sliders;
