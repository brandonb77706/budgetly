const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const webhookRoutes = require("./webhook");

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Plaid API Server!");
});

app.post("/api/create_link_token", async function (request, response) {
  // Get the client_user_id by searching for the current user
  const { userId } = request.body;
  const clientUserId = user.id;
  const requestPayload = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: clientUserId,
    },
    client_name: "Plaid Test App",
    products: ["auth"],
    language: "en",
    webhook: "http://localhost:5001/api/plaid-webhook",
    redirect_uri: "http://localhost:5001",
    country_codes: ["US"],
  };
  try {
    const createTokenResponse = await client.linkTokenCreate(requestPayload);
    response.json(createTokenResponse.data);
  } catch (error) {
    console.error("Error creating token");
    response
      .status(500)
      .json({ error: "An error occurred trying to create link token" });
  }
});

//public exchange token
app.post(
  "/api/exchange_public_token",
  async function (request, response, next) {
    const publicToken = request.body.public_token;
    try {
      const response = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      // These values should be saved to a persistent database and
      // associated with the currently signed-in user
      const accessToken = response.data.access_token;
      const itemID = response.data.item_id;

      res.json({ public_token_exchange: "complete" });
    } catch (error) {
      // handle error
    }
  }
);

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
