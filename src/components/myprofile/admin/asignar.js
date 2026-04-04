import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { db } from "../../../api/api";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./asignar.css";

const Asignar = ({ onClose }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "USUARIOS"));
        const usuariosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Error fetching usuarios:", error);
        toast.error("Error al cargar usuarios");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "USUARIOS", userId), {
        rol: newRole
      });

      // Actualizar la lista local
      setUsuarios(usuarios.map(user =>
        user.id === userId ? { ...user, rol: newRole } : user
      ));

      toast.success(`Rol actualizado a ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error al actualizar rol");
    }
  };

  if (loading) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="asignar-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="asignar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="asignar-section">
          <h2>Asignar Roles</h2>
          <div className="asignar-list">
            {usuarios.map(usuario => (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-info">
                  <h3>{usuario.name}</h3>
                  <p><strong>Email:</strong> {usuario.email}</p>
                  <p><strong>Rol actual:</strong> {usuario.rol}</p>
                </div>
                <div className="usuario-actions">
                  <select
                    value={usuario.rol}
                    onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="USUARIO">USUARIO</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Asignar;