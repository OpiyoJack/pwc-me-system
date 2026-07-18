"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

export default function ProjectMapInner({ regions, height = 340 }) {
  const maxCount = Math.max(1, ...regions.map((r) => r.projects + r.beneficiaries));

  return (
    <div style={{ height, borderRadius: 10, overflow: "hidden", border: "1px solid #DED2BC" }}>
      <MapContainer
        center={[-6.5, 35]}
        zoom={5.2}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#EDE6D8" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {regions.map((r) => {
          const weight = r.projects + r.beneficiaries;
          const radius = 7 + (weight / maxCount) * 20;
          const color = r.projects > 0 ? "#1B3A5C" : "#D9A441";
          return (
            <CircleMarker
              key={r.region}
              center={r.coords}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1} className="pwc-map-tooltip">
                <div style={{ fontFamily: "sans-serif" }}>
                  <div style={{ fontWeight: 700, color: "#1B3A5C", fontSize: 12.5, marginBottom: 2 }}>{r.region}</div>
                  <div style={{ fontSize: 11, color: "#665f52" }}>
                    {r.projects} project{r.projects !== 1 ? "s" : ""} · {r.beneficiaries} beneficiar{r.beneficiaries !== 1 ? "ies" : "y"}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
