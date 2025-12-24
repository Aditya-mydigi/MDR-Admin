// db.config.ts
// Safe database URL initialization (India / USA)

function constructDatabaseUrl(
  user: string,
  password: string,
  host: string,
  port: string,
  dbName: string
): string {
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${dbName}?schema=public`;
}

if (typeof process !== "undefined" && process.env) {
  const hasIndiaUrl = !!process.env.DATABASE_URL_INDIA;
  const hasUsaUrl = !!process.env.DATABASE_URL_USA;

  // Only construct URLs if they are missing
  if (!hasIndiaUrl || !hasUsaUrl) {
    const {
      DB_USER,
      DB_PASSWORD,
      DB_PORT = "5432",
      DB_HOST_IN,
      DB_HOST_US,
      DB_NAME_IN, // India
      DB_NAME,    // USA
    } = process.env;

    const missing: string[] = [];

    if (!hasIndiaUrl) {
      if (!DB_USER) missing.push("DB_USER");
      if (!DB_PASSWORD) missing.push("DB_PASSWORD");
      if (!DB_HOST_IN) missing.push("DB_HOST_IN");
      if (!DB_NAME_IN) missing.push("DB_NAME_IN");
    }

    if (!hasUsaUrl) {
      if (!DB_USER) missing.push("DB_USER");
      if (!DB_PASSWORD) missing.push("DB_PASSWORD");
      if (!DB_HOST_US) missing.push("DB_HOST_US");
      if (!DB_NAME) missing.push("DB_NAME");
    }

    if (missing.length) {
      throw new Error(
        `❌ Missing required DB env vars: ${missing.join(", ")}`
      );
    }

    if (!hasIndiaUrl) {
      process.env.DATABASE_URL_INDIA = constructDatabaseUrl(
        DB_USER!,
        DB_PASSWORD!,
        DB_HOST_IN!,
        DB_PORT,
        DB_NAME_IN!
      );
    }

    if (!hasUsaUrl) {
      process.env.DATABASE_URL_USA = constructDatabaseUrl(
        DB_USER!,
        DB_PASSWORD!,
        DB_HOST_US!,
        DB_PORT,
        DB_NAME!
      );
    }

    console.log("✓ DATABASE_URL_INDIA / DATABASE_URL_USA ready");
  } else {
    console.log("✓ Using existing DATABASE_URL_INDIA / DATABASE_URL_USA");
  }
}
