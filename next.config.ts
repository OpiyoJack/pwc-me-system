import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
};

const isProdBuild = process.env.NODE_ENV === "production";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.js",
  swDest: "public/sw.js",
  disable: !isProdBuild,
});

export default isProdBuild ? withSerwist(nextConfig) : nextConfig;
