import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dishes = pgTable("dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull().default("primi"), // antipasti, primi, secondi, contorni, dolci, bevande
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableNumber: text("table_number").notNull(), // Changed to text to allow letters
  customerName: text("customer_name").notNull(),
  covers: integer("covers").notNull().default(1), // Number of people at the table
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash' or 'pos'
  status: text("status").notNull().default("active"), // 'active' or 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  dishId: varchar("dish_id").references(() => dishes.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  orderId: true,
});

export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Extended types for API responses
export type OrderWithItems = Order & {
  items: (OrderItem & { dish: Dish })[];
};

// Categories enum
export const DISH_CATEGORIES = {
  antipasti: "Antipasti",
  primi: "Primi Piatti", 
  secondi: "Secondi Piatti",
  contorni: "Contorni",
  dolci: "Dolci",
  bevande: "Bevande"
} as const;

export type DishCategory = keyof typeof DISH_CATEGORIES;

export type DishSales = {
  dish: Dish;
  quantity: number;
  revenue: number;
};

export type DailyStats = {
  totalRevenue: number;
  totalOrders: number;
  dishSales: DishSales[];
  paymentStats: {
    cash: { amount: number; percentage: number };
    pos: { amount: number; percentage: number };
  };
};
