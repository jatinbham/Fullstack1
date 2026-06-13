const axios = require("axios");

const triggerN8n = async (webhookUrl, data) => {
  if (!webhookUrl) {
    console.log(`n8n Webhook URL is not configured. Data stored in DB only.`);
    return { success: false, reason: "Webhook not configured" };
  }
  try {
    console.log(`Forwarding workflow data to n8n: ${webhookUrl}`);
    const response = await axios.post(webhookUrl, data);
    console.log(`n8n trigger success: Status ${response.status}`);
    return { success: true };
  } catch (error) {
    console.error(`Error triggering n8n webhook (${webhookUrl}): ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = triggerN8n;
