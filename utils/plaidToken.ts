import * as Keychain from "react-native-keychain";

export const storePlaidAccessToken = async (accessToken: string) => {
  return Keychain.setGenericPassword("plaid_access_token", accessToken, {
    service: "plaid",
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  });
};

export const getPlaidAccessToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: "plaid" });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error("Error retrieving access token:", error);
    return null;
  }
};

export const exchangePublicToken = async (
  publicToken: string,
  userId: string
) => {
  const response = await fetch(
    "http://localhost:5001/api/exchange_public_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        public_token: publicToken,
        userId: userId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to exchange token");
  }

  const data = await response.json();
  if (data.access_token) {
    await storePlaidAccessToken(data.access_token);
    console.log("Access token stored securely");
    return data.access_token;
  }

  throw new Error("No access token in response");
};
