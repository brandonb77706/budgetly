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
    origin: ["http://localhost:8081", "exp://localhost:8081"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "access_token"],
  })
);
//plaid cofig such as using client id and sercet id
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const {
  default: AsyncStorage,
} = require("@react-native-async-storage/async-storage");
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
app.get("/callback", (req, res) => {
  console.log("Received callback from Plaid with query params:", req.query);

  // Extract any query parameters
  const queryParams = new URLSearchParams(req.query).toString();

  // Redirect to your mobile app using your app's custom URL scheme
  const redirectUrl = `budgetly://plaid-callback?${queryParams}`;

  // Create a simple HTML page that will redirect to your app
  res.send(`
    <html>
      <head>
        <title>Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=${redirectUrl}">
      </head>
      <body>
        <p>Redirecting to the Budgetly app...</p>
        <p>If you're not automatically redirected, <a href="${redirectUrl}">click here</a>.</p>
        <script>
          window.location.href = "${redirectUrl}";
        </script>
      </body>
    </html>
  `);
});

app.post("/api/create_link_token", async function (request, response) {
  // Get the client_user_id by searching for the current user
  console.log("creating link token");
  const { userId, username } = request.body;
  const clientName = username || "FinWise";

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
    products: ["auth", "transactions"],
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

//public exchange token
app.post(
  "/api/exchange_public_token",
  async function (request, response, next) {
    const publicToken = request.body.public_token;
    try {
      const plaidResponse = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      // Sending to the client
      response.json({
        public_token_exchange: "complete",
        access_token: plaidResponse.data.access_token,
        item_id: plaidResponse.data.item_id,
      });
      console.log("Access token sent to client");
    } catch (error) {
      console.error("Error occured gettin token", error);
    }
  }
);

//getting account info
const prettyPrintResponse = (response) => {
  console.log(JSON.stringify(response, null, 2));
};
app.get("/api/accounts", async function (request, response) {
  try {
    // Get the token from the request headers instead of the global variable
    const accessToken = request.headers.access_token;

    if (!accessToken) {
      return response.status(400).json({
        error: "No access token available. Have you linked your account?",
      });
    }

    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });

    // Just log the data directly instead of using prettyPrintResponse
    console.log(
      "Account data:",
      JSON.stringify(accountsResponse.data, null, 2)
    );

    // Send the data back to the client
    response.json(accountsResponse.data);
  } catch (error) {
    console.error("Error fetching accounts:", error.message);
    response.status(500).json({ error: error.message });
  }
});

//getting transactions
app.get("/api/transactions", async function (request, response) {
  try {
    // Get the token from the request headers instead of the global variable
    const accessToken = request.headers.access_token;

    if (!accessToken) {
      return response.status(400).json({
        error: "No access token available. Have you linked your account?",
      });
    }
    console.log("setting up timeline");
    // Get transactions for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    console.log(`Fetching transactions from ${startDate} to ${endDate}`);

    try {
      const transactionsResponse = await client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });

      // Sends the transactions data back to the client
      return response.json(transactionsResponse.data.transactions);
    } catch (err) {
      console.log(
        "error occured fetching in server",
        err.response?.data || err
      );

      // Forward the Plaid error to the client
      if (err.response && err.response.data) {
        return response
          .status(err.response.status || 400)
          .json(err.response.data);
      }

      // Generic error fallback
      return response.status(500).json({
        error: "Failed to fetch transactions",
        details: err.message,
      });
    }
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    response.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
