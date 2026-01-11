import type { AppRouterClient } from "@AppartamentiTrento/api/routers/index";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { orpc } from "@/utils/orpc";

type Apartment = NonNullable<
  Awaited<ReturnType<AppRouterClient["apartment"]["getAll"]>>[0]
>;

interface Contact {
  tipo: "telefono" | "email" | "nome";
  valore: string;
}

interface ApartmentFormProps {
  apartment?: Apartment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Schema arktype per la validazione
const apartmentFormSchema = type({
  luogo: "string>=1",
  "indirizzo?": "string",
  "latitudine?": "string",
  "longitudine?": "string",
  tipoAlloggio: "string>=1",
  "tipoStanza?": "string",
  "numeroStanze?": "string",
  "costoAffitto?": "string",
  "costoUtenze?": "string",
  "costoAltro?": "string",
  "disponibileDa?": "string",
  postoAuto: "boolean",
  "riferimento?": "string",
  contattato: "boolean",
  risposto: "boolean",
  "note?": "string",
});

type FormValues = typeof apartmentFormSchema.infer;

// Helper to transform form values to API format
function transformFormToSubmitData(value: FormValues, contatti: Contact[]) {
  return {
    luogo: value.luogo.trim(),
    indirizzo: value.indirizzo?.trim() || null,
    latitudine: value.latitudine ? Number.parseFloat(value.latitudine) : null,
    longitudine: value.longitudine
      ? Number.parseFloat(value.longitudine)
      : null,
    tipoAlloggio: value.tipoAlloggio.trim(),
    tipoStanza: value.tipoStanza?.trim() || null,
    numeroStanze: value.numeroStanze
      ? Number.parseInt(value.numeroStanze, 10)
      : null,
    costoAffitto: value.costoAffitto
      ? Number.parseInt(value.costoAffitto, 10)
      : null,
    costoUtenze: value.costoUtenze
      ? Number.parseInt(value.costoUtenze, 10)
      : null,
    costoAltro: value.costoAltro ? Number.parseInt(value.costoAltro, 10) : null,
    disponibileDa: value.disponibileDa?.trim() || null,
    postoAuto: value.postoAuto,
    riferimento: value.riferimento?.trim() || null,
    contattato: value.contattato,
    risposto: value.risposto,
    note: value.note?.trim() || null,
    contatti: contatti.filter((c) => c.valore.trim() !== ""),
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: form component con logica complessa di gestione stato e validazione
export function ApartmentForm({
  apartment,
  onSuccess,
  onCancel,
}: ApartmentFormProps) {
  const [contatti, setContatti] = useState<Contact[]>(
    apartment?.contatti?.map((c: { tipo: string; valore: string }) => ({
      tipo: c.tipo as "telefono" | "email" | "nome",
      valore: c.valore,
    })) ?? []
  );

  // Address autocomplete state
  const [addressQuery, setAddressQuery] = useState(apartment?.indirizzo ?? "");
  const debouncedAddressQuery = useDebounce(addressQuery, 500);
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{ formatted: string; lat: number; lon: number; housenumber?: string }>
  >([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] =
    useState(false);
  const addressRef = useRef<HTMLDivElement>(null);

  const createMutation = useMutation(
    orpc.apartment.create.mutationOptions({
      onSuccess: () => {
        toast.success("Appartamento creato");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Errore nella creazione");
      },
    })
  );

  const updateMutation = useMutation(
    orpc.apartment.update.mutationOptions({
      onSuccess: () => {
        toast.success("Appartamento aggiornato");
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Errore nell'aggiornamento");
      },
    })
  );

  const geocodeMutation = useMutation(
    orpc.apartment.geocodeAddress.mutationOptions({
      onSuccess: (data) => {
        if (data.success && data.latitudine && data.longitudine) {
          form.setFieldValue("latitudine", data.latitudine.toString());
          form.setFieldValue("longitudine", data.longitudine.toString());
          toast.success("Coordinate trovate!");
        } else {
          toast.error(data.message || "Indirizzo non trovato");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Errore nel geocoding");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      luogo: apartment?.luogo ?? "",
      indirizzo: apartment?.indirizzo ?? "",
      latitudine: apartment?.latitudine?.toString() ?? "",
      longitudine: apartment?.longitudine?.toString() ?? "",
      tipoAlloggio: apartment?.tipoAlloggio ?? "",
      tipoStanza: apartment?.tipoStanza ?? "",
      numeroStanze: apartment?.numeroStanze?.toString() ?? "",
      costoAffitto: apartment?.costoAffitto?.toString() ?? "",
      costoUtenze: apartment?.costoUtenze?.toString() ?? "",
      costoAltro: apartment?.costoAltro?.toString() ?? "",
      disponibileDa: apartment?.disponibileDa ?? "",
      postoAuto: apartment?.postoAuto ?? false,
      riferimento: apartment?.riferimento ?? "",
      contattato: apartment?.contattato ?? false,
      risposto: apartment?.risposto ?? false,
      note: apartment?.note ?? "",
    },
    onSubmit: ({ value }) => {
      // Validate with arktype
      const validation = apartmentFormSchema(value);
      if (validation instanceof type.errors) {
        toast.error(`Errore di validazione: ${validation.summary}`);
        return;
      }

      const submitData = transformFormToSubmitData(value, contatti);

      if (apartment) {
        updateMutation.mutate({ id: apartment.id, data: submitData });
      } else {
        createMutation.mutate(submitData);
      }
    },
  });

  // Fetch address suggestions from Geoapify
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedAddressQuery.length < 3) {
        setAddressSuggestions([]);
        setIsLoadingAddressSuggestions(false);
        return;
      }

      setIsLoadingAddressSuggestions(true);
      try {
        // Geoapify autocomplete API - better house number support
        const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
        if (!apiKey) {
          console.warn("VITE_GEOAPIFY_API_KEY not configured");
          setAddressSuggestions([]);
          return;
        }

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
            debouncedAddressQuery
          )}&filter=countrycode:it&bias=proximity:11.1217,46.0748&limit=8&apiKey=${apiKey}`
        );
        if (!response.ok) {
          throw new Error("Geocoding suggestion failed");
        }
        const data = await response.json();
        const suggestions =
          data.features?.map(
            (f: {
              properties: {
                formatted: string;
                lat: number;
                lon: number;
                housenumber?: string;
              };
            }) => ({
              formatted: f.properties.formatted,
              lat: f.properties.lat,
              lon: f.properties.lon,
              housenumber: f.properties.housenumber,
            })
          ) ?? [];
        setAddressSuggestions(suggestions);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        toast.error("Errore nel recupero suggerimenti indirizzo");
      } finally {
        setIsLoadingAddressSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedAddressQuery]);

  // Handle clicks outside address suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressRef.current &&
        !addressRef.current.contains(event.target as Node)
      ) {
        setShowAddressSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleGeocode = () => {
    const indirizzoValue = form.getFieldValue("indirizzo");
    const luogoValue = form.getFieldValue("luogo");
    const address = indirizzoValue?.trim() || luogoValue.trim();
    if (!address) {
      toast.error("Inserisci un indirizzo o una zona");
      return;
    }
    geocodeMutation.mutate({ address });
  };

  const handleSelectAddressSuggestion = (
    formatted: string,
    lat: number,
    lon: number
  ) => {
    form.setFieldValue("indirizzo", formatted);
    form.setFieldValue("latitudine", lat.toString());
    form.setFieldValue("longitudine", lon.toString());
    setAddressQuery(formatted);
    setShowAddressSuggestions(false);
    toast.success("Indirizzo e coordinate impostati!");
  };

  const addContact = () => {
    setContatti([...contatti, { tipo: "telefono", valore: "" }]);
  };

  const removeContact = (index: number) => {
    setContatti(contatti.filter((_, i) => i !== index));
  };

  const updateContact = (
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    const updated = [...contatti];
    updated[index] = { ...updated[index], [field]: value };
    setContatti(updated);
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    geocodeMutation.isPending;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* Location Section */}
      <div className="space-y-4 rounded border p-4">
        <h4 className="font-medium text-sm">Posizione</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <form.Field name="luogo">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="luogo">
                  Zona <span className="text-destructive">*</span>
                </Label>
                <Input
                  disabled={isPending}
                  id="luogo"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. Sabbioni, 28"
                  required
                  value={field.state.value}
                />
                <p className="text-muted-foreground text-xs">
                  Nome della zona o quartiere
                </p>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-xs">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <div className="relative space-y-2" ref={addressRef}>
            <Label htmlFor="indirizzo">Indirizzo completo</Label>
            <Input
              autoComplete="off"
              disabled={isPending}
              id="indirizzo"
              onChange={(e) => {
                setAddressQuery(e.target.value);
                form.setFieldValue("indirizzo", e.target.value);
                setShowAddressSuggestions(true);
              }}
              onFocus={() => setShowAddressSuggestions(true)}
              placeholder="es. Via Sabbioni, 28, 38121 Trento"
              value={addressQuery || form.getFieldValue("indirizzo")}
            />
            <p className="text-muted-foreground text-xs">
              💡 Digita liberamente con il numero civico (es. "Via Sabbioni,
              28") e poi premi "Trova Coordinate"
            </p>

            {/* Address suggestions dropdown */}
            {showAddressSuggestions && addressQuery.length >= 3 && (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-background shadow-lg">
                {(() => {
                  if (isLoadingAddressSuggestions) {
                    return (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    );
                  }

                  if (addressSuggestions.length > 0) {
                    return (
                      <>
                        <div className="border-b bg-muted/50 p-2">
                          <p className="text-muted-foreground text-xs">
                            Seleziona un suggerimento o continua a digitare
                            liberamente con il civico
                          </p>
                        </div>
                        {addressSuggestions.map((result) => (
                          <button
                            className="w-full cursor-pointer p-2 text-left text-sm hover:bg-muted"
                            key={`${result.lat}-${result.lon}`}
                            onClick={() =>
                              handleSelectAddressSuggestion(
                                result.formatted,
                                result.lat,
                                result.lon
                              )
                            }
                            type="button"
                          >
                            {result.housenumber && (
                              <span className="font-medium text-primary">
                                {result.housenumber}{" "}
                              </span>
                            )}
                            {result.formatted}
                          </button>
                        ))}
                      </>
                    );
                  }

                  return (
                    <p className="p-4 text-center text-muted-foreground text-sm">
                      Nessun suggerimento. Continua a digitare liberamente e poi
                      usa "Trova Coordinate"
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="col-span-full space-y-1">
            <Button
              disabled={
                isPending ||
                geocodeMutation.isPending ||
                !(
                  form.getFieldValue("indirizzo")?.trim() ||
                  form.getFieldValue("luogo").trim()
                )
              }
              onClick={handleGeocode}
              size="sm"
              type="button"
              variant="outline"
            >
              {geocodeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Trova Coordinate
            </Button>
            <p className="text-muted-foreground text-xs">
              {(() => {
                const indirizzoValue = form.getFieldValue("indirizzo");
                if (indirizzoValue?.trim()) {
                  return "🔍 Cercherà coordinate per l'indirizzo completo (con civico se presente)";
                }
                if (form.getFieldValue("luogo").trim()) {
                  return "Cercherà le coordinate per la zona inserita";
                }
                return "Inserisci un indirizzo o una zona prima";
              })()}
            </p>
          </div>
          <form.Field name="latitudine">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="latitudine">Latitudine</Label>
                <Input
                  disabled={isPending}
                  id="latitudine"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. 46.0700"
                  step="any"
                  type="number"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="longitudine">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="longitudine">Longitudine</Label>
                <Input
                  disabled={isPending}
                  id="longitudine"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. 11.1200"
                  step="any"
                  type="number"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Room Details Section */}
      <div className="space-y-4 rounded border p-4">
        <h4 className="font-medium text-sm">Dettagli Stanza</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <form.Field name="tipoAlloggio">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="tipoAlloggio">
                  Tipo Alloggio <span className="text-destructive">*</span>
                </Label>
                <Select
                  defaultValue=""
                  disabled={isPending}
                  onValueChange={(value) => field.handleChange(value ?? "")}
                  required
                  value={field.state.value}
                >
                  <SelectTrigger
                    className="w-full"
                    id="tipoAlloggio"
                    suppressHydrationWarning
                  >
                    <SelectValue suppressHydrationWarning>
                      {field.state.value || "Seleziona..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Seleziona...</SelectItem>
                    <SelectItem value="Stanza">Stanza</SelectItem>
                    <SelectItem value="Appartamento">Appartamento</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-xs">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <form.Field name="tipoStanza">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="tipoStanza">Tipo Stanza</Label>
                <Select
                  defaultValue=""
                  disabled={isPending}
                  onValueChange={(value) => field.handleChange(value ?? "")}
                  value={field.state.value}
                >
                  <SelectTrigger
                    className="w-full"
                    id="tipoStanza"
                    suppressHydrationWarning
                  >
                    <SelectValue suppressHydrationWarning>
                      {field.state.value || "-"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-</SelectItem>
                    <SelectItem value="Singola">Singola</SelectItem>
                    <SelectItem value="Doppia">Doppia (condivisa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <form.Field name="numeroStanze">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="numeroStanze">N° Stanze totali</Label>
                <Input
                  disabled={isPending}
                  id="numeroStanze"
                  min="1"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. 3"
                  type="number"
                  value={field.state.value}
                />
                <p className="text-muted-foreground text-xs">
                  Per capire quanti coinquilini
                </p>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Cost Section */}
      <div className="space-y-4 rounded border p-4">
        <h4 className="font-medium text-sm">Costi (€/mese)</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <form.Field name="costoAffitto">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="costoAffitto">Affitto</Label>
                <Input
                  disabled={isPending}
                  id="costoAffitto"
                  min="0"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. 350"
                  type="number"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="costoUtenze">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="costoUtenze">Utenze</Label>
                <Input
                  disabled={isPending}
                  id="costoUtenze"
                  min="0"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. 80"
                  type="number"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="costoAltro">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="costoAltro">Altro (spese cond.)</Label>
                <Input
                  disabled={isPending}
                  id="costoAltro"
                  min="0"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. 20"
                  type="number"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Availability Section */}
      <div className="space-y-4 rounded border p-4">
        <h4 className="font-medium text-sm">Disponibilità</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <form.Field name="disponibileDa">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="disponibileDa">Disponibile da</Label>
                <Input
                  disabled={isPending}
                  id="disponibileDa"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="es. Marzo 2026"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="postoAuto">
            {(field) => (
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  checked={field.state.value}
                  disabled={isPending}
                  id="postoAuto"
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <Label htmlFor="postoAuto">Posto auto disponibile</Label>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="space-y-4 rounded border p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Contatti</h4>
          <Button
            onClick={addContact}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus className="mr-1 h-3 w-3" /> Aggiungi
          </Button>
        </div>
        {contatti.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nessun contatto aggiunto
          </p>
        ) : (
          <div className="space-y-2">
            {contatti.map((contact, index) => (
              <div
                className="flex items-center gap-2"
                key={`${contact.tipo}-${contact.valore}-${index}`}
              >
                <Select
                  defaultValue="telefono"
                  onValueChange={(value) =>
                    updateContact(index, "tipo", value ?? "telefono")
                  }
                  value={contact.tipo}
                >
                  <SelectTrigger className="w-32" suppressHydrationWarning>
                    <SelectValue suppressHydrationWarning>
                      {contact.tipo === "telefono" && "Telefono"}
                      {contact.tipo === "email" && "Email"}
                      {contact.tipo === "nome" && "Nome"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telefono">Telefono</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="nome">Nome</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="flex-1"
                  onChange={(e) =>
                    updateContact(index, "valore", e.target.value)
                  }
                  placeholder={(() => {
                    if (contact.tipo === "telefono") {
                      return "es. 3401234567";
                    }
                    if (contact.tipo === "email") {
                      return "es. mario@example.com";
                    }
                    return "es. Mario Rossi";
                  })()}
                  value={contact.valore}
                />
                <Button
                  aria-label="Rimuovi contatto"
                  onClick={() => removeContact(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status & Reference Section */}
      <div className="space-y-4 rounded border p-4">
        <h4 className="font-medium text-sm">Stato e Riferimenti</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <form.Field name="contattato">
            {(field) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.state.value}
                  disabled={isPending}
                  id="contattato"
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <Label htmlFor="contattato">Contattato</Label>
              </div>
            )}
          </form.Field>
          <form.Field name="risposto">
            {(field) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.state.value}
                  disabled={isPending}
                  id="risposto"
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <Label htmlFor="risposto">Ha risposto</Label>
              </div>
            )}
          </form.Field>
          <form.Field name="riferimento">
            {(field) => (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="riferimento">URL Annuncio</Label>
                <Input
                  disabled={isPending}
                  id="riferimento"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  value={field.state.value}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Notes Section */}
      <form.Field name="note">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <textarea
              className="min-h-[80px] w-full rounded-none border border-input bg-transparent px-2.5 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
              disabled={isPending}
              id="note"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Note aggiuntive..."
              value={field.state.value}
            />
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          disabled={isPending}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Annulla
        </Button>
        <Button disabled={isPending} type="submit">
          {(() => {
            if (isPending) {
              return (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {apartment ? "Aggiornamento..." : "Creazione..."}
                </>
              );
            }
            return apartment ? "Aggiorna" : "Crea";
          })()}
        </Button>
      </div>
    </form>
  );
}
