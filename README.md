# Content Templatizer Chrome Extension

## Overview
Content Templatizer is a Chrome extension that uses AI to analyze social media posts and generate customizable content templates. It's designed to help content creators and marketers quickly adapt successful post formats to their own messaging.

## Features (MVP)
- Post selection from LinkedIn and Twitter
- AI-powered template generation using Claude 3.5 Sonnet
- Template customization based on Justin Welsh's content categories:
  - Growth
  - Knowledge
  - Authority
  - Empathize
- "Copy to Clipboard" functionality for easy template export
- User settings for API key management and profile information

## Installation
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the cloned repository folder

## Usage
1. Navigate to LinkedIn or Twitter
2. Select a post by clicking on it
3. Open the extension popup
4. Choose a content category
5. Click "Templatize" to generate a template
6. Customize the template as needed
7. Click "Copy to Clipboard" to export the template

## Development Setup
1. Ensure you have Node.js and npm installed
2. Run `npm install` to install dependencies
3. Create a `.env` file in the root directory and add your Claude API key: CLAUDE_API_KEY=your_api_key_here

## Contributing
We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to get started.

## Roadmap
- Implement Twitter integration
- Refine AI prompts for improved template generation
- Create user guide for Notion integration
- Develop video tutorial for workflow explanation
- Implement error handling and user feedback mechanisms

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments
- Justin Welsh for the content category framework
- Anthropic for the Claude AI API

## Contact
For any questions or concerns, please open an issue on this repository.
