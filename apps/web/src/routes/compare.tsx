import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";

import {
  getApartmentCardStyle,
  getApartmentDisplayName,
} from "@/components/apartment-card-helpers";
import {
  ContactsSection,
  CostSection,
  FeaturesSection,
  NotesSection,
  ReferenceLink,
  StatusSection,
  TravelTimesSection,
} from "@/components/comparison-card-sections";
import { DestinationSearch } from "@/components/destination-search";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDistanceCalculation } from "@/hooks/use-distance-calculation";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/compare")({
  component: CompareRoute,
  validateSearch: (search: Record<string, unknown>): { ids?: string } => {
    return {
      ids: typeof search.ids === "string" ? search.ids : undefined,
    };
  },
});

function CompareRoute() {
  const navigate = useNavigate();
  const { ids: idsParam } = Route.useSearch();
  const apartmentIds = idsParam
    ? idsParam.split(",").map((id) => Number.parseInt(id, 10))
    : [];

  const [selectedDestination, setSelectedDestination] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  const apartments = useQuery(orpc.apartment.getAll.queryOptions({}));

  const selectedApartments = apartments.data?.filter((apt) =>
    apartmentIds.includes(apt.id)
  );

  const removeApartment = (id: number) => {
    const newIds = apartmentIds.filter((aptId) => aptId !== id);
    if (newIds.length === 0) {
      navigate({ to: "/apartments" });
    } else {
      navigate({
        to: "/compare",
        search: { ids: newIds.join(",") },
      });
    }
  };

  const _selectClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Confronto Appartamenti</CardTitle>
              <CardDescription>
                Confronta {selectedApartments?.length || 0} appartamenti
              </CardDescription>
            </div>
            <Button
              onClick={() => navigate({ to: "/apartments" })}
              variant="ghost"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna alla lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Destination search */}
          <div className="mb-6 rounded border bg-muted/30 p-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">
                Calcola distanze verso una destinazione:
              </div>
              <DestinationSearch
                onClear={() => setSelectedDestination(null)}
                onSelect={(dest) => setSelectedDestination(dest)}
                selectedDestination={selectedDestination}
              />
            </div>
          </div>

          {!selectedApartments || selectedApartments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nessun appartamento selezionato per il confronto
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-muted-foreground">Legenda:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded border bg-card" />
                  <span>Non contattato</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded border border-contacted-foreground/40 bg-contacted" />
                  <span>Contattato</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded border border-replied-foreground/40 bg-replied" />
                  <span>Risposto</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="grid min-w-[800px] grid-cols-2 gap-4 lg:grid-cols-3">
                  {selectedApartments.map((apt) => (
                    <ComparisonCard
                      apartment={apt}
                      destination={selectedDestination}
                      key={apt.id}
                      onRemove={() => removeApartment(apt.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type ApartmentType = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof orpc.apartment.getAll.queryOptions>["queryFn"]>
  >
>[0];

function ComparisonCard({
  apartment,
  destination,
  onRemove,
}: {
  apartment: ApartmentType;
  destination: { name: string; lat: number; lng: number } | null;
  onRemove: () => void;
}) {
  const hasCoordinates = !!apartment.latitudine && !!apartment.longitudine;
  const { walkingTime, transitTime, isLoading } = useDistanceCalculation({
    apartmentId: apartment.id,
    destination,
    hasCoordinates,
  });

  const showTravelTimes = destination && hasCoordinates && !isLoading;

  const cardStyle = getApartmentCardStyle({
    contattato: apartment.contattato,
    risposto: apartment.risposto,
  });

  return (
    <Card className={`flex flex-col ${cardStyle}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">
              {getApartmentDisplayName(apartment)}
            </CardTitle>
            <CardDescription className="text-xs">
              {apartment.tipoAlloggio}
              {apartment.tipoStanza && ` - ${apartment.tipoStanza}`}
            </CardDescription>
          </div>
          <Button
            aria-label="Rimuovi dal confronto"
            onClick={onRemove}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        <CostSection
          costoAffitto={apartment.costoAffitto}
          costoAltro={apartment.costoAltro}
          costoUtenze={apartment.costoUtenze}
        />

        <FeaturesSection
          disponibileDa={apartment.disponibileDa}
          numeroStanze={apartment.numeroStanze}
          postoAuto={apartment.postoAuto}
          tipoAlloggio={apartment.tipoAlloggio}
          tipoStanza={apartment.tipoStanza}
        />

        {showTravelTimes && (
          <TravelTimesSection
            transitTime={transitTime}
            walkingTime={walkingTime}
          />
        )}

        <ContactsSection contatti={apartment.contatti} />

        <StatusSection
          contattato={apartment.contattato}
          risposto={apartment.risposto}
        />

        <ReferenceLink riferimento={apartment.riferimento} />

        <NotesSection note={apartment.note} />
      </CardContent>
    </Card>
  );
}
