# Flora Shopify Integration

This project provides a Shopify integration for managing products and orders through the Flora plugin. Below is a detailed explanation of the available routes and their functionality.

## Routes

### `/auth`
- **Description**: This route receives the customer's Shopify shop URL and redirects the customer to connect the plugin to their Shopify account.
- **Usage**: Initiates the OAuth handshake process to authenticate the app with the customer's Shopify store.

### `/sync-garment`
- **Description**: This route is used to create a new product on the customer's Shopify account.
- **Usage**: Accepts product details (e.g., title, description, price, SKU, etc.) and creates the product in the connected Shopify store.

### `/fulfill-order`
- **Description**: This route takes tracking details and an order ID and updates the fulfillment status in the customer's Shopify account.
- **Usage**: Updates the order fulfillment details, including tracking numbers, in the Shopify store.

### `/webhooks/orders-create`
- **Description**: This route handles the creation of orders via Shopify webhooks.
- **Setup Instructions**:
  1. **Expose the server**: Use the following command to expose the project via a Cloudflare tunnel:
     ```bash
     cloudflared tunnel --url http://localhost:3000
     ```
  2. **Update the Shopify app configuration**:
     - Copy the exposed URL from the Cloudflare tunnel output.
     - Update the `flora-plugin/shopify.app.toml` file with the exposed URL.
  3. **Set the webhook URI**: Pass the exposed URL in the `orders-create` webhook URI.
  4. **Deploy the changes**: Run the following command in the `flora-plugin` folder to deploy the updated configuration:
     ```bash
     shopify app deploy
     ```

## Flora Plugin Configuration

The Flora plugin can be configured in the `flora-plugin` folder. After making changes in this folder, you can deploy the updated plugin using the following command:

```bash
shopify app deploy
```

## Notes

- To simulate creation and updation, the shop URL and access token of a test shop are stored in the `.env` file.
- Ensure that the `.env` file contains the correct credentials for the test shop to enable proper simulation of API calls.

## Environment Variables

The following environment variables are required:
- `SHOPIFY_API_KEY`: Your Shopify app's API key.
- `SHOPIFY_API_SECRET`: Your Shopify app's API secret.
- `SCOPES`: The required permissions for the app.
- `HOST`: The base URL of your app (e.g., `http://localhost:3000`).
- `SHOP_URL`: The test shop's URL.
- `PERMANENT_TOKEN`: The access token for the test shop.

---

For any issues or questions, please contact the development team.