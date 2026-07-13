export default function manifest() {
  return {
    name: "PWC M&E Platform",
    short_name: "PWC M&E",
    description: "Cloud-based Monitoring & Evaluation system for Pastoral Women's Council",
    start_url: "/",
    display: "standalone",
    background_color: "#EDE6D8",
    theme_color: "#1B3A5C",
    icons: [
      { src: "/pwc-logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
