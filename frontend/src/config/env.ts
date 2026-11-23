const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// An empty string is valid: in production Nginx serves the API on the same domain.
if (apiUrl === undefined) {
  throw new Error("NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local.");
}

export const env = {
  apiUrl: apiUrl.replace(/\/$/, ""),
};
