export const API_URL: string = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL is not defined. Create a .env file at the project root with VITE_API_URL=<your-api-base-url>."
  );
}
