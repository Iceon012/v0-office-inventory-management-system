import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "employee"])
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
  "cancelled",
])

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  role: userRoleEnum("role").notNull().default("employee"),
  department: text("department"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("slate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    sku: text("sku").unique(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    quantity: integer("quantity").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).default("0"),
    location: text("location"),
    imageUrl: text("image_url"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index("inventory_items_category_idx").on(t.categoryId),
    nameIdx: index("inventory_items_name_idx").on(t.name),
  }),
)

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: requestStatusEnum("status").notNull().default("pending"),
    purpose: text("purpose"),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNotes: text("decision_notes"),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    requesterIdx: index("requests_requester_idx").on(t.requesterId),
    statusIdx: index("requests_status_idx").on(t.status),
  }),
)

export const requestItems = pgTable("request_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "restrict" }),
  quantityRequested: integer("quantity_requested").notNull(),
  quantityFulfilled: integer("quantity_fulfilled").notNull().default(0),
})

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").notNull().default("info"),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(requests),
  notifications: many(notifications),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(inventoryItems),
}))

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  category: one(categories, { fields: [inventoryItems.categoryId], references: [categories.id] }),
  creator: one(users, { fields: [inventoryItems.createdBy], references: [users.id] }),
  requestItems: many(requestItems),
}))

export const requestsRelations = relations(requests, ({ one, many }) => ({
  requester: one(users, {
    fields: [requests.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  decider: one(users, {
    fields: [requests.decidedBy],
    references: [users.id],
    relationName: "decider",
  }),
  items: many(requestItems),
}))

export const requestItemsRelations = relations(requestItems, ({ one }) => ({
  request: one(requests, { fields: [requestItems.requestId], references: [requests.id] }),
  item: one(inventoryItems, { fields: [requestItems.itemId], references: [inventoryItems.id] }),
}))

export type User = typeof users.$inferSelect
export type Category = typeof categories.$inferSelect
export type InventoryItem = typeof inventoryItems.$inferSelect
export type Request = typeof requests.$inferSelect
export type RequestItem = typeof requestItems.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type UserRole = (typeof userRoleEnum.enumValues)[number]
export type RequestStatus = (typeof requestStatusEnum.enumValues)[number]
