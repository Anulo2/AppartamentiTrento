import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  ExternalLink,
  GitCompare,
  List,
  Loader2,
  Map as MapIcon,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { lazy, Suspense, useRef, useState } from "react";
import { toast } from "sonner";

import {
  ApartmentDetails,
  ContactsList,
  formatCostBreakdown,
  formatCostDisplay,
  getApartmentCardStyle,
  getApartmentDisplayName,
  TravelInfo,
} from "@/components/apartment-card-helpers";
import { ApartmentForm } from "@/components/apartment-form";
import { DestinationSearch } from "@/components/destination-search";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDistanceCalculation } from "@/hooks/use-distance-calculation";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Lazy load map component to avoid SSR issues with Leaflet
const ApartmentMap = lazy(() =>
  import("@/components/apartment-map").then((mod) => ({
    default: mod.ApartmentMap,
  }))
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/apartments")({
  component: ApartmentsRoute,
});

type SortField = "costo" | "luogo" | "createdAt" | "disponibileDa";
type SortOrder = "asc" | "desc";
type ViewMode = "list" | "map";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Route component con molti handler di stato e logica UI
function ApartmentsRoute() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<number | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedApartments, setSelectedApartments] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    tipoAlloggio: "",
    tipoStanza: "",
    contattato: "",
    risposto: "",
    postoAuto: "",
    locationSearch: "",
    maxWalkingMinutes: "",
    maxTransitMinutes: "",
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [apartmentToDelete, setApartmentToDelete] = useState<number | null>(
    null
  );
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    order: SortOrder;
  }>({
    field: "createdAt",
    order: "desc",
  });

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingApartment(null);
    apartments.refetch();
  };

  const handleFormCancel = () => {
    setDialogOpen(false);
    setEditingApartment(null);
  };

  const handleNewApartment = () => {
    setEditingApartment(null);
    setDialogOpen(true);
  };

  const handleEditApartment = (id: number) => {
    setEditingApartment(id);
    setDialogOpen(true);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      description: "Nuovo appartamento",
      handler: handleNewApartment,
      requiresNoModifiers: true,
    },
    {
      key: "/",
      description: "Cerca zona",
      handler: () => {
        searchInputRef.current?.focus();
      },
      requiresNoModifiers: true,
    },
    {
      key: "m",
      description: "Cambia vista",
      handler: () => {
        setViewMode((prev) => (prev === "list" ? "map" : "list"));
      },
      requiresNoModifiers: true,
    },
    {
      key: "s",
      description: "Vai a Statistiche",
      handler: () => {
        navigate({ to: "/stats" });
      },
      requiresNoModifiers: true,
    },
    {
      key: "Escape",
      description: "Chiudi dialog",
      handler: () => {
        if (dialogOpen) {
          setDialogOpen(false);
          setEditingApartment(null);
        }
      },
      requiresNoModifiers: true,
    },
  ]);

  const apartments = useQuery(
    orpc.apartment.getAll.queryOptions({
      input: {
        tipoAlloggio: filters.tipoAlloggio || undefined,
        tipoStanza: filters.tipoStanza || undefined,
        contattato: (() => {
          if (filters.contattato === "true") {
            return true;
          }
          if (filters.contattato === "false") {
            return false;
          }
          return undefined;
        })(),
        risposto: (() => {
          if (filters.risposto === "true") {
            return true;
          }
          if (filters.risposto === "false") {
            return false;
          }
          return undefined;
        })(),
        postoAuto: (() => {
          if (filters.postoAuto === "true") {
            return true;
          }
          if (filters.postoAuto === "false") {
            return false;
          }
          return undefined;
        })(),
        locationSearch: filters.locationSearch || undefined,
        minCosto: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxCosto: priceRange[1] < 1000 ? priceRange[1] : undefined,
        maxWalkingMinutes: (() => {
          const parsed = Number.parseInt(filters.maxWalkingMinutes, 10);
          return Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined;
        })(),
        maxTransitMinutes: (() => {
          const parsed = Number.parseInt(filters.maxTransitMinutes, 10);
          return Number.isFinite(parsed) && parsed >= 1 ? parsed : undefined;
        })(),
        destinationLat: selectedDestination?.lat,
        destinationLng: selectedDestination?.lng,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.order,
      },
    })
  );

  const deleteMutation = useMutation(
    orpc.apartment.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Appartamento eliminato");
        apartments.refetch();
        setDeleteDialogOpen(false);
        setApartmentToDelete(null);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Errore nell'eliminazione");
      },
    })
  );

  const handleDelete = (id: number) => {
    setApartmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (apartmentToDelete !== null) {
      deleteMutation.mutate({ id: apartmentToDelete });
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const toggleApartmentSelection = (id: number) => {
    setSelectedApartments((prev) =>
      prev.includes(id) ? prev.filter((aptId) => aptId !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedApartments.length >= 2) {
      navigate({
        to: "/compare",
        search: { ids: selectedApartments.join(",") },
      });
    }
  };

  const editingApartmentData =
    editingApartment !== null
      ? apartments.data?.find(
          (apt: { id: number }) => apt.id === editingApartment
        )
      : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Appartamenti Trento</CardTitle>
              <CardDescription className="hidden sm:block">
                Gestisci la tua ricerca appartamenti
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* View Toggle */}
              <div className="flex flex-1 rounded-md border sm:flex-initial">
                <Button
                  className="flex-1 rounded-r-none sm:flex-initial"
                  onClick={() => setViewMode("list")}
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                >
                  <List className="h-4 w-4 sm:mr-1" />
                  <span className="ml-1 sm:ml-0">Lista</span>
                </Button>
                <Button
                  className="flex-1 rounded-l-none sm:flex-initial"
                  onClick={() => setViewMode("map")}
                  size="sm"
                  variant={viewMode === "map" ? "default" : "ghost"}
                >
                  <MapIcon className="h-4 w-4 sm:mr-1" />
                  <span className="ml-1 sm:ml-0">Mappa</span>
                </Button>
              </div>
              <Button
                className="flex-1 sm:flex-initial"
                onClick={handleNewApartment}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuovo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="w-full space-y-2 sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="location-search">Cerca zona</Label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    id="location-search"
                    onChange={(e) =>
                      setFilters({ ...filters, locationSearch: e.target.value })
                    }
                    placeholder="Cerca... (premi /)"
                    ref={searchInputRef}
                    value={filters.locationSearch}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo-filter">Tipo</Label>
                <Select
                  defaultValue=""
                  onValueChange={(value) =>
                    setFilters({ ...filters, tipoAlloggio: value ?? "" })
                  }
                  value={filters.tipoAlloggio}
                >
                  <SelectTrigger
                    className="w-full"
                    id="tipo-filter"
                    suppressHydrationWarning
                  >
                    <SelectValue suppressHydrationWarning>
                      {filters.tipoAlloggio || "Tutti"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti</SelectItem>
                    <SelectItem value="Stanza">Stanza</SelectItem>
                    <SelectItem value="Appartamento">Appartamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stanza-filter">Stanza</Label>
                <Select
                  defaultValue=""
                  onValueChange={(value) =>
                    setFilters({ ...filters, tipoStanza: value ?? "" })
                  }
                  value={filters.tipoStanza}
                >
                  <SelectTrigger
                    className="w-full"
                    id="stanza-filter"
                    suppressHydrationWarning
                  >
                    <SelectValue suppressHydrationWarning>
                      {filters.tipoStanza || "Tutte"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutte</SelectItem>
                    <SelectItem value="Singola">Singola</SelectItem>
                    <SelectItem value="Doppia">Doppia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contattato-filter">Contattato</Label>
                <ToggleGroup
                  className="h-9 w-fit"
                  onValueChange={(values) =>
                    setFilters({ ...filters, contattato: values[0] ?? "" })
                  }
                  value={filters.contattato ? [filters.contattato] : []}
                  variant="outline"
                >
                  <ToggleGroupItem aria-label="Tutti" value="">
                    Tutti
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Contattato: Sì" value="true">
                    Sì
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Contattato: No" value="false">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risposto-filter">Risposto</Label>
                <ToggleGroup
                  className="h-9 w-fit"
                  onValueChange={(values) =>
                    setFilters({ ...filters, risposto: values[0] ?? "" })
                  }
                  value={filters.risposto ? [filters.risposto] : []}
                  variant="outline"
                >
                  <ToggleGroupItem aria-label="Tutti" value="">
                    Tutti
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Risposto: Sì" value="true">
                    Sì
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Risposto: No" value="false">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="posto-auto-filter">Posto auto</Label>
                <ToggleGroup
                  className="h-9 w-fit"
                  onValueChange={(values) =>
                    setFilters({ ...filters, postoAuto: values[0] ?? "" })
                  }
                  value={filters.postoAuto ? [filters.postoAuto] : []}
                  variant="outline"
                >
                  <ToggleGroupItem aria-label="Tutti" value="">
                    Tutti
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Posto auto: Sì" value="true">
                    Sì
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="Posto auto: No" value="false">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="w-full space-y-2 sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="price-range">
                  Range prezzo: €{priceRange[0]} - €{priceRange[1]}
                  {priceRange[1] >= 1000 ? "+" : ""}
                </Label>
                <Slider
                  className="mt-2"
                  id="price-range"
                  max={1000}
                  min={0}
                  onValueChange={(value) =>
                    setPriceRange(value as [number, number])
                  }
                  step={50}
                  value={priceRange}
                />
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>€0</span>
                  <span>€1000+</span>
                </div>
              </div>
            </div>

            {/* Destination search for distance calculation */}
            <div className="space-y-3 rounded border bg-muted/30 p-3 sm:p-4">
              <div className="space-y-2">
                <Label>Calcola distanze verso una destinazione:</Label>
                <DestinationSearch
                  onClear={() => setSelectedDestination(null)}
                  onSelect={(dest) => setSelectedDestination(dest)}
                  selectedDestination={selectedDestination}
                />
              </div>

              {selectedDestination && (
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-2">
                    <Label htmlFor="max-walking-minutes">
                      Distanza max a piedi: {filters.maxWalkingMinutes || "∞"}{" "}
                      min
                    </Label>
                    <Input
                      id="max-walking-minutes"
                      max="60"
                      min="5"
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          maxWalkingMinutes: e.target.value,
                        })
                      }
                      placeholder="es. 20"
                      step="5"
                      type="number"
                      value={filters.maxWalkingMinutes}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-transit-minutes">
                      Distanza max con mezzi: {filters.maxTransitMinutes || "∞"}{" "}
                      min
                    </Label>
                    <Input
                      id="max-transit-minutes"
                      max="60"
                      min="5"
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          maxTransitMinutes: e.target.value,
                        })
                      }
                      placeholder="es. 15"
                      step="5"
                      type="number"
                      value={filters.maxTransitMinutes}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Apartments List or Map */}
          {(() => {
            if (apartments.isLoading) {
              return (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              );
            }

            if (apartments.data?.length === 0) {
              return (
                <p className="py-8 text-center text-muted-foreground">
                  Nessun appartamento trovato. Aggiungine uno!
                </p>
              );
            }

            if (viewMode === "map") {
              return (
                /* Map View */
                <Suspense
                  fallback={
                    <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted/30">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  }
                >
                  <ApartmentMap
                    apartments={apartments.data ?? []}
                    destination={selectedDestination}
                    onDeleteApartment={handleDelete}
                    onEditApartment={handleEditApartment}
                  />
                </Suspense>
              );
            }

            /* List View */
            return (
              <div className="space-y-4">
                {/* Sort buttons */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Ordina per:</span>
                  <SortButton
                    current={sortConfig}
                    field="luogo"
                    onClick={handleSort}
                  >
                    Zona
                  </SortButton>
                  <SortButton
                    current={sortConfig}
                    field="costo"
                    onClick={handleSort}
                  >
                    Costo
                  </SortButton>
                  <SortButton
                    current={sortConfig}
                    field="createdAt"
                    onClick={handleSort}
                  >
                    Data
                  </SortButton>
                </div>

                {/* Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {apartments.data?.map((apt: ApartmentType) => (
                    <ApartmentCard
                      apartment={apt}
                      destination={selectedDestination}
                      isSelected={selectedApartments.includes(apt.id)}
                      key={apt.id}
                      onDelete={() => handleDelete(apt.id)}
                      onEdit={() => handleEditApartment(apt.id)}
                      onToggleSelection={() => toggleApartmentSelection(apt.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })()}

          {apartments.data && apartments.data.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-muted-foreground text-sm">
                {apartments.data.length} appartament
                {apartments.data.length !== 1 ? "i" : "o"}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Compare Button */}
      {selectedApartments.length >= 2 && (
        <div className="fixed right-6 bottom-6 z-50">
          <Button className="shadow-lg" onClick={handleCompare} size="lg">
            <GitCompare className="mr-2 h-5 w-5" />
            Confronta {selectedApartments.length}
          </Button>
        </div>
      )}

      {/* Drawer for Add/Edit Apartment */}
      <Drawer onOpenChange={setDialogOpen} open={dialogOpen}>
        <DrawerContent className="max-h-screen" side="right">
          <DrawerHeader>
            <DrawerTitle>
              {editingApartment
                ? "Modifica Appartamento"
                : "Nuovo Appartamento"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-6 pb-6">
            <ApartmentForm
              apartment={editingApartmentData}
              onCancel={handleFormCancel}
              onSuccess={handleFormSuccess}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l'appartamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'appartamento e tutti i
              suoi contatti verranno eliminati definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                "Elimina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortButton({
  field,
  current,
  onClick,
  children,
}: {
  field: SortField;
  current: { field: SortField; order: SortOrder };
  onClick: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = current.field === field;
  return (
    <button
      className={`flex min-h-[44px] items-center gap-1 rounded px-3 py-2 transition-colors sm:min-h-0 sm:px-2 sm:py-1 ${
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
      onClick={() => onClick(field)}
      type="button"
    >
      {children}
      {isActive &&
        (current.order === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        ))}
    </button>
  );
}

type ApartmentType = NonNullable<
  Awaited<
    ReturnType<ReturnType<typeof orpc.apartment.getAll.queryOptions>["queryFn"]>
  >
>[0];

function ApartmentCard({
  apartment,
  destination,
  onEdit,
  onDelete,
  onToggleSelection,
  isSelected,
}: {
  apartment: ApartmentType;
  destination: { name: string; lat: number; lng: number } | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSelection: () => void;
  isSelected: boolean;
}) {
  const hasCoordinates = !!apartment.latitudine && !!apartment.longitudine;
  const { walkingTime, transitTime, isLoading } = useDistanceCalculation({
    apartmentId: apartment.id,
    destination,
    hasCoordinates,
  });

  const showTravelInfo = destination && hasCoordinates;

  const cardStyle = getApartmentCardStyle({
    contattato: apartment.contattato,
    risposto: apartment.risposto,
  });

  return (
    <Card
      className={`relative flex flex-col gap-0 ${cardStyle} ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      {/* Action buttons - absolute positioned */}
      <div className="no-print absolute top-2 right-2 flex flex-col">
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

      <CardHeader className="pr-12 pb-1">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            className="no-print"
            id={`select-${apartment.id}`}
            onCheckedChange={onToggleSelection}
          />
          <CardTitle className="text-base">
            {getApartmentDisplayName(apartment)}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pt-0 text-sm">
        {/* Cost */}
        <div>
          <div className="font-semibold text-lg">
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

        {apartment.note && (
          <p className="text-muted-foreground text-xs italic">
            {apartment.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
