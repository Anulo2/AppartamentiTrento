"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { ApartmentCard } from "@/components/apartment-card";

// Fix for default marker icons in webpack/vite
// biome-ignore lint/suspicious/noExplicitAny: Leaflet icon fix requires any
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom colored markers using SVG
function createColoredIcon(color: string): L.DivIcon {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="${color}" stroke="#333" stroke-width="1" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"/>
      <circle fill="white" cx="12" cy="12" r="5"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

// Marker colors based on status
const markerColors = {
  risposto: "#22c55e", // green
  contattato: "#eab308", // yellow
  default: "#6b7280", // gray
  destination: "#3b82f6", // blue
};

// Helper to create cluster icon with status indicators
function createClusterIcon(
  // biome-ignore lint/suspicious/noExplicitAny: MarkerCluster type from react-leaflet-cluster
  cluster: any,
  apartments: Apartment[]
): L.DivIcon {
  const childMarkers = cluster.getAllChildMarkers();
  const count = childMarkers.length;

  // Count contacted and responded apartments in cluster
  let rispostoCount = 0;
  let contattatoCount = 0;

  for (const marker of childMarkers) {
    const latlng = marker.getLatLng();
    const apt = apartments.find(
      (a) => a.latitudine === latlng.lat && a.longitudine === latlng.lng
    );
    if (apt?.risposto) {
      rispostoCount++;
    } else if (apt?.contattato) {
      contattatoCount++;
    }
  }

  // Determine cluster color based on content
  let bgColor = markerColors.default;
  let borderColor = "#374151";
  if (rispostoCount > 0) {
    bgColor = markerColors.risposto;
    borderColor = "#15803d";
  } else if (contattatoCount > 0) {
    bgColor = markerColors.contattato;
    borderColor = "#a16207";
  }

  // Build status indicator dots
  const dots: string[] = [];
  if (rispostoCount > 0) {
    dots.push(
      `<span style="background:${markerColors.risposto}" class="cluster-dot"></span>`
    );
  }
  if (contattatoCount > 0) {
    dots.push(
      `<span style="background:${markerColors.contattato}" class="cluster-dot"></span>`
    );
  }
  const dotsHtml =
    dots.length > 0 ? `<div class="cluster-dots">${dots.join("")}</div>` : "";

  return L.divIcon({
    html: `<div class="cluster-icon" style="background:${bgColor};border-color:${borderColor}">${count}${dotsHtml}</div>`,
    className: "custom-cluster-icon",
    iconSize: L.point(44, 44, true),
  });
}

interface Apartment {
  id: number;
  luogo: string;
  indirizzo?: string | null;
  latitudine: number | null;
  longitudine: number | null;
  tipoAlloggio: string;
  tipoStanza?: string | null;
  numeroStanze?: number | null;
  costoAffitto?: number | null;
  costoUtenze?: number | null;
  costoAltro?: number | null;
  contattato?: boolean | null;
  risposto?: boolean | null;
  postoAuto?: boolean | null;
  disponibileDa?: string | null;
  riferimento?: string | null;
  contatti?: { id: number; tipo: string; valore: string }[];
}

interface ApartmentMapProps {
  apartments: Apartment[];
  destination: { name: string; lat: number; lng: number } | null;
  onEditApartment: (id: number) => void;
  onDeleteApartment: (id: number) => void;
}

// Helper component to fit bounds
function FitBounds({ apartments }: { apartments: Apartment[] }) {
  const map = useMap();

  useEffect(() => {
    if (apartments.length > 0) {
      const bounds = L.latLngBounds(
        apartments.map((apt) => [
          apt.latitudine as number,
          apt.longitudine as number,
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [apartments, map]);

  return null;
}

export function ApartmentMap({
  apartments,
  destination,
  onEditApartment,
  onDeleteApartment,
}: ApartmentMapProps) {
  // Filter apartments that have coordinates
  const mappableApartments = apartments.filter(
    (apt) => apt.latitudine !== null && apt.longitudine !== null
  );

  // Calculate center of map (default to Trento if no apartments)
  const defaultCenter: LatLngExpression = [46.0679, 11.1211]; // Trento center
  const center: LatLngExpression =
    mappableApartments.length > 0
      ? [
          mappableApartments.reduce(
            (sum, apt) => sum + (apt.latitudine ?? 0),
            0
          ) / mappableApartments.length,
          mappableApartments.reduce(
            (sum, apt) => sum + (apt.longitudine ?? 0),
            0
          ) / mappableApartments.length,
        ]
      : defaultCenter;

  const getMarkerIcon = (apt: Apartment): L.DivIcon => {
    if (apt.risposto) {
      return createColoredIcon(markerColors.risposto);
    }
    if (apt.contattato) {
      return createColoredIcon(markerColors.contattato);
    }
    return createColoredIcon(markerColors.default);
  };

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-lg border">
      {mappableApartments.length === 0 && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-background/80">
          <p className="text-muted-foreground">
            Nessun appartamento con coordinate. Aggiungi latitudine e
            longitudine per visualizzarli sulla mappa.
          </p>
        </div>
      )}

      <MapContainer
        center={center}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds to show all apartments */}
        {mappableApartments.length > 0 && (
          <FitBounds apartments={mappableApartments} />
        )}

        {/* Destination marker (single, if selected) */}
        {destination && (
          <Marker
            icon={createColoredIcon(markerColors.destination)}
            position={[destination.lat, destination.lng]}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-semibold text-sm">{destination.name}</h3>
                <p className="text-muted-foreground text-xs">Destinazione</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clustered apartment markers */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) =>
            createClusterIcon(cluster, mappableApartments)
          }
        >
          {mappableApartments.map((apt) => (
            <Marker
              icon={getMarkerIcon(apt)}
              key={`apt-${apt.id}`}
              position={[apt.latitudine as number, apt.longitudine as number]}
            >
              <Popup>
                <ApartmentCard
                  apartment={apt}
                  compact
                  onDelete={() => onDeleteApartment(apt.id)}
                  onEdit={() => onEditApartment(apt.id)}
                />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend */}
      <div className="absolute right-2 bottom-2 z-1000 rounded border bg-background/95 p-2 text-xs shadow-lg">
        <div className="mb-1 font-medium">Legenda</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: markerColors.risposto }}
            />
            <span>Risposto</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: markerColors.contattato }}
            />
            <span>Contattato</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: markerColors.default }}
            />
            <span>Da contattare</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: markerColors.destination }}
            />
            <span>Destinazione</span>
          </div>
        </div>
      </div>

      {/* Apartment count */}
      <div className="absolute bottom-2 left-2 z-1000 rounded border bg-background/95 px-2 py-1 text-xs shadow-lg">
        {mappableApartments.length} / {apartments.length} sulla mappa
      </div>
    </div>
  );
}
