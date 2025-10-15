const { createHmac } = require('crypto');

// Webhook verification function
function verifyFigmaWebhook(payload, signature, secret) {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}

// Main webhook handler function
module.exports = async function handler(req, res) {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = JSON.stringify(req.body);
    const signature = req.headers['x-figma-signature'];
    const webhookSecret = process.env.FIGMA_WEBHOOK_SECRET;

    // Verify webhook signature (recommended for security)
    if (webhookSecret && !verifyFigmaWebhook(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Received Figma webhook:', event);

    // Only process FILE_UPDATE events
    if (event.event_type === 'FILE_UPDATE') {
      await triggerGitHubAction(event);
      return res.status(200).json({ 
        message: 'Webhook processed successfully',
        triggered: true 
      });
    }

    return res.status(200).json({ 
      message: 'Event ignored',
      event_type: event.event_type 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Trigger GitHub repository dispatch event
async function triggerGitHubAction(figmaEvent) {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY; // format: "owner/repo"
  
  if (!githubToken || !githubRepo) {
    throw new Error('Missing GitHub configuration');
  }

  const [owner, repo] = githubRepo.split('/');
  
  const dispatchPayload = {
    event_type: 'figma-update',
    client_payload: {
      event_type: figmaEvent.event_type,
      file_name: figmaEvent.file_name,
      file_key: figmaEvent.file_key,
      timestamp: new Date().toISOString(),
      triggered_by: figmaEvent.triggered_by
    }
  };

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dispatchPayload)
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
  }

  console.log('Successfully triggered GitHub Action for Figma update');
}