const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const webhookRoutes = require("./webhook");
require("dotenv").config();
app.use(bodyParser.json());

//cors
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:8081", // Replace with your frontend's origin
    methods: ["GET", "POST"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
  })
);
//plaid cofig such as using client id and sercet id
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
console.log("Client ID:", process.env.BACKEND_CLIENT_ID);
console.log("Secret ID:", process.env.BACKEND_SECRET_ID);

// Initialize the Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for testing
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.BACKEND_CLIENT_ID,
      "PLAID-SECRET": process.env.BACKEND_SECRET_ID,
    },
  },
});

const client = new PlaidApi(configuration);
// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Plaid API Server!");
});

app.post("/api/create_link_token", async function (request, response) {
  // Get the client_user_id by searching for the current user
  console.log("creating link token");
  const { userId, username } = request.body;
  const clientName = username || "defaul client Name";

  if (!userId) {
    return response.status(400).json({ error: "userId is required" });
  }
  const clientUserId = userId;

  const requestPayload = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: clientUserId,
    },
    client_name: clientName,
    products: ["auth"],
    language: "en",
    webhook: "http://localhost:5001/api/plaid-webhook",
    redirect_uri: "http://localhost:5001/callback",
    country_codes: ["US"],
  };
  console.log(requestPayload);
  console.log();
  console.log("trying to create");
  try {
    const createTokenResponse = await client.linkTokenCreate(requestPayload);
    response.json(createTokenResponse.data);
  } catch (error) {
    console.error(
      "Error creating token:",
      error.response?.data || error.message
    );
    response
      .status(500)
      .json({ error: "An error occurred trying to create link token" });
  }
});

//declring access token so it can be used globally
let accessToken = null;
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
      accessToken = response.data.access_token;
      const itemID = response.data.item_id;

      res.json({ public_token_exchange: "complete" });
    } catch (error) {
      // handle error
    }
  }
);

//getting account info
const prettyPrintResponse = (response) => {
  console.log(JSON.stringify(response, null, 2));
};
app.get("/api/accounts", async function (request, response, next) {
  try {
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });
    prettyPrintResponse(accountsResponse);
    console.log(response);
  } catch (error) {
    console.error("Error fetching a accounts: ", error.message);
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
