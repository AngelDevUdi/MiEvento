import React, { useState } from "react";
import "./resetpassword.css";
import { toast } from "react-toastify";
import { auth } from "../../api/api";
import { sendPasswordResetEmail } from "firebase/auth";
import { FaEnvelope } from "react-icons/fa";

const ResetPassword = ({ onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return toast.error("Ingresa tu correo");

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, cleanEmail);

      toast.success("Correo enviado con instrucciones");
      setEmail("");
      onClose();
    } catch (error) {
      toast.error("Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <form className="auth-box" onSubmit={handleSubmit}>
          <h2>Recuperar contraseña</h2>
          <p className="subtitle">Ingresa tu correo y te enviaremos instrucciones</p>

          {/* Email */}
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder=" "
              value={email}
              onChange={handleChange}
              required
            />
            <label>Correo electrónico</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? <span className="loader"></span> : "Enviar"}
          </button>

          <p className="auth-link">
            <span onClick={onSwitchToLogin}>Volver al login</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;