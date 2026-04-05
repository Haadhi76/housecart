import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HouseCart",
    short_name: "HouseCart",
    description: "Your household's shared shopping list",
    start_url: "/dashboard",
    display: "standalone",
    theme_color: "#059669",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
