import './AppWeb.css';
import ApplePlot from './Componentes/Apple_graph';
import { CosmosClient } from "@azure/cosmos";
import { useEffect, useState } from "react";

// === LIMPIA HORAS (AM/PM) DE CARACTERES RAROS ===
const limpiarString = (str) => {
    if (!str) return "";
    return str
        .normalize("NFKC")
        .replace(/\u202F/g, " ")   // Narrow no-break space
        .replace(/\u00A0/g, " ")   // No-break space
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

    return (
        date.getHours() * 3600 +
        date.getMinutes() * 60 +
        date.getSeconds()
    );
};

const AppWeb = () => {

    // === ESTADO PARA EVENTOS DE COSMOS ===
    const [eventos, setEventos] = useState([]);

    // === CARGAR EVENTOS DESDE COSMOS ===
    useEffect(() => {
        const cargarEventos = async () => {
            try {
                const endpoint = "https://miguel2005.documents.azure.com:443/";
                const key = "0ZcRceV93VfD6fSR5pQc7KBWVn5pIyFifxSvU9dh6j9eBE6j3ijyfkn4sY2QK8xSlHQtCevA5GRwACDberDJeA==";

                const client = new CosmosClient({ endpoint, key });

                const database = client.database("Instru_database");
                const container = database.container("Evento");

                const { resources } = await container.items
                    .query("SELECT * FROM c", { enableCrossPartitionQuery: true })
                    .fetchAll();

                setEventos(resources);

                console.log("Eventos cargados:", resources);

            } catch (err) {
                console.error("Error Cosmos:", err);
            }
        };

        cargarEventos();
    }, []);

    // === GENERAR VENTANA ±10s ===
    const handleSeleccionEvento = (hora) => {
        if (!hora) return;

        const t = convertirHoraASegundos(hora);
        if (t === null) return;

        const ventana = {
            start: t - 10,
            end: t + 10
        };

        console.log("Ventana generada:", ventana);

        window.dispatchEvent(
            new CustomEvent("changeWindow", { detail: ventana })
        );
    };

    return (
        <div className="layout">

            {/* ==== IMAGEN ARRIBA DERECHA ==== */}
            <div className="top-right-logo">
                <img src="image_2.png" alt="logo superior" />
            </div>

            {/* ==== SIDEBAR ==== */}
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

            {/* ==== CONTENIDO ==== */}
            <main className="main">

                <h1 className="header-title">Electrocardiograma</h1>
                <p className="header-sub">Grabación</p>

                <div className="toolbar">
                    <button className="btn">Seleccionar grabación</button>

                    {/* === SELECT DE EVENTOS === */}
                    <select
                        className="btn"
                        onChange={(e) => handleSeleccionEvento(e.target.value)}
                    >
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
