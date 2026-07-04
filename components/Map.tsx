"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Asset = {
  asset_id: string;
  name: string;
  asset_type?: string;
  latitude: number | null;
  longitude: number | null;
  country?: string;
  admin1?: string;
  place_name?: string;
};

type Obs = {
  asset_id: string;
  metric_id: string;
  value: number | string | null;
};

function hasCoords(a: Asset): a is Asset & { latitude: number; longitude: number } {
  return (
    typeof a.latitude === "number" &&
    typeof a.longitude === "number" &&
    isFinite(a.latitude) &&
    isFinite(a.longitude)
  );
}

export default function Map({
  assets,
  observations,
}: {
  assets: Asset[];
  observations: Obs[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-40, 30],
      zoom: 1.4,
      projection: "globe",
    });

    map.on("style.load", () => {
      // Black space behind the globe. Globe surface colors stay as-is.
      map.setFog({
        color: "rgb(0, 0, 0)",
        "high-color": "rgb(0, 0, 0)",
        "space-color": "rgb(0, 0, 0)",
        "horizon-blend": 0.02,
        "star-intensity": 0,
      });
    });

    const pinned = assets.filter(hasCoords);
    const skipped = assets.length - pinned.length;

    pinned.forEach((a) => {
      const rows = observations
        .filter((o) => o.asset_id === a.asset_id)
        .map(
          (o) =>
            `<tr><td>${o.metric_id}</td><td style="text-align:right">${o.value}</td></tr>`
        )
        .join("");

      const html =
        `<strong>${a.name}</strong><br/>` +
        `<span style="color:#666">${a.asset_type ?? "\u2014"} \u00b7 ${a.place_name ?? "\u2014"}, ${a.country ?? "\u2014"}</span>` +
        (rows
          ? `<table style="margin-top:6px;font-size:12px;border-collapse:collapse">${rows}</table>`
          : "");

      const el = document.createElement("div");
      el.innerHTML =
        '<svg width="20" height="28" viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M10 0C4.5 0 0 4.5 0 10c0 7 10 18 10 18s10-11 10-18C20 4.5 15.5 0 10 0z" ' +
        'fill="#000000"/></svg>';
      el.style.cursor = "pointer";

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([a.longitude, a.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(html))
        .addTo(map);
    });

    // Never crash on un-pinnable rows: surface a count instead.
    if (skipped > 0) {
      const note = document.createElement("div");
      note.style.cssText =
        "position:absolute;bottom:12px;left:12px;background:#fff;padding:6px 10px;border-radius:6px;font:12px sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.2)";
      note.textContent = `${skipped} asset(s) hidden \u2014 no coordinates`;
      ref.current?.appendChild(note);
    }

    return () => map.remove();
  }, [assets, observations]);

  return <div ref={ref} style={{ width: "100%", height: "100vh", position: "relative", background: "#000" }} />;
}
