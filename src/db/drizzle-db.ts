import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

// Connect to the database
const connection = connect({
  url: process.env.DATABASE_URL,
});

const db = drizzle(connection);
