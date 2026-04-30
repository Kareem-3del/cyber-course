import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cyber Operations Academy",
    short_name: "CyberCourse",
    description: "Bilingual cybersecurity curriculum from foundations to nation-state tradecraft.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
    categories: ["education", "productivity"],
    lang: "ar",
    dir: "rtl",
  };
}
