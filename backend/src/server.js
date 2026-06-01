"use strict";

import dotenv from "dotenv";
import { app } from "./app.js";
import { initDatabase } from "./config/database.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Morpheus Note API operativa en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("No se pudo iniciar Morpheus Note API:");
    console.error(error);
    process.exit(1);
  }
}

bootstrap();