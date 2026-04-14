import React, { useEffect } from "react";
import "./eventLoading.css";

const EventLoading = () => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="event-loading-container">
      <div className="event-loader">

        {/* Icono tipo calendario */}
        <div className="calendar">
          <div className="calendar-top"></div>
          <div className="calendar-body">
            <div className="dot"></div>
          </div>
        </div>

        {/* Texto */}
        <p className="loading-text">Cargando</p>
      </div>
    </div>
  );
};

export default EventLoading;