/**
 * Seed script for apartments data
 * Run with: bun run packages/db/src/seed-apartments.ts
 *
 * Add your apartment data to the `apartmentsData` array below
 */

import { join } from "node:path";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import {
  account,
  accountRelations,
  apartment,
  apartmentRelations,
  contatto,
  contattoRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema";

// Load environment variables
config({
  path: join(process.cwd(), "apps", "web", ".env"),
});

// Database connection
const databaseUrl = process.env.DATABASE_URL || "local.db";
const client = createClient({
  url: `file:${databaseUrl}`,
});
const db = drizzle({
  client,
  schema: {
    account,
    accountRelations,
    apartment,
    apartmentRelations,
    contatto,
    contattoRelations,
    session,
    sessionRelations,
    user,
    userRelations,
    verification,
  },
});

// =============================================================================
// APARTMENTS DATA
// =============================================================================
interface ApartmentData {
  luogo: string;
  indirizzo?: string;
  latitudine?: number;
  longitudine?: number;
  tipoAlloggio: string; // "Appartamento" | "Stanza"
  tipoStanza?: string; // "Singola" | "Doppia"
  numeroStanze?: number; // Total rooms (number of potential roommates)
  costoAffitto?: number; // Monthly rent in €
  costoUtenze?: number; // Utilities in €
  costoAltro?: number; // Other costs (condo fees, etc.) in €
  disponibileDa?: string;
  postoAuto?: boolean;
  riferimento?: string;
  contattato?: boolean;
  risposto?: boolean;
  note?: string;
  contatti?: Array<{
    tipo: "telefono" | "email" | "nome";
    valore: string;
  }>;
}

const apartmentsData: ApartmentData[] = [
  {
    luogo: "Sabbioni, 28",
    tipoAlloggio: "Appartamento",
    tipoStanza: "Singola",
    riferimento: "http://claudioweb.it/",
    contattato: true,
    risposto: false,
    note: "Sblesa a metà marzo",
    contatti: [
      { tipo: "telefono", valore: "3473120436" },
      { tipo: "nome", valore: "Dens" },
    ],
  },
  {
    luogo: "Sabbioni, 30/32",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    costoAffitto: 50,
    riferimento: "http://claudioweb.it/",
    contattato: true,
    risposto: true,
    contatti: [{ tipo: "telefono", valore: "3473079420" }],
  },
  {
    luogo: "Zona Povo",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    costoAffitto: 235,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/posts/2485921348042u50/",
    contattato: true,
    risposto: false,
    contatti: [{ tipo: "telefono", valore: "3892670714" }],
  },
  {
    luogo: "Zona Cognola",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    postoAuto: true,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/2488822209084425/",
    contattato: false,
    risposto: false,
    note: "No (ho sbagliato a scrivere il numero). Posto auto",
    contatti: [{ tipo: "telefono", valore: "3496247962" }],
  },
  {
    luogo: "Clam BF, 7",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    costoAffitto: 360,
    postoAuto: true,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/2488037265542477/",
    contattato: true,
    risposto: true,
    note: "Già disponibile. Serve essere studente UniTN. Bisogna pagare 390€ all'agenzia. Posto auto",
    contatti: [{ tipo: "telefono", valore: "3605982234" }],
  },
  {
    luogo: "Mattarello, 64",
    tipoAlloggio: "Stanza",
    tipoStanza: "Doppia",
    costoAffitto: 300,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/2487970433022872/",
    contattato: true,
    risposto: false,
    contatti: [{ tipo: "telefono", valore: "4611776440" }],
  },
  {
    luogo: "Zona Ospedale S. Chiara",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    costoAffitto: 455,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/248699639003778971",
    contattato: false,
    risposto: false,
  },
  {
    luogo: "Via Dos, 60",
    tipoAlloggio: "Stanza",
    tipoStanza: "Doppia",
    costoAffitto: 330,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/248779712019222761",
    contattato: false,
    risposto: false,
    contatti: [{ tipo: "telefono", valore: "3487823990" }],
  },
  {
    luogo: "Zona Piazza Fiera",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/248401595956501721",
    contattato: false,
    risposto: false,
    note: "Dal 15 gennaio",
  },
  {
    luogo: "G. Falcone, 30",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 2,
    costoAffitto: 340,
    costoUtenze: 140,
    riferimento: "https://www.immobiliare.it/annunci/125425457",
    contattato: false,
    risposto: false,
    note: "2 stanze singole",
    contatti: [{ tipo: "telefono", valore: "3313582500" }],
  },
  {
    luogo: "Sabbioni, 26",
    tipoAlloggio: "Stanza",
    tipoStanza: "Doppia",
    numeroStanze: 2,
    costoAffitto: 230,
    costoUtenze: 150,
    riferimento: "https://phosphoresrl.com/annunci/TN_SB26-B_D2",
    contattato: true,
    risposto: true,
    note: "Doppia disponibile, singola mi deve dire (forse in altro appartamento). 1 doppia. 1 singola",
    contatti: [{ tipo: "email", valore: "Mail" }],
  },
  {
    luogo: "Don Tommaso Dallafior, 4",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 3,
    costoAffitto: 425,
    costoUtenze: 70,
    riferimento: "https://www.immobiliare.it/annunci/125471339/",
    contattato: false,
    risposto: false,
    note: "3 stanze singole",
    contatti: [{ tipo: "telefono", valore: "3450118910" }],
  },
  {
    luogo: "dei Rivi, 1A",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 2,
    costoAffitto: 525,
    costoUtenze: 75,
    postoAuto: true,
    riferimento: "https://www.immobiliare.it/annunci/122769668/",
    contattato: false,
    risposto: false,
    note: "Posto auto. 2 stanze singole",
  },
  {
    luogo: "San Vito Cognola, 155",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 4,
    costoAffitto: 345,
    costoUtenze: 90,
    postoAuto: true,
    disponibileDa: "Marzo",
    riferimento: "https://www.immobiliare.it/annunci/125471339/",
    contattato: false,
    risposto: false,
    note: "Si libera da marzo. Posto auto. 4 stanze singole",
  },
  {
    luogo: "Regina Pacis, 4",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 5,
    costoAffitto: 360,
    postoAuto: true,
    disponibileDa: "Marzo",
    riferimento: "https://www.immobiliare.it/annunci/124442515/",
    contattato: false,
    risposto: false,
    note: "5 stanze singole. Posto auto. Si libera a marzo",
  },
  {
    luogo: "Gocciadoro",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 3,
    costoAffitto: 450,
    costoUtenze: 115,
    riferimento: "https://www.immobiliare.it/annunci/125875753/",
    contattato: false,
    risposto: false,
    note: "3 stanze singole",
    contatti: [
      { tipo: "telefono", valore: "0461098176" },
      { tipo: "email", valore: "affitti@immobiliarealanora.com" },
    ],
  },
  {
    luogo: "Via Sarca, 30",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 3,
    costoAffitto: 345,
    costoUtenze: 60,
    postoAuto: true,
    disponibileDa: "Marzo",
    riferimento: "https://www.immobiliare.it/annunci/126138069/",
    contattato: false,
    risposto: false,
    note: "Si libera a marzo. Posto auto. 3 stanze singole",
    contatti: [{ tipo: "telefono", valore: "4611775580" }],
  },
  {
    luogo: "Regina Pacis, 4",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 5,
    costoAffitto: 360,
    postoAuto: true,
    disponibileDa: "Marzo",
    riferimento: "https://www.immobiliare.it/annunci/125686593/",
    contattato: false,
    risposto: false,
    note: "5 stanze singole. Posto auto. Si libera a marzo",
  },
  {
    luogo: "Gocciadoro",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 3,
    costoAffitto: 450,
    costoUtenze: 115,
    postoAuto: true,
    disponibileDa: "Marzo",
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/249009945762434D/",
    contattato: false,
    risposto: false,
    note: "3 stanze singole. Posto auto. Si libera a marzo",
    contatti: [{ tipo: "telefono", valore: "3801109520" }],
  },
  {
    luogo: "Zona Piazza Fiera",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/249004156563000741J/",
    contattato: false,
    risposto: false,
  },
  {
    luogo: "Zona Cristo Re",
    tipoAlloggio: "Stanza",
    tipoStanza: "Doppia",
    costoAffitto: 260,
    riferimento:
      "https://www.facebook.com/groups/171324103877708/permalink/248878642208870J/",
    contattato: false,
    risposto: false,
  },
  {
    luogo: "Palermo, 6",
    tipoAlloggio: "Stanza",
    tipoStanza: "Singola",
    numeroStanze: 1,
    costoAffitto: 380,
    postoAuto: true,
    riferimento: "https://www.immobiliare.it/annunci/125777369/",
    contattato: false,
    risposto: false,
    note: "Posto auto. 1 stanza singola",
  },
];

// =============================================================================
// SEED HELPER FUNCTIONS
// =============================================================================

/**
 * Prepares apartment data for database insertion
 */
function prepareApartmentData(apt: ApartmentData) {
  const { contatti, ...apartmentData } = apt;
  return {
    apartmentData: {
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
      riferimento: apartmentData.riferimento ?? null,
      contattato: apartmentData.contattato ?? false,
      risposto: apartmentData.risposto ?? false,
      note: apartmentData.note ?? null,
    },
    contatti: contatti ?? [],
  };
}

/**
 * Seeds a single apartment with its contacts
 */
async function seedSingleApartment(apt: ApartmentData) {
  const { apartmentData, contatti } = prepareApartmentData(apt);

  // Insert apartment
  const result = await db.insert(apartment).values(apartmentData).returning();
  const newApartment = result[0];
  console.log(`  → Added: ${apartmentData.luogo}`);

  // Insert contacts if any
  if (contatti.length > 0) {
    await db.insert(contatto).values(
      contatti.map((c) => ({
        apartmentId: newApartment.id,
        tipo: c.tipo,
        valore: c.valore,
      }))
    );
    console.log(`    📞 Added ${contatti.length} contact(s)`);
  }
}

/**
 * Seeds all apartments from the data array
 */
async function seedApartments() {
  if (apartmentsData.length === 0) {
    console.log("ℹ️  No apartments to seed. Add data to apartmentsData array.");
    return;
  }

  console.log(`🏠 Seeding ${apartmentsData.length} apartments...`);

  for (const apt of apartmentsData) {
    await seedSingleApartment(apt);
  }

  console.log("\n✅ Apartments seeded");
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================
async function seed() {
  console.log("🌱 Starting seed...\n");
  await seedApartments();
  console.log("\n🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
