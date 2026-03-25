import React, { useState } from "react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset password:", email);
  };

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={handleSubmit}>
        <h2>Recuperar contraseña</h2>

        <p>
          Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Enviar</button>

        <p className="auth-link">
          <a href="#">Volver al login</a>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;