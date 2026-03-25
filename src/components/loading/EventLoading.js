import React from "react";
import "./eventLoading.css";

const EventLoading = ({ text = "Cargando eventos..." }) => {
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
        <p className="loading-text">{text}</p>
      </div>
    </div>
  );
};

export default EventLoading;