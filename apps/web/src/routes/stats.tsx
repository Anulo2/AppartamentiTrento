import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Loader2, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/stats")({
  component: StatsRoute,
});

function StatsRoute() {
  const stats = useQuery(orpc.apartment.getStats.queryOptions());

  if (stats.isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats.data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <p className="text-center text-muted-foreground">
          Nessuna statistica disponibile
        </p>
      </div>
    );
  }

  const data = stats.data;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-bold text-3xl">Statistiche</h1>
        <p className="text-muted-foreground">
          Panoramica della ricerca appartamenti
        </p>
      </div>

      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Totale Appartamenti
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{data.total}</div>
              <p className="text-muted-foreground text-xs">
                {data.contattati} contattati, {data.risposti} risposti
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Tasso di Contatto
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {data.contattatoPercentage}%
              </div>
              <p className="text-muted-foreground text-xs">
                {data.contattati} su {data.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Tasso di Risposta
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {data.rispostoPercentage}%
              </div>
              <p className="text-muted-foreground text-xs">
                {data.risposti} su {data.contattati} contattati
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Average Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Costi Medi</CardTitle>
            <CardDescription>
              Media dei costi mensili per appartamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Affitto</span>
                  <span className="font-medium">
                    €{data.averageCosts.affitto}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${(data.averageCosts.affitto / data.averageCosts.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Utenze</span>
                  <span className="font-medium">
                    €{data.averageCosts.utenze}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{
                      width: `${(data.averageCosts.utenze / data.averageCosts.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Altro</span>
                  <span className="font-medium">
                    €{data.averageCosts.altro}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{
                      width: `${(data.averageCosts.altro / data.averageCosts.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Totale Medio</span>
                  <span>€{data.averageCosts.total}/mese</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* By Tipo Alloggio */}
          <Card>
            <CardHeader>
              <CardTitle>Per Tipo Alloggio</CardTitle>
              <CardDescription>Distribuzione appartamenti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.byTipoAlloggio).map(([tipo, count]) => (
                  <div key={tipo}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{tipo}</span>
                      <span className="font-medium">
                        {count} ({Math.round((count / data.total) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${(count / data.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Tipo Stanza */}
          <Card>
            <CardHeader>
              <CardTitle>Per Tipo Stanza</CardTitle>
              <CardDescription>
                Distribuzione stanze singole/doppie
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(data.byTipoStanza).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.byTipoStanza).map(([tipo, count]) => {
                    const total = Object.values(data.byTipoStanza).reduce(
                      (sum, c) => sum + c,
                      0
                    );
                    return (
                      <div key={tipo}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{tipo}</span>
                          <span className="font-medium">
                            {count} ({Math.round((count / total) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-secondary"
                            style={{
                              width: `${(count / total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nessuna stanza con tipo specificato
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* By Neighborhood */}
        <Card>
          <CardHeader>
            <CardTitle>Per Zona</CardTitle>
            <CardDescription>
              Distribuzione appartamenti per quartiere
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.byNeighborhood)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([zona, count]) => (
                  <div key={zona}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate">{zona}</span>
                      <span className="ml-2 font-medium">
                        {count} ({Math.round((count / data.total) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-accent"
                        style={{
                          width: `${(count / data.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
            {Object.keys(data.byNeighborhood).length > 10 && (
              <p className="mt-4 text-muted-foreground text-xs">
                Mostrate le prime 10 zone
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
