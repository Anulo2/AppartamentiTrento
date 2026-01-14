import { db } from "@AppartamentiTrento/db";
import { apartment, contatto } from "@AppartamentiTrento/db/schema/apartment";
import { env } from "@AppartamentiTrento/env/server";
import { type } from "arktype";
import { and, eq, like } from "drizzle-orm";

import { publicProcedure } from "../index";

const contattoSchema = type({
  tipo: "'telefono' | 'email' | 'nome'",
  valore: "string>=1",
});

const apartmentSchema = type({
  luogo: "string>=1",
  "indirizzo?": "string | null",
  "latitudine?": "number | null",
  "longitudine?": "number | null",
  tipoAlloggio: "string>=1",
  "tipoStanza?": "string | null",
  "numeroStanze?": "number>0 | null",
  "costoAffitto?": "number>=0 | null",
  "costoUtenze?": "number>=0 | null",
  "costoAltro?": "number>=0 | null",
  "disponibileDa?": "string | null",
  postoAuto: "boolean = false",
  "riferimento?": "string.url | '' | null",
  contattato: "boolean = false",
  risposto: "boolean = false",
  "note?": "string | null",
  "contatti?": contattoSchema.array(),
});

export const apartmentRouter = {
  getAll: publicProcedure
    .input(
      type({
        "tipoAlloggio?": "string",
        "tipoStanza?": "string",
        "contattato?": "boolean",
        "risposto?": "boolean",
        "postoAuto?": "boolean",
        "locationSearch?": "string",
        "minCosto?": "number>=0",
        "maxCosto?": "number>=0",
        "maxWalkingMinutes?": "number>=1",
        "maxTransitMinutes?": "number>=1",
        "destinationLat?": "number",
        "destinationLng?": "number",
        "sortBy?": "'costo' | 'luogo' | 'createdAt' | 'disponibileDa'",
        "sortOrder?": "'asc' | 'desc'",
      })
    )
    .handler(async ({ input }) => {
      const filters: ReturnType<typeof eq>[] = [];

      if (input?.tipoAlloggio) {
        filters.push(eq(apartment.tipoAlloggio, input.tipoAlloggio));
      }

      if (input?.tipoStanza) {
        filters.push(eq(apartment.tipoStanza, input.tipoStanza));
      }

      if (input?.contattato !== undefined) {
        filters.push(eq(apartment.contattato, input.contattato));
      }

      if (input?.risposto !== undefined) {
        filters.push(eq(apartment.risposto, input.risposto));
      }

      if (input?.postoAuto !== undefined) {
        filters.push(eq(apartment.postoAuto, input.postoAuto));
      }

      if (input?.locationSearch) {
        filters.push(like(apartment.luogo, `%${input.locationSearch}%`));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const results = whereClause
        ? await db.select().from(apartment).where(whereClause)
        : await db.select().from(apartment);

      // Fetch contacts for each apartment
      const apartmentsWithContacts = await Promise.all(
        results.map(async (apt) => {
          const contacts = await db
            .select()
            .from(contatto)
            .where(eq(contatto.apartmentId, apt.id));
          return { ...apt, contatti: contacts };
        })
      );

      // Filter by cost range (must be done after fetching since we calculate total)
      let filtered = apartmentsWithContacts;
      if (input?.minCosto !== undefined || input?.maxCosto !== undefined) {
        filtered = apartmentsWithContacts.filter((apt) => {
          const totalCost =
            (apt.costoAffitto ?? 0) +
            (apt.costoUtenze ?? 0) +
            (apt.costoAltro ?? 0);

          if (input.minCosto !== undefined && totalCost < input.minCosto) {
            return false;
          }
          if (input.maxCosto !== undefined && totalCost > input.maxCosto) {
            return false;
          }
          return true;
        });
      }

      // Filter by walking distance
      if (
        input?.maxWalkingMinutes !== undefined &&
        input?.destinationLat !== undefined &&
        input?.destinationLng !== undefined
      ) {
        const destLat = input.destinationLat;
        const destLng = input.destinationLng;
        filtered = filtered.filter((apt) => {
          // Skip apartments without coordinates
          if (!(apt.latitudine && apt.longitudine)) {
            return false;
          }

          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = ((destLat - apt.latitudine) * Math.PI) / 180;
          const dLon = ((destLng - apt.longitudine) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((apt.latitudine * Math.PI) / 180) *
              Math.cos((destLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          // Estimate walking time (average walking speed ~5 km/h)
          const walkingTimeMinutes = Math.round((distance / 5) * 60);

          return walkingTimeMinutes <= (input.maxWalkingMinutes ?? 0);
        });
      }

      // Filter by transit time
      if (
        input?.maxTransitMinutes !== undefined &&
        input?.destinationLat !== undefined &&
        input?.destinationLng !== undefined
      ) {
        const destLat = input.destinationLat;
        const destLng = input.destinationLng;
        filtered = filtered.filter((apt) => {
          // Skip apartments without coordinates
          if (!(apt.latitudine && apt.longitudine)) {
            return false;
          }

          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = ((destLat - apt.latitudine) * Math.PI) / 180;
          const dLon = ((destLng - apt.longitudine) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((apt.latitudine * Math.PI) / 180) *
              Math.cos((destLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          // Estimate transit time (average speed ~30 km/h including stops)
          const transitTimeMinutes = Math.round((distance / 30) * 60) + 5;

          return transitTimeMinutes <= (input.maxTransitMinutes ?? 0);
        });
      }

      // Sort in-memory
      if (input?.sortBy) {
        const order = input.sortOrder === "desc" ? -1 : 1;
        filtered.sort((a, b) => {
          if (!input.sortBy) {
            return 0;
          }

          if (input.sortBy === "costo") {
            // Sort by total cost (affitto + utenze + altro)
            const getTotalCost = (apt: typeof a) => {
              return (
                (apt.costoAffitto ?? 0) +
                (apt.costoUtenze ?? 0) +
                (apt.costoAltro ?? 0)
              );
            };
            return (getTotalCost(a) - getTotalCost(b)) * order;
          }

          if (input.sortBy === "luogo") {
            return a.luogo.localeCompare(b.luogo) * order;
          }

          if (input.sortBy === "createdAt") {
            const aTime = a.createdAt?.getTime() ?? 0;
            const bTime = b.createdAt?.getTime() ?? 0;
            return (aTime - bTime) * order;
          }

          return 0;
        });
      }

      return filtered;
    }),

  getById: publicProcedure
    .input(type({ id: "number" }))
    .handler(async ({ input }) => {
      const result = await db
        .select()
        .from(apartment)
        .where(eq(apartment.id, input.id))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Apartment not found");
      }

      const contacts = await db
        .select()
        .from(contatto)
        .where(eq(contatto.apartmentId, input.id));

      return { ...result[0], contatti: contacts };
    }),

  create: publicProcedure.input(apartmentSchema).handler(async ({ input }) => {
    const { contatti, ...apartmentData } = input;

    const result = await db
      .insert(apartment)
      .values({
        luogo: apartmentData.luogo,
        indirizzo: apartmentData.indirizzo ?? null,
        latitudine: apartmentData.latitudine ?? null,
        longitudine: apartmentData.longitudine ?? null,
        tipoAlloggio: apartmentData.tipoAlloggio,
        tipoStanza: apartmentData.tipoStanza ?? null,
        numeroStanze: apartmentData.numeroStanze ?? null,
        costoAffitto: apartmentData.costoAffitto ?? null,
        costoUtenze: apartmentData.costoUtenze ?? null,
        costoAltro: apartmentData.costoAltro ?? null,
        disponibileDa: apartmentData.disponibileDa ?? null,
        postoAuto: apartmentData.postoAuto ?? false,
        riferimento:
          apartmentData.riferimento === ""
            ? null
            : (apartmentData.riferimento ?? null),
        contattato: apartmentData.contattato ?? false,
        risposto: apartmentData.risposto ?? false,
        note: apartmentData.note ?? null,
      })
      .returning();

    const newApartment = result[0];
    if (!newApartment) {
      throw new Error("Failed to create apartment");
    }

    // Insert contacts if provided
    if (contatti && contatti.length > 0) {
      await db.insert(contatto).values(
        contatti.map((c) => ({
          apartmentId: newApartment.id,
          tipo: c.tipo,
          valore: c.valore,
        }))
      );
    }

    return newApartment;
  }),

  update: publicProcedure
    .input(
      type({
        id: "number",
        data: apartmentSchema.partial(),
      })
    )
    .handler(async ({ input }) => {
      const { contatti, ...apartmentData } = input.data;

      const updateData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(apartmentData)) {
        if (value !== undefined) {
          updateData[key] = value === "" ? null : value;
        }
      }

      const result = await db
        .update(apartment)
        .set(updateData)
        .where(eq(apartment.id, input.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Apartment not found");
      }

      // Update contacts if provided
      if (contatti !== undefined) {
        // Delete existing contacts
        await db.delete(contatto).where(eq(contatto.apartmentId, input.id));

        // Insert new contacts
        if (contatti.length > 0) {
          await db.insert(contatto).values(
            contatti.map((c) => ({
              apartmentId: input.id,
              tipo: c.tipo,
              valore: c.valore,
            }))
          );
        }
      }

      return result[0];
    }),

  delete: publicProcedure
    .input(type({ id: "number" }))
    .handler(async ({ input }) => {
      // Contacts are deleted via cascade
      await db.delete(apartment).where(eq(apartment.id, input.id));
      return { success: true };
    }),

  // Contacts management
  addContact: publicProcedure
    .input(
      type({
        apartmentId: "number",
        tipo: "'telefono' | 'email' | 'nome'",
        valore: "string>=1",
      })
    )
    .handler(async ({ input }) => {
      const result = await db
        .insert(contatto)
        .values({
          apartmentId: input.apartmentId,
          tipo: input.tipo,
          valore: input.valore,
        })
        .returning();
      return result[0];
    }),

  removeContact: publicProcedure
    .input(type({ id: "number" }))
    .handler(async ({ input }) => {
      await db.delete(contatto).where(eq(contatto.id, input.id));
      return { success: true };
    }),

  // Calculate walking distance using Haversine formula (approximation)
  calculateDistance: publicProcedure
    .input(
      type({
        apartmentId: "number",
        destinationLat: "number",
        destinationLng: "number",
      })
    )
    .handler(async ({ input }) => {
      const apt = await db
        .select()
        .from(apartment)
        .where(eq(apartment.id, input.apartmentId))
        .limit(1);

      if (apt.length === 0) {
        throw new Error("Apartment not found");
      }

      const apartmentData = apt[0];
      if (!(apartmentData?.latitudine && apartmentData.longitudine)) {
        return {
          distance: null,
          walkingTime: null,
          message: "Coordinates not set for apartment",
        };
      }

      // Haversine formula for distance in km
      const R = 6371; // Earth's radius in km
      const dLat =
        ((input.destinationLat - apartmentData.latitudine) * Math.PI) / 180;
      const dLon =
        ((input.destinationLng - apartmentData.longitudine) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((apartmentData.latitudine * Math.PI) / 180) *
          Math.cos((input.destinationLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Estimate walking time (average walking speed ~5 km/h)
      const walkingTimeMinutes = Math.round((distance / 5) * 60);

      return {
        distance: Math.round(distance * 1000), // meters
        walkingTime: walkingTimeMinutes, // minutes
        message: null,
      };
    }),

  // Calculate public transit time using OpenRouteService
  calculateTransitTime: publicProcedure
    .input(
      type({
        apartmentId: "number",
        destinationLat: "number",
        destinationLng: "number",
      })
    )
    .handler(async ({ input }) => {
      const apt = await db
        .select()
        .from(apartment)
        .where(eq(apartment.id, input.apartmentId))
        .limit(1);

      if (apt.length === 0) {
        throw new Error("Apartment not found");
      }

      const apartmentData = apt[0];
      if (!(apartmentData?.latitudine && apartmentData.longitudine)) {
        return {
          transitTime: null,
          distance: null,
          message: "Coordinates not set for apartment",
        };
      }

      // Check if API key is available
      if (!env.OPENROUTESERVICE_API_KEY) {
        // Fallback: approximate transit time (avg speed ~30 km/h including stops)
        const R = 6371;
        const dLat =
          ((input.destinationLat - apartmentData.latitudine) * Math.PI) / 180;
        const dLon =
          ((input.destinationLng - apartmentData.longitudine) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((apartmentData.latitudine * Math.PI) / 180) *
            Math.cos((input.destinationLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        const transitTimeMinutes = Math.round((distance / 30) * 60) + 5; // +5 for waiting

        return {
          transitTime: transitTimeMinutes,
          distance: Math.round(distance * 1000),
          message: "Stima approssimativa (API key non configurata)",
          isApproximate: true,
        };
      }

      try {
        // OpenRouteService Directions API
        const url =
          "https://api.openrouteservice.org/v2/directions/driving-car";
        const body = {
          coordinates: [
            [apartmentData.longitudine, apartmentData.latitudine], // [lng, lat] for start
            [input.destinationLng, input.destinationLat], // [lng, lat] for end
          ],
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: env.OPENROUTESERVICE_API_KEY,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`OpenRouteService error: ${response.statusText}`);
        }

        const data = (await response.json()) as {
          routes?: Array<{
            summary: { duration: number; distance: number };
          }>;
        };

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          if (!route) {
            return {
              transitTime: null,
              distance: null,
              message: "Route not found",
            };
          }
          const durationSeconds = route.summary.duration;
          const distanceMeters = route.summary.distance;

          // Convert to minutes and add buffer for waiting/walking to stops
          const transitTimeMinutes = Math.round(durationSeconds / 60) + 5;

          return {
            transitTime: transitTimeMinutes,
            distance: Math.round(distanceMeters),
            message: null,
            isApproximate: false,
          };
        }

        return {
          transitTime: null,
          distance: null,
          message: "Route not found",
        };
      } catch (error) {
        // Fallback to approximate calculation
        const R = 6371;
        const dLat =
          ((input.destinationLat - apartmentData.latitudine) * Math.PI) / 180;
        const dLon =
          ((input.destinationLng - apartmentData.longitudine) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((apartmentData.latitudine * Math.PI) / 180) *
            Math.cos((input.destinationLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        const transitTimeMinutes = Math.round((distance / 30) * 60) + 5;

        return {
          transitTime: transitTimeMinutes,
          distance: Math.round(distance * 1000),
          message: `Stima approssimativa (${error instanceof Error ? error.message : "API error"})`,
          isApproximate: true,
        };
      }
    }),

  // Geocode address using Geoapify
  geocodeAddress: publicProcedure
    .input(
      type({
        address: "string>=1",
      })
    )
    .handler(async ({ input }) => {
      try {
        const apiKey = env.GEOAPIFY_API_KEY;
        if (!apiKey) {
          return {
            success: false,
            message: "GEOAPIFY_API_KEY non configurata",
            latitudine: null,
            longitudine: null,
          };
        }

        // Use Geoapify geocoding with bias towards Trento
        const searchQuery = `${input.address}, Trento, Italy`;
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchQuery)}&filter=countrycode:it&bias=proximity:11.1217,46.0748&limit=1&apiKey=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Geocoding request failed");
        }

        const data = (await response.json()) as {
          features: Array<{
            properties: {
              lat: number;
              lon: number;
              formatted: string;
              housenumber?: string;
              street?: string;
            };
          }>;
        };

        if (data.features.length === 0) {
          return {
            success: false,
            message: "Indirizzo non trovato",
            latitudine: null,
            longitudine: null,
          };
        }

        const result = data.features[0];
        if (!result) {
          return {
            success: false,
            message: "Indirizzo non trovato",
            latitudine: null,
            longitudine: null,
          };
        }
        return {
          success: true,
          message: null,
          latitudine: result.properties.lat,
          longitudine: result.properties.lon,
          displayName: result.properties.formatted,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Errore geocoding",
          latitudine: null,
          longitudine: null,
        };
      }
    }),

  // Get statistics
  getStats: publicProcedure.handler(async () => {
    const allApartments = await db.select().from(apartment);

    const total = allApartments.length;
    const contattati = allApartments.filter((apt) => apt.contattato).length;
    const risposti = allApartments.filter((apt) => apt.risposto).length;

    const contattatoPercentage = total > 0 ? (contattati / total) * 100 : 0;
    const rispostoPercentage = total > 0 ? (risposti / total) * 100 : 0;

    // Calculate average costs
    const apartmentsWithCost = allApartments.filter(
      (apt) =>
        apt.costoAffitto !== null ||
        apt.costoUtenze !== null ||
        apt.costoAltro !== null
    );
    const avgAffitto =
      apartmentsWithCost.length > 0
        ? Math.round(
            apartmentsWithCost.reduce(
              (sum, apt) => sum + (apt.costoAffitto ?? 0),
              0
            ) / apartmentsWithCost.length
          )
        : 0;
    const avgUtenze =
      apartmentsWithCost.length > 0
        ? Math.round(
            apartmentsWithCost.reduce(
              (sum, apt) => sum + (apt.costoUtenze ?? 0),
              0
            ) / apartmentsWithCost.length
          )
        : 0;
    const avgAltro =
      apartmentsWithCost.length > 0
        ? Math.round(
            apartmentsWithCost.reduce(
              (sum, apt) => sum + (apt.costoAltro ?? 0),
              0
            ) / apartmentsWithCost.length
          )
        : 0;

    // Distribution by neighborhood
    const byNeighborhood: Record<string, number> = {};
    for (const apt of allApartments) {
      byNeighborhood[apt.luogo] = (byNeighborhood[apt.luogo] ?? 0) + 1;
    }

    // Distribution by type
    const byTipoAlloggio: Record<string, number> = {};
    for (const apt of allApartments) {
      byTipoAlloggio[apt.tipoAlloggio] =
        (byTipoAlloggio[apt.tipoAlloggio] ?? 0) + 1;
    }

    const byTipoStanza: Record<string, number> = {};
    for (const apt of allApartments) {
      if (apt.tipoStanza) {
        byTipoStanza[apt.tipoStanza] = (byTipoStanza[apt.tipoStanza] ?? 0) + 1;
      }
    }

    return {
      total,
      contattati,
      risposti,
      contattatoPercentage: Math.round(contattatoPercentage),
      rispostoPercentage: Math.round(rispostoPercentage),
      averageCosts: {
        affitto: avgAffitto,
        utenze: avgUtenze,
        altro: avgAltro,
        total: avgAffitto + avgUtenze + avgAltro,
      },
      byNeighborhood,
      byTipoAlloggio,
      byTipoStanza,
    };
  }),
};
