import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Destination {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  lastUsed: number;
}

interface DestinationSearchProps {
  onSelect: (destination: { name: string; lat: number; lng: number }) => void;
  selectedDestination: { name: string; lat: number; lng: number } | null;
  onClear: () => void;
}

const STORAGE_KEY = "apartmentitrento_recent_destinations";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

export function DestinationSearch({
  onSelect,
  selectedDestination,
  onClear,
}: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [recentDestinations, setRecentDestinations] = useState<Destination[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent destinations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentDestinations(parsed);
      }
    } catch (error) {
      console.error("Failed to load recent destinations:", error);
    }
  }, []);

  // Save recent destination
  const saveRecentDestination = (
    name: string,
    address: string,
    lat: number,
    lng: number
  ) => {
    try {
      const newDestination: Destination = {
        id: `${lat}-${lng}`,
        name,
        address,
        lat,
        lng,
        lastUsed: Date.now(),
      };

      const updated = [
        newDestination,
        ...recentDestinations.filter((d) => d.id !== newDestination.id),
      ].slice(0, MAX_RECENT);

      setRecentDestinations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent destination:", error);
    }
  };

  // Remove recent destination
  const removeRecentDestination = (id: string) => {
    try {
      const updated = recentDestinations.filter((d) => d.id !== id);
      setRecentDestinations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to remove recent destination:", error);
    }
  };

  // Search for destinations using Nominatim
  const searchDestinations = async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchQuery = `${query}, Trento, Italy`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "AppartamentiTrento/1.0",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchDestinations(value);
    }, DEBOUNCE_MS);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: {
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    const lat = Number.parseFloat(suggestion.lat);
    const lng = Number.parseFloat(suggestion.lon);
    const name = suggestion.display_name.split(",")[0]; // Get first part as name

    onSelect({ name, lat, lng });
    saveRecentDestination(name, suggestion.display_name, lat, lng);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle recent destination selection
  const handleSelectRecent = (dest: Destination) => {
    onSelect({ name: dest.name, lat: dest.lat, lng: dest.lng });
    saveRecentDestination(dest.name, dest.address, dest.lat, dest.lng);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {selectedDestination ? (
        /* Selected destination display */
        <div className="flex items-center gap-2 rounded-lg border bg-primary/10 p-3">
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="font-medium text-sm">
              {selectedDestination.name}
            </div>
            <div className="text-muted-foreground text-xs">
              Destinazione selezionata
            </div>
          </div>
          <Button
            aria-label="Rimuovi destinazione"
            onClick={onClear}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* Search input */
        <>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onBlur={() => {
                // Delay to allow click on suggestions
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Cerca destinazione a Trento..."
              ref={inputRef}
              value={searchQuery}
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-background shadow-lg">
              {/* Recent destinations */}
              {recentDestinations.length > 0 && searchQuery.length < 3 && (
                <div className="border-b p-2">
                  <div className="mb-1 px-2 font-medium text-muted-foreground text-xs">
                    Ricerche recenti
                  </div>
                  {recentDestinations.map((dest) => (
                    <button
                      className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-muted"
                      key={dest.id}
                      onClick={() => handleSelectRecent(dest)}
                      type="button"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{dest.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {dest.address.length > 60
                            ? `${dest.address.slice(0, 60)}...`
                            : dest.address}
                        </div>
                      </div>
                      <Button
                        aria-label="Rimuovi"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentDestination(dest.id);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </button>
                  ))}
                </div>
              )}

              {/* Search results */}
              {(() => {
                if (isLoading) {
                  return (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Ricerca in corso...
                    </div>
                  );
                }

                if (suggestions.length > 0) {
                  return (
                    <div className="p-2">
                      <div className="mb-1 px-2 font-medium text-muted-foreground text-xs">
                        Risultati
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          className="w-full rounded px-2 py-2 text-left text-sm hover:bg-muted"
                          key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          type="button"
                        >
                          <div className="font-medium">
                            {suggestion.display_name.split(",")[0]}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {suggestion.display_name.length > 80
                              ? `${suggestion.display_name.slice(0, 80)}...`
                              : suggestion.display_name}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                }

                if (searchQuery.length >= 3) {
                  return (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Nessun risultato trovato
                    </div>
                  );
                }

                if (recentDestinations.length === 0) {
                  return (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Inizia a digitare per cercare una destinazione
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
