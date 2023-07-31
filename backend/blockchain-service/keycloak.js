const axios = require('axios');
require('dotenv').config({path: './.env'});

const keycloakBaseUrl = process.env.BLOCKCHAIN_SERVICE_KEYCLOAK_BASE_URL;
const realm = process.env.BLOCKCHAIN_SERVICE_KEYCLOAK_REALM;
const clientId = process.env.BLOCKCHAIN_SERVICE_KEYCLOAK_CLIENT;
const clientSecret = process.env.BLOCKCHAIN_SERVICE_KEYCLOAK_CLIENT_SECRET;

const KeycloakAdminAccessToken = async () => {
  try {
    const response = await axios.post(
      `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error obtaining admin access token:', error);
    throw error;
  }
};

const keycloaksearch = axios.create({
  baseURL: `${keycloakBaseUrl}/admin/realms/${realm}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

module.exports = { keycloaksearch, KeycloakAdminAccessToken };
