import React from "react";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Información de contacto */}
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>Email: contacto@tusitio.com</p>
          <p>Tel: +57 300 000 0000</p>
        </div>

        {/* Políticas */}
        <div className="footer-section">
          <h3>Información</h3>
          <p>Política de tratamiento de datos</p>
          <p>Términos y condiciones</p>
        </div>

        {/* Desarrolladores */}
        <div className="footer-section">
          <h3>Desarrolladores</h3>
          <p>Tu Nombre</p>
          <p>Equipo Dev</p>
        </div>

      </div>

      {/* Derechos reservados */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
      </div>
    </footer>
  );
};

export default Footer;