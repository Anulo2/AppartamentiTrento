import { Car, Edit2, ExternalLink, Printer, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusInfo {
  contattato?: boolean | null;
  risposto?: boolean | null;
}

export function getApartmentCardStyle(status: StatusInfo): string {
  if (status.risposto) {
    return "!bg-replied border-l-4 !border-l-replied-foreground/40 transition-colors";
  }
  if (status.contattato) {
    return "!bg-contacted border-l-4 !border-l-contacted-foreground/40 transition-colors";
  }
  return "";
}

interface ApartmentNameInfo {
  indirizzo?: string | null;
  luogo: string;
}

export function getApartmentDisplayName(apartment: ApartmentNameInfo): string {
  return apartment.indirizzo || apartment.luogo;
}

interface CostInfo {
  costoAffitto?: number | null;
  costoUtenze?: number | null;
  costoAltro?: number | null;
}

export function calculateTotalCost(costs: CostInfo): number {
  return (
    (costs.costoAffitto ?? 0) +
    (costs.costoUtenze ?? 0) +
    (costs.costoAltro ?? 0)
  );
}

export function formatCostDisplay(costs: CostInfo): string {
  const total = calculateTotalCost(costs);
  return total > 0 ? `${total}€/mese` : "—";
}

export function formatCostBreakdown(costs: CostInfo): string {
  const parts: string[] = [];
  if (costs.costoAffitto) {
    parts.push(`${costs.costoAffitto}€ affitto`);
  }
  if (costs.costoUtenze) {
    parts.push(`${costs.costoUtenze}€ utenze`);
  }
  if (costs.costoAltro) {
    parts.push(`${costs.costoAltro}€ altro`);
  }
  return parts.join(" + ");
}

interface ApartmentDetailsProps {
  tipoAlloggio: string;
  tipoStanza?: string | null;
  numeroStanze?: number | null;
  postoAuto?: boolean;
  disponibileDa?: string | null;
}

export function ApartmentDetails({
  tipoAlloggio,
  tipoStanza,
  numeroStanze,
  postoAuto,
  disponibileDa,
}: ApartmentDetailsProps) {
  const roommates = numeroStanze ? numeroStanze - 1 : null;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded bg-secondary px-2 py-1">{tipoAlloggio}</span>
      {tipoStanza && (
        <span className="rounded border px-2 py-1">{tipoStanza}</span>
      )}
      {numeroStanze && (
        <span className="rounded border px-2 py-1">{numeroStanze} stanze</span>
      )}
      {roommates !== null && roommates > 0 && (
        <span className="flex items-center gap-1 rounded border px-2 py-1">
          <Users className="h-3 w-3" />
          {roommates} coinquil.
        </span>
      )}
      {postoAuto && (
        <span className="flex items-center gap-1 rounded border px-2 py-1">
          <Car className="h-3 w-3" />
          Posto auto
        </span>
      )}
      {disponibileDa && (
        <span className="rounded border px-2 py-1">Da: {disponibileDa}</span>
      )}
    </div>
  );
}

interface TravelInfoProps {
  walkingTime?: number | null;
  transitTime?: number | null;
  isLoading: boolean;
}

export function TravelInfo({
  walkingTime,
  transitTime,
  isLoading,
}: TravelInfoProps) {
  if (isLoading) {
    return <div className="text-muted-foreground text-xs">Calcolo...</div>;
  }

  if (!(walkingTime || transitTime)) {
    return null;
  }

  return (
    <div className="space-y-1 rounded border bg-blue-50 p-2 text-xs dark:bg-blue-950">
      {walkingTime && (
        <div className="flex items-center gap-1">
          🚶 <span className="font-medium">~{walkingTime} min a piedi</span>
        </div>
      )}
      {transitTime && (
        <div className="flex items-center gap-1">
          🚌 <span className="font-medium">~{transitTime} min con mezzi</span>
        </div>
      )}
    </div>
  );
}

interface StatusBadgesProps {
  contattato?: boolean;
  risposto?: boolean;
}

export function StatusBadges({ contattato, risposto }: StatusBadgesProps) {
  return (
    <div className="flex gap-2">
      <span className={contattato ? "text-green-600" : "text-muted-foreground"}>
        {contattato ? "✓ Contattato" : "Non contattato"}
      </span>
      {contattato && (
        <span className={risposto ? "text-green-600" : "text-muted-foreground"}>
          {risposto ? "✓ Risposto" : "No risposta"}
        </span>
      )}
    </div>
  );
}

interface ContactInfo {
  id: number;
  tipo: string;
  valore: string;
}

interface ContactsListProps {
  contatti?: ContactInfo[];
}

function renderContact(contact: ContactInfo) {
  if (contact.tipo === "telefono") {
    return (
      <a
        className="text-primary hover:underline"
        href={`tel:${contact.valore}`}
      >
        📞 {contact.valore}
      </a>
    );
  }
  if (contact.tipo === "email") {
    return (
      <a
        className="text-primary hover:underline"
        href={`mailto:${contact.valore}`}
      >
        ✉️ {contact.valore}
      </a>
    );
  }
  return <span>👤 {contact.valore}</span>;
}

export function ContactsList({ contatti }: ContactsListProps) {
  if (!contatti || contatti.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="font-medium text-xs">Contatti:</div>
      {contatti.map((c) => (
        <div className="text-xs" key={c.id}>
          {renderContact(c)}
        </div>
      ))}
    </div>
  );
}

// Compact apartment card for map popups
interface ApartmentPopupCardProps {
  apartment: {
    id: number;
    luogo: string;
    indirizzo?: string | null;
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
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function ApartmentPopupCard({
  apartment,
  onEdit,
  onDelete,
}: ApartmentPopupCardProps) {
  const cardStyle = getApartmentCardStyle({
    contattato: apartment.contattato,
    risposto: apartment.risposto,
  });

  return (
    <Card className={`min-w-[280px] border-0 shadow-none ${cardStyle}`}>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm">
          {getApartmentDisplayName(apartment)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0 text-xs">
        {/* Cost */}
        <div>
          <div className="font-semibold text-base">
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

        <StatusBadges
          contattato={apartment.contattato ?? undefined}
          risposto={apartment.risposto ?? undefined}
        />

        <ContactsList contatti={apartment.contatti} />

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex gap-1">
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
          {apartment.riferimento && (
            <a
              className="flex items-center gap-1 text-primary text-xs hover:underline"
              href={apartment.riferimento}
              rel="noopener"
              target="_blank"
            >
              <ExternalLink className="h-3 w-3" />
              Link
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
