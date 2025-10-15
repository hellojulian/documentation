# Figma → Mintlify Automated Documentation Sync

Automatically sync your design system documentation from Figma to Mintlify with real-time updates, visual diffs, and zero manual exports.

## ✨ Features

- 🔄 **Real-time sync** via Figma webhooks
- 🎨 **Design token extraction** from Figma Variables
- 📸 **Automated screenshots** of components and frames
- 📊 **Visual diffs** with Percy integration
- 🤖 **Automated PRs** for all changes
- ⏰ **Scheduled weekly updates**
- 🔒 **Secure webhook verification**

## 🚀 Quick Start

1. **Clone and install**
   ```bash
   git clone <this-repo>
   cd figma-mintlify-sync
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your tokens and IDs
   ```

3. **Test locally**
   ```bash
   npm run sync:figma
   npm run dev
   ```

4. **Deploy and configure webhooks**
   - Deploy webhook handler to Vercel/Cloudflare
   - Set up Figma webhook pointing to your endpoint
   - Configure GitHub repository secrets

📖 **[Full setup guide →](./quickstart.mdx)**

## 🏗️ Architecture

```
Figma File Changes → Webhook → GitHub Action → Sync Script → PR → Percy → Deploy
```

### Workflows

1. **Weekly Sync** (`figma-weekly.yml`)
   - Scheduled every Monday 2 AM UTC
   - Full refresh of tokens and screenshots
   - Creates PR with visual diffs

2. **Webhook Sync** (`figma-webhook.yml`)  
   - Triggered by Figma file changes
   - Near real-time updates
   - Automatic PR creation

## 📁 Project Structure

```
├── .github/workflows/    # GitHub Actions workflows
├── scripts/             # Sync and webhook scripts  
├── tokens/              # Generated design token docs
├── public/images/       # Auto-generated screenshots
├── mint.json           # Mintlify configuration
└── README.md           # This file
```

## 🔧 Configuration

### Required Environment Variables

- `FIGMA_TOKEN` - Personal access token from Figma
- `FIGMA_FILE_KEY` - File key from your Figma URL
- `FIGMA_NODE_IDS` - Comma-separated node IDs for screenshots

### Optional Variables

- `FIGMA_WEBHOOK_SECRET` - For webhook security
- `PERCY_TOKEN` - For visual testing
- `GITHUB_TOKEN` - For webhook handler

## 🎯 Customization

The sync script is highly customizable:

- **Token transformation** - Modify how Figma Variables become design tokens
- **Screenshot selection** - Choose which frames/components to capture  
- **Documentation templates** - Customize generated MDX files
- **Sync frequency** - Adjust workflow schedules

## 📊 What Gets Synced

### Design Tokens
- Colors from Figma Variables
- Typography settings
- Spacing values
- Custom token types

### Visual Assets  
- Component screenshots (PNG, 2x scale)
- Frame exports
- Prototype embeds

### Documentation
- Auto-generated token pages
- Updated timestamps
- Interactive examples

## 🛠️ Development

```bash
# Local development
npm run dev

# Test sync script
npm run sync:figma

# Build documentation  
npm run build
```

## 🚨 Troubleshooting

Common issues and solutions:

- **API Authentication** - Verify Figma token permissions
- **Webhook not triggering** - Check URL and secret configuration  
- **Missing screenshots** - Validate node IDs and file access
- **Build failures** - Check logs for missing dependencies

📖 **[Full troubleshooting guide →](./development.mdx)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes locally
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using [Mintlify](https://mintlify.com) and [Figma API](https://www.figma.com/developers/api)
