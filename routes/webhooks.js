const express = require('express');
const router = express.Router();

const crypto = require('crypto');

router.post('/orders-create', (req, res) => {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');

    if (!hmacHeader) {
        return res.status(400).json({ error: "Missing HMAC header. Request cannot be verified." });
    }

    try {
        // Calculate HMAC using the RAW body buffer and your API SECRET
        const generatedHmac = crypto
            .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
            .update(req.rawBody, 'utf8') // Use the buffer here!
            .digest('base64'); // Must be base64

        // Use timingSafeEqual to prevent timing attacks
        const isSafe = crypto.timingSafeEqual(
            Buffer.from(generatedHmac),
            Buffer.from(hmacHeader)
        );

        if (!isSafe) {
            console.error("❌ HMAC Mismatch! Request might be fake.");
            return res.status(401).json({ error: 'Unverified request' });
        }

        // Validate request body
        const order = req.body;
        if (!order || !order.id || !order.total_price || !order.line_items) {
            return res.status(400).json({ error: "Invalid order data. Ensure the request body contains 'id', 'total_price', and 'line_items'." });
        }

        console.log(`Order ID: ${order.id}`);
        console.log(`Total Amount: ${order.total_price} ${order.currency}`);

        console.log("Items in the Order:");
        order.line_items.forEach(item => {
            console.log(`- Item: ${item.title}`);
            console.log(`  Price: ${item.price}`);
            console.log(`  Quantity: ${item.quantity}`);
            console.log(`  ID: ${item.id}`);
            console.log(`  SKU: ${item.sku || 'N/A'}`);
        });

        console.log("User Details:");
        console.log(`- User ID: ${order.user_id}`);
        console.log(`- Email: ${order.email || 'N/A'}`);

        // Always return a 200 OK immediately
        res.status(200).json({ message: 'Webhook received successfully' });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({ error: "Failed to process webhook." });
    }
});

module.exports = router;
