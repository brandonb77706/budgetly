const express = require("express");
const router = express.Router();

router.post("/api/plaid-webhook", (req, res) => {
  try {
    const event = req.body; // Plaid sends the event data in the request body
    console.log("Plaid webhook event received:", event);

    // Handle specific webhook events
    if (
      event.webhook_type === "TRANSACTIONS" &&
      event.webhook_code === "INITIAL_UPDATE"
    ) {
      console.log(
        "Initial transactions update received for user:",
        event.user_id
      );
    } else if (
      event.webhook_type === "ITEM" &&
      event.webhook_code === "ERROR"
    ) {
      console.error("Error with Plaid item:", event.error);
    }

    // Respond to Plaid to acknowledge receipt of the webhook
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling Plaid webhook:", error);
    res.status(500).send("Error handling webhook");
  }
});

module.exports = router;
