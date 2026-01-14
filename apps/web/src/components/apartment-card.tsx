import { Edit2, ExternalLink, Printer, Trash2 } from "lucide-react";

import {
  ApartmentDetails,
  ContactsList,
  formatCostBreakdown,
  formatCostDisplay,
  getApartmentCardStyle,
  getApartmentDisplayName,
  TravelInfo,
} from "@/components/apartment-card-helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useDistanceCalculation } from "@/hooks/use-distance-calculation";

export interface ApartmentCardData {
  id: number;
  luogo: string;
  indirizzo?: string | null;
  latitudine?: number | null;
  longitudine?: number | null;
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
  note?: string | null;
  contatti?: { id: number; tipo: string; valore: string }[];
}

interface ApartmentCardProps {
  apartment: ApartmentCardData;
  destination?: { name: string; lat: number; lng: number } | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSelection?: () => void;
  isSelected?: boolean;
  /** Compact mode for map popups - hides checkbox and some elements */
  compact?: boolean;
}

export function ApartmentCard({
  apartment,
  destination,
  onEdit,
  onDelete,
  onToggleSelection,
  isSelected = false,
  compact = false,
}: ApartmentCardProps) {
  const hasCoordinates = !!apartment.latitudine && !!apartment.longitudine;
  const { walkingTime, transitTime, isLoading } = useDistanceCalculation({
    apartmentId: apartment.id,
    destination: destination ?? null,
    hasCoordinates,
  });

  const showTravelInfo = destination && hasCoordinates && !compact;

  const cardStyle = getApartmentCardStyle({
    contattato: apartment.contattato,
    risposto: apartment.risposto,
  });

  return (
    <Card
      className={`relative flex flex-col gap-0 ${cardStyle} ${isSelected ? "ring-2 ring-primary" : ""} ${compact ? "min-w-[280px] border-0 shadow-none" : ""}`}
    >
      {/* Action buttons - absolute positioned */}
      <div
        className={`no-print absolute right-2 flex ${compact ? "top-1 flex-row gap-0" : "top-2 flex-col"}`}
      >
        <Button
          aria-label="Modifica"
          onClick={onEdit}
          size="icon"
          variant="ghost"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Elimina"
          onClick={onDelete}
          size="icon"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Stampa"
          onClick={() => window.print()}
          size="icon"
          variant="ghost"
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>

      <CardHeader className={compact ? "p-3 pr-28 pb-1" : "pr-12 pb-1"}>
        <div className="flex items-center gap-2">
          {!compact && onToggleSelection && (
            <Checkbox
              checked={isSelected}
              className="no-print"
              id={`select-${apartment.id}`}
              onCheckedChange={onToggleSelection}
            />
          )}
          <CardTitle className={compact ? "text-sm" : "text-base"}>
            {getApartmentDisplayName(apartment)}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent
        className={`flex-1 space-y-3 pt-0 ${compact ? "p-3 pt-0 text-xs" : "text-sm"}`}
      >
        {/* Cost */}
        <div>
          <div
            className={
              compact ? "font-semibold text-base" : "font-semibold text-lg"
            }
          >
            {formatCostDisplay({
              costoAffitto: apartment.costoAffitto,
              costoUtenze: apartment.costoUtenze,
              costoAltro: apartment.costoAltro,
            })}
          </div>
          {formatCostBreakdown({
            costoAffitto: apartment.costoAffitto,
            costoUtenze: apartment.costoUtenze,
            costoAltro: apartment.costoAltro,
          }) && (
            <div className="text-muted-foreground text-xs">
              {formatCostBreakdown({
                costoAffitto: apartment.costoAffitto,
                costoUtenze: apartment.costoUtenze,
                costoAltro: apartment.costoAltro,
              })}
            </div>
          )}
        </div>

        <ApartmentDetails
          disponibileDa={apartment.disponibileDa}
          numeroStanze={apartment.numeroStanze}
          postoAuto={apartment.postoAuto ?? undefined}
          tipoAlloggio={apartment.tipoAlloggio}
          tipoStanza={apartment.tipoStanza}
        />

        {showTravelInfo && (
          <TravelInfo
            isLoading={isLoading}
            transitTime={transitTime}
            walkingTime={walkingTime}
          />
        )}

        <ContactsList contatti={apartment.contatti} />

        {apartment.riferimento && (
          <a
            className="flex items-center gap-1 text-primary text-xs hover:underline"
            href={apartment.riferimento}
            rel="noopener"
            target="_blank"
          >
            <ExternalLink className="h-3 w-3" />
            Link annuncio
          </a>
        )}

        {!compact && apartment.note && (
          <p className="text-muted-foreground text-xs italic">
            {apartment.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
