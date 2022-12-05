// Base api URL.
export const baseUrl =
  process.env.NODE_ENV === "production"
    ? `https://floorapp.be/json-api`
    : `http://localhost:3000/json-api`;
