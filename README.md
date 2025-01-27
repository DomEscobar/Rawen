<div align="center">
  <img src="public/mainlogo.png" width="120" height="120" />
  <h1>Rawen</h1>
  <p><strong>An AI-powered desktop assistant for seamless knowledge management</strong></p>
  <img src="https://i.ibb.co/8xmfNxD/Rawenio.png" width="400" height="400" />
</div>

## Features

- 🤖 **AI-Powered Commands**: Create and execute custom commands using various AI models
- 🔍 **Smart Knowledge Base**: Store and query your documents, images, and data with semantic search
- ⌨️ **Global Shortcuts**: Set up system-wide keyboard shortcuts for quick access to commands
- 🎯 **Context-Aware**: Understands your current context to provide relevant assistance
- 🖼️ **Image Analysis**: Process and analyze images using advanced AI models
- 🌐 **Web Integration**: Extract and summarize content from websites and YouTube videos

## Quick Start

1. Download the latest release for your platform from the [releases page](https://github.com/domEscobar/rawen/releases)
2. Install and launch Rawen
3. Configure your preferred AI providers in Settings > Keys
4. Start using commands or create your own custom workflows

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/domEscobar/rawen.git

# Install dependencies forced to avoid potential issues
npm i --force

# Start development server
npm run dev
```

### Building

```bash
# Build for production
npm run build
```

## Configuration

### AI Providers

Rawen supports multiple AI providers:

- OpenAI
- Google AI
- Ollama (local)
- DeepSeek

Configure your API keys and preferences in the Settings > Keys section.

### Knowledge Base

The knowledge base supports various file formats:

- Documents (PDF, DOCX, TXT)
- Images (PNG, JPG, WEBP)
- Spreadsheets (XLSX, CSV)
- Web content

## Creating Custom Commands

1. Go to Settings > Commands
2. Click "+ Add" to create a new command
3. Configure the command with:
   - Name and description
   - Input processing
   - AI model selection
   - Action chain
   - Output handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Technologies

- Electron
- React
- TypeScript
- Tailwind CSS
- LangChain
- Transformers.js
- LanceDB

## License

MIT License - see [LICENSE](LICENSE) for details.
