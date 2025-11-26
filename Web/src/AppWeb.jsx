import './AppWeb.css';
import ApplePlot from './Componentes/Apple_graph';
import { useEffect, useState } from "react";

// === LIMPIA HORAS (AM/PM) DE CARACTERES RAROS ===
const limpiarString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFKC")
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();
};

// === CONVIERTE '9:16:40 AM' → SEGUNDOS ===
const convertirHoraASegundos = (hora) => {
  const clean = limpiarString(hora);
  const date = new Date(`1970-01-01 ${clean}`);
  if (isNaN(date.getTime())) {
    console.warn("Hora inválida:", hora);
    return null;
  }
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
};
const AppWeb = () => {
  const [eventos, setEventos] = useState([]);
  const [recordings, setRecordings] = useState([]);

  // === CARGAR EVENTOS Y GRABACIONES ===
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resEventos = await fetch("http://192.168.1.134:8000/eventos");
        const dataEventos = await resEventos.json();
        setEventos(dataEventos.eventos);

        const resRec = await fetch("http://192.168.1.134:8000/recordings");
        const dataRec = await resRec.json();
        setRecordings(dataRec.recordings);

      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    cargarDatos();
  }, []);

  // === VENTANA ±10s ===
  const handleSeleccionEvento = (hora) => {
    if (!hora) return;
    const t = convertirHoraASegundos(hora);
    if (t === null) return;
    const ventana = { start: t - 10, end: t + 10 };
    window.dispatchEvent(
      new CustomEvent("changeWindow", { detail: ventana })
    );
  };

  // === SELECCIONAR GRABACIÓN ===
  const handleSeleccionRecording = async (recId) => {
    if (!recId) return;
    try {
      const res = await fetch(`http://192.168.1.134:8000/recordings/${recId}`);
      const data = await res.json();
      window.dispatchEvent(new CustomEvent("loadRecording", { detail: data.rows }));
    } catch (err) {
      console.error("Error al cargar grabación:", err);
    }
  };
  return (
    <div className="layout">
      <div className="top-right-logo">
        <img src="image_2.png" alt="logo superior" />
      </div>

      <aside className="sidebar">
        <div className="sidebar-content">
          <h3 className="sidebar-title">MENU</h3>
          <div className="sidebar-item active">Inicio</div>
          <div className="sidebar-item">Pacientes</div>
          <div className="sidebar-item">Configuración</div>
          <div className="sidebar-item">Ayuda</div>
          <h4 className="sidebar-section">OTHERS</h4>
          <div className="sidebar-item">Usuarios</div>
        </div>
      </aside>

      <main className="main">
        <h1 className="header-title">Electrocardiograma</h1>
        <p className="header-sub">Grabación</p>

        <div className="toolbar">
          {/* === SELECT DE GRABACIÓN === */}
          <select className="btn" onChange={(e) => handleSeleccionRecording(e.target.value)}>
            <option value="">Seleccionar grabación</option>
            {recordings.map((rec, idx) => (
              <option key={idx} value={rec.id}>
                {rec.name || `Recording ${idx + 1}`}
              </option>
            ))}
          </select>

          {/* === SELECT DE EVENTOS === */}
          <select className="btn" onChange={(e) => handleSeleccionEvento(e.target.value)}>
            <option value="">Seleccionar evento</option>
            {eventos.map((ev, idx) => {
              const hora = limpiarString(ev.hora_aprox);
              return (
                <option key={idx} value={hora}>
                  Evento {idx + 1} – {hora}
                </option>
              );
            })}
          </select>

          {/* === SELECT DE DERIVACIÓN === */}
          <select
            className="select-lead"
            onChange={(e) =>
              window.dispatchEvent(
                new CustomEvent("changeLead", { detail: e.target.value })
              )
            }
          >
            <option value="ECG_I">ECG I</option>
            <option value="ECG_II">ECG II</option>
            <option value="ECG_III">ECG III</option>
          </select>
        </div>

        <div className="apple-plot-container">
          <ApplePlot />
        </div>

        <hr className="divider" />
        <h2 className="info-title">Información del usuario</h2>
      </main>
    </div>
  );
};

export default AppWeb;