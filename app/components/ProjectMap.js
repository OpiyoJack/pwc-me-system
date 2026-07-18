"use client";
import dynamic from "next/dynamic";

// Leaflet touches the browser window at load time, so it must never be
// rendered on the server — this dynamic import with ssr:false has to live
// inside a Client Component (this file), since Server Components aren't
// allowed to use that option directly.
const ProjectMapInner = dynamic(() => import("./ProjectMapInner"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 340, borderRadius: 10, border: "1px solid #DED2BC", display: "flex", alignItems: "center", justifyContent: "center", color: "#665f52", fontSize: 13 }}>
      Loading map…
    </div>
  ),
});

export default function ProjectMap(props) {
  return <ProjectMapInner {...props} />;
}
