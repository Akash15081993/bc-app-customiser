export function getBCAppCredentials() {
  return {
    client_id: process.env.BC_CLIENT_ID!,
    client_secret: process.env.BC_CLIENT_SECRET!,
    redirect_uri: process.env.BC_AUTH_CALLBACK_URL!,
  };
}