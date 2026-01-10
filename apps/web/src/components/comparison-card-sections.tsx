import { Car, ExternalLink, Phone, Users } from "lucide-react";

interface Contact {
  id: number;
  tipo: string;
  valore: string;
}

interface CostSectionProps {
  costoAffitto?: number | null;
  costoUtenze?: number | null;
  costoAltro?: number | null;
}

export function CostSection({
  costoAffitto,
  costoUtenze,
  costoAltro,
}: CostSectionProps) {
  const total = (costoAffitto ?? 0) + (costoUtenze ?? 0) + (costoAltro ?? 0);
  const formattedTotal = total > 0 ? `${total}€/mese` : "N/A";

  const parts: string[] = [];
  if (costoAffitto) {
    parts.push(`${costoAffitto}€ affitto`);
  }
  if (costoUtenze) {
    parts.push(`${costoUtenze}€ utenze`);
  }
  if (costoAltro) {
    parts.push(`${costoAltro}€ altro`);
  }
  const details = parts.join(" + ");

  return (
    <div className="rounded border bg-muted/50 p-3">
      <div className="mb-1 text-muted-foreground text-xs">Costo totale</div>
      <div className="font-semibold text-lg">{formattedTotal}</div>
      {details && (
        <div className="mt-1 text-muted-foreground text-xs">{details}</div>
      )}
    </div>
  );
}

interface FeaturesSectionProps {
  tipoAlloggio: string;
  tipoStanza?: string | null;
  numeroStanze?: number | null;
  postoAuto?: boolean;
  disponibileDa?: string | null;
}

export function FeaturesSection({
  tipoAlloggio,
  tipoStanza,
  numeroStanze,
  postoAuto,
  disponibileDa,
}: FeaturesSectionProps) {
  const roommates = numeroStanze ? numeroStanze - 1 : null;

  return (
    <div className="space-y-2">
      <ComparisonRow label="Tipo" value={tipoAlloggio} />
      {tipoStanza && <ComparisonRow label="Stanza" value={tipoStanza} />}
      {numeroStanze && (
        <ComparisonRow label="N. stanze" value={numeroStanze.toString()} />
      )}
      {roommates !== null && roommates > 0 && (
        <ComparisonRow
          icon={<Users className="h-3 w-3" />}
          label="Coinquilini"
          value={`${roommates}`}
        />
      )}
      <ComparisonRow
        icon={postoAuto ? <Car className="h-3 w-3" /> : undefined}
        label="Posto auto"
        value={postoAuto ? "Sì" : "No"}
      />
      {disponibileDa && (
        <ComparisonRow label="Disponibile" value={disponibileDa} />
      )}
    </div>
  );
}

interface TravelTimesSectionProps {
  walkingTime?: number;
  distance?: number;
  transitTime?: number;
  isApproximate?: boolean;
}

export function TravelTimesSection({
  walkingTime,
  distance,
  transitTime,
  isApproximate,
}: TravelTimesSectionProps) {
  return (
    <div className="space-y-2 rounded border bg-blue-50 p-2 dark:bg-blue-950">
      <div className="mb-1 font-medium text-xs">Distanze</div>
      {walkingTime && (
        <div className="flex items-center gap-1 text-xs">
          🚶<span className="font-medium">~{walkingTime} min a piedi</span>
          {distance && (
            <span className="text-muted-foreground">({distance}m)</span>
          )}
        </div>
      )}
      {transitTime && (
        <div className="flex items-center gap-1 text-xs">
          🚌<span className="font-medium">~{transitTime} min con mezzi</span>
          {isApproximate && (
            <span className="text-muted-foreground">(stima)</span>
          )}
        </div>
      )}
    </div>
  );
}

interface ContactsSectionProps {
  contatti?: Contact[];
}

function renderContactLink(contact: Contact) {
  if (contact.tipo === "telefono") {
    return (
      <a
        className="text-primary hover:underline"
        href={`tel:${contact.valore}`}
      >
        {contact.valore}
      </a>
    );
  }
  if (contact.tipo === "email") {
    return (
      <a
        className="text-primary hover:underline"
        href={`mailto:${contact.valore}`}
      >
        {contact.valore}
      </a>
    );
  }
  return <span>{contact.valore}</span>;
}

export function ContactsSection({ contatti }: ContactsSectionProps) {
  if (!contatti || contatti.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 rounded border p-2">
      <div className="mb-1 font-medium text-xs">Contatti</div>
      {contatti.map((c) => (
        <div className="flex items-center gap-1 text-xs" key={c.id}>
          {c.tipo === "telefono" && <Phone className="h-3 w-3" />}
          {renderContactLink(c)}
        </div>
      ))}
    </div>
  );
}

interface StatusSectionProps {
  contattato?: boolean;
  risposto?: boolean;
}

export function StatusSection({ contattato, risposto }: StatusSectionProps) {
  return (
    <div className="space-y-1 rounded border p-2">
      <div className="mb-1 font-medium text-xs">Stato</div>
      <div className="flex flex-col gap-1 text-xs">
        <span
          className={contattato ? "text-green-600" : "text-muted-foreground"}
        >
          {contattato ? "✓ Contattato" : "Non contattato"}
        </span>
        {contattato && (
          <span
            className={risposto ? "text-green-600" : "text-muted-foreground"}
          >
            {risposto ? "✓ Risposto" : "No risposta"}
          </span>
        )}
      </div>
    </div>
  );
}

interface ReferenceLinkProps {
  riferimento?: string | null;
}

export function ReferenceLink({ riferimento }: ReferenceLinkProps) {
  if (!riferimento) {
    return null;
  }

  return (
    <a
      className="flex items-center gap-1 text-primary text-xs hover:underline"
      href={riferimento}
      rel="noopener"
      target="_blank"
    >
      <ExternalLink className="h-3 w-3" />
      Vedi annuncio
    </a>
  );
}

interface NotesSectionProps {
  note?: string | null;
}

export function NotesSection({ note }: NotesSectionProps) {
  if (!note) {
    return null;
  }

  return (
    <div className="rounded border bg-muted/30 p-2">
      <div className="mb-1 font-medium text-xs">Note</div>
      <p className="text-muted-foreground text-xs">{note}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="flex items-center gap-1 font-medium">
        {icon}
        {value}
      </span>
    </div>
  );
}
