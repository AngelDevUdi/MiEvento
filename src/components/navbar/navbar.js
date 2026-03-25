import React, { useState } from "react";
import "./navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const handleMenuClick = () => {
    setOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        
        {/* Logo */}
        <div className="navbar-logo">
          MiEvento
        </div>

        {/* Menú */}
        <ul className={`navbar-menu ${open ? "active" : ""}`}>
          <li><a href="/" onClick={handleMenuClick}>Inicio</a></li>
          <li><a href="/about" onClick={handleMenuClick}>Acerca de Nosotros</a></li>
          <li><a href="#eventos" onClick={handleMenuClick}>Eventos</a></li>
          <li><a href="#contacto" onClick={handleMenuClick}>Contacto</a></li>
        </ul>

        {/* Botón hamburguesa */}
        <div
          className={`hamburger ${open ? "active" : ""}`}
          onClick={() => setOpen(!open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;