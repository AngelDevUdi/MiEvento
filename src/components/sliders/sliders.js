import React, { useState, useEffect } from "react";
import { db } from "../../api/api";
import { collection, getDocs } from "firebase/firestore";
import ComprarBoleta from "../homepages/comprarboleta/comprarboleta";
import "./sliders.css";

const Sliders = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventoId, setSelectedEventoId] = useState(null);
  const [showComprarModal, setShowComprarModal] = useState(false);

  // Array de slides por defecto si no hay promociones
  const defaultSlides = [
    {
      id: 1,
      title: "Bienvenido a MiEvento",
      subtitle: "Descubre los mejores eventos",
      image: "https://images.unsplash.com/photo-1540575467063-178f50002c4b?w=1200&h=500&fit=crop",
      color: "#4a90e2",
      eventoId: null
    },
    {
      id: 2,
      title: "Experiencias Únicas",
      subtitle: "Vive momentos inolvidables",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=500&fit=crop",
      color: "#28a745",
      eventoId: null
    },
    {
      id: 3,
      title: "Comunidad Vibrante",
      subtitle: "Conecta con personas como tú",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=500&fit=crop",
      color: "#ff6b6b",
      eventoId: null
    }
  ];

  useEffect(() => {
    fetchPromociones();
  }, []);

  const fetchPromociones = async () => {
    try {
      const promocionesSnapshot = await getDocs(collection(db, "PROMOCIONES"));
      
      if (promocionesSnapshot.empty) {
        // Sin promociones, usar slides por defecto
        setSlides(defaultSlides);
      } else {
        // Convertir promociones a slides
        const promocionesData = promocionesSnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            dbId: doc.id
          }))
          .sort((a, b) => a.posicion - b.posicion)
          .map((promo) => ({
  id: promo.dbId,
  title: promo.nombre,
  subtitle: `$${promo.precio}`,
  descripcion: promo.descripcion, // 👈 AQUI
  image: promo.imagen,
  color: "#4a90e2",
  eventoId: promo.eventoId,
  isPromotion: true
}));

        setSlides(promocionesData);
      }
    } catch (error) {
      console.error("Error fetching promociones:", error);
      setSlides(defaultSlides);
    } finally {
      setLoading(false);
    }
  };

  // Auto-avance de slides
  useEffect(() => {
    if (slides.length === 0) return;
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

  // Manejador para abrir modal de compra
  const handleComprarClick = (slide) => {
    if (slide.isPromotion && slide.eventoId) {
      setSelectedEventoId(slide.eventoId);
      setShowComprarModal(true);
    }
  };

  if (loading) {
    return <div className="sliders-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>Cargando...</div>;
  }

  return (
  <>
    <div className="sliders-container">
      
      {/* Slides */}
      <div className="slides-wrapper">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? "active" : ""}`}
            onClick={() => slide.isPromotion && handleComprarClick(slide)}
          >
            <div className="slide-overlay"></div>

            {/* NUEVO LAYOUT 75 / 25 */}
            <div className="slide-layout">

              {/* IZQUIERDA: IMAGEN (75%) */}
              <div
                className="slide-image"
                style={{ backgroundImage: `url(${slide.image})` }}
              />

              {/* DERECHA: INFO (25%) */}
              <div className="slide-info">

                <h1 className="slide-title">
                  {slide.title}
                </h1>

                {slide.descripcion && (
                  <p className="slide-description">
                    {slide.descripcion}
                  </p>
                )}

                {slide.isPromotion ? (
                  <button
                    className="slide-btn slide-btn-promo"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComprarClick(slide);
                    }}
                  >
                    Comprar ahora
                  </button>
                ) : (
                  <button className="slide-btn">
                    Explorar Eventos
                  </button>
                )}

              </div>
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

      {/* Indicadores */}
      <div className="slider-indicators">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`indicator ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>

    {/* Modal de compra */}
    {showComprarModal && selectedEventoId && (
      <div className="modal-wrapper">
        <ComprarBoleta
          eventoId={selectedEventoId}
          onClose={() => {
            setShowComprarModal(false);
            setSelectedEventoId(null);
          }}
        />
      </div>
    )}
  </>
);
};

export default Sliders;
