import {
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { InferModel } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().notNull(),
    email: varchar("email", { length: 191 }).notNull(),
    emailVerified: timestamp("emailVerified"),
    image: varchar("image", { length: 191 }),
    created_at: timestamp("created_at").notNull().defaultNow().onUpdateNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (user) => ({
    emailIndex: uniqueIndex("users__email__idx").on(user.email),
  })
);

export type User = InferModel<typeof users>;
