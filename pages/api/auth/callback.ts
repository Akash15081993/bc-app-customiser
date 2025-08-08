import type { NextApiRequest, NextApiResponse } from "next";
import { setStore } from "@lib/dbs/mysql";
import { getBCAppCredentials } from "@lib/secrets";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, context, scope } = req.query;

  if (!code || !context || !scope || typeof code !== "string") {
    return res.status(400).send("Missing query parameters");
  }

  try {
    const { client_id, client_secret, redirect_uri } = getBCAppCredentials(); // From .env

    // Exchange `code` for access token
    const response = await fetch("https://login.bigcommerce.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        scope,
        context,
        grant_type: "authorization_code",
        redirect_uri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[OAuth Error] ${response.status}: ${error}`);
    }

    const data = await response.json();

    // Save accessToken, storeHash, etc. to DB
    await setStore(data); // You already have this function

    // Redirect to app home (admin)
    return res.redirect(`/?context=${data.context}`);
  } catch (err: any) {
    console.error("[OAuth Error]", err.response?.data || err.message);
    return res.status(500).send("OAuth callback failed");
  }
}
