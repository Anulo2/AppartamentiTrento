import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apartment = sqliteTable("apartment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Location info
  luogo: text("luogo").notNull(),
  indirizzo: text("indirizzo"), // Full address for geocoding
  latitudine: real("latitudine"), // For walking distance calculation
  longitudine: real("longitudine"),

  // Room details
  tipoAlloggio: text("tipo_alloggio").notNull(), // Appartamento, Stanza
  tipoStanza: text("tipo_stanza"), // Singola, Doppia (doppia = sharing room with another person)
  numeroStanze: integer("numero_stanze"), // Total rooms in apartment (to know number of roommates)

  // Cost (all in euros)
  costoAffitto: integer("costo_affitto"), // Monthly rent
  costoUtenze: integer("costo_utenze"), // Utilities
  costoAltro: integer("costo_altro"), // Other costs (condo fees, etc.)

  // Availability
  disponibileDa: text("disponibile_da"), // When available (date or description)
  postoAuto: integer("posto_auto", { mode: "boolean" }).default(false), // Has parking

  // Reference
  riferimento: text("riferimento"), // URL to listing

  // Status tracking
  contattato: integer("contattato", { mode: "boolean" }).default(false),
  risposto: integer("risposto", { mode: "boolean" }).default(false),

  // Notes
  note: text("note"), // Any additional notes

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// Contacts table - one apartment can have multiple contacts
export const contatto = sqliteTable("contatto", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  apartmentId: integer("apartment_id")
    .notNull()
    .references(() => apartment.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // telefono, email, nome
  valore: text("valore").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Relations
export const apartmentRelations = relations(apartment, ({ many }) => ({
  contatti: many(contatto),
}));

export const contattoRelations = relations(contatto, ({ one }) => ({
  apartment: one(apartment, {
    fields: [contatto.apartmentId],
    references: [apartment.id],
  }),
}));
