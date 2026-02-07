const express = require('express');
const router = express.Router();
const axios = require('axios');
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES, HOST } = process.env;

// Define the /shopify route
router.get('/', (req, res) => {
  res.send('Shopify route is working!');
});

// 1. The "Connect" Route - Initiates the handshake
router.get('/auth', (req, res) => {
    const shop = req.query.shop;
    if(!shop) {
        return res.status(400).send("Missing shop parameter");
    }
    const redirectUri = `${HOST}/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${redirectUri}`;
    console.log("Redirecting to:", installUrl);
    res.redirect(installUrl);
});

// 2. The Callback Route - Exchanges code for Permanent Access Token
router.get('/callback', async (req, res) => {
    const { shop, code } = req.query;

    const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
    };

    try {
        const response = await axios.post(accessTokenRequestUrl, accessTokenPayload);
        const accessToken = response.data.access_token;
        
        console.log(`SUCCESS! Connected to ${shop}`);
        console.log(`YOUR PERMANENT TOKEN: ${accessToken}`);
        
        res.send("<h1>Store Connected!</h1> Check your terminal for the token.");
    } catch (error) {
        res.status(500).send("Handshake Failed.");
    }
});


// API Route to Create a Product
/*
Payload Structure:

{
  "title": "Sample Garment -4", // The name of the product.
  "description": "This is a sample garment description.", // A detailed description of the product.
  "options": [ // An array of product options (e.g., Size, Color, Material).
    { "name": "Size" }, // Option 1: Size
    { "name": "Color" }, // Option 2: Color
    { "name": "Material" } // Option 3: Material
  ],
  "variants": [ // An array of product variants, each representing a unique combination of options.
    {
      "option1": "Small", // Value for Option 1 (Size)
      "option2": "Black", // Value for Option 2 (Color)
      "option3": "Cotton", // Value for Option 3 (Material)
      "price": "9.00", // Price for this variant.
      "sku": "1234-S-BLK", // Stock Keeping Unit for this variant.
      "inventory_management": "shopify" // Inventory management system.
    },
    {
      "option1": "Medium",
      "option2": "Black",
      "option3": "Cotton",
      "price": "10.00",
      "sku": "1234-M-BLK",
      "inventory_management": "shopify"
    },
    {
      "option1": "Large",
      "option2": "White",
      "option3": "Cotton",
      "price": "20.00",
      "sku": "1234-L-WHT",
      "inventory_management": "shopify"
    }
  ],
  "images": [ // An array of product images.
    { "src": "https://placehold.co/600x400" } // URL of the product image.
  ]
}

This payload is used to create a product in Shopify with multiple options (e.g., Size, Color, Material) and their corresponding variants. Each variant has its own price, SKU, and inventory management settings. The product also includes an image.
*/
router.post('/sync-garment', async (req, res) => {
    const { title, description, options,variants,images } = req.body;

    const shopUrl = process.env.SHOP_URL; 
    const accessToken = process.env.PERMANENT_TOKEN;
    if (!shopUrl || !accessToken) {
        return res.status(500).json({ error: "Shop URL or Access Token not configured" });
    }
   
    
    const productPayload = {
    product: {
        title: title,
        body_html: `<strong>${description}</strong>`,
        vendor: "Flora POD",
        status: "active",
        options: options,
        variants: variants,
           
        
        images: images
    }
};

    try {
        const response = await axios.post(
            `https://${shopUrl}/admin/api/2026-01/products.json`,
            productPayload,
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(201).json({
            message: "Product Synced Successfully!",
            shopify_id: response.data.product.id
        });
    } catch (error) {
        console.error("Shopify Sync Error:", error.response.data);
        res.status(500).json({ error: "Failed to sync product to Shopify" });
    }
});



// Route to mark an order as fulfilled
router.post('/fulfill-order', async (req, res) => {
    const { orderId, trackingNumber, trackingCompany, trackingUrl } = req.body;
    const shopUrl = process.env.SHOP_URL;
    const accessToken = process.env.PERMANENT_TOKEN;

    try {
        // 1. Get the Fulfillment Order ID for this Order
        const foResponse = await axios.get(
            `https://${shopUrl}/admin/api/2026-01/orders/${orderId}/fulfillment_orders.json`,
            { headers: { 'X-Shopify-Access-Token': accessToken } }
        );

        console.log("Fulfillment Orders Response:", foResponse.data);

        const fulfillmentOrderId = foResponse.data.fulfillment_orders[0].id;

        // 2. Create the Fulfillment
        const fulfillmentPayload = {
            fulfillment: {
                line_items_by_fulfillment_order: [
                    {
                        fulfillment_order_id: fulfillmentOrderId
                    }
                ],
                tracking_info: {
                    number: trackingNumber,
                    company: trackingCompany,
                    url: trackingUrl
                },
                notify_customer: true // Sends the "Your order has shipped" email
            }
        };

        await axios.post(
            `https://${shopUrl}/admin/api/2026-01/fulfillments.json`,
            fulfillmentPayload,
            { headers: { 'X-Shopify-Access-Token': accessToken } }
        );

        res.status(200).json({ message: "Order fulfilled and customer notified!" });
    } catch (error) {
        console.error("Fulfillment Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fulfill order" });
    }
});
module.exports = router;