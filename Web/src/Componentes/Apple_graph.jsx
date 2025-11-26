import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import * as d3 from "d3";

export default function ApplePlot() {

  const [rows, setRows] = useState(null);
  const [selectedLead, setSelectedLead] = useState("ECG_I"); // ← por defecto

  useEffect(() => {
    d3.csv(
      "https://raw.githubusercontent.com/miguel-isidro05/Real_time_ECG_WebApplication/f6df084f2efac48f9d8d8c07a2bf1a460524caf2/block_001_raw.csv"
    ).then(r => setRows(r));

    // Escuchar evento del dropdown
    const handler = (e) => setSelectedLead(e.detail);
    window.addEventListener("changeLead", handler);

    return () => window.removeEventListener("changeLead", handler);
  }, []);

  if (!rows) return <p>Cargando datos…</p>;

  const unpack = (rows, key) => rows.map(row => row[key]);

  // === GRAFICO ECG (DINÁMICO SI CAMBIAS DERIVACIÓN) ===
  const traceHigh = {
    type: "scatter",
    mode: "lines",
    name: `Señal ${selectedLead}`,
    x: unpack(rows, "timestamp"),
    y: unpack(rows, selectedLead),
    line: { color: "#17BECF" },
    yaxis: "y1"
  };

  // === GRAFICOS IMU ===
  const traceLow = {
    type: "scatter",
    mode: "lines",
    name: "IMU X",
    x: unpack(rows, "timestamp"),
    y: unpack(rows, "AccX"),
    line: { color: "#7F7F7F" },
    yaxis: "y2"
  };

  const traceOpen = {
    type: "scatter",
    mode: "lines",
    name: "IMU Y",
    x: unpack(rows, "timestamp"),
    y: unpack(rows, "AccY"),
    line: { color: "#FF5733" },
    yaxis: "y2"
  };

  const traceClose = {
    type: "scatter",
    mode: "lines",
    name: "IMU Z",
    x: unpack(rows, "timestamp"),
    y: unpack(rows, "AccZ"),
    line: { color: "#2ECC71" },
    yaxis: "y2"
  };

  return (
    <Plot
      data={[traceHigh, traceLow, traceOpen, traceClose]}
      layout={{
        title: `Derivación: ${selectedLead}`,
        grid: { rows: 2, columns: 1, pattern: "independent" },

        yaxis: { title: "ECG", domain: [0, 0.45] },
        yaxis2: { title: "IMU", domain: [0.45, 1] },

        xaxis: { type: "date", rangeslider: { visible: true } },
        xaxis2: { type: "date", matches: "x", rangeslider: { visible: false } },

        height: 600,
        margin: { t: 50, b: 50 }
      }}
      config={{ responsive: true }}
      style={{ width: "100%" }}
    />
  );
}
