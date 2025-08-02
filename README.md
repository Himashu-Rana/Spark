# Apify Integration

A web application for Apify platform integration with API key authentication, actor browsing, schema loading, and execution capabilities.

## Features

- API Key Authentication
- Dynamic Actor Discovery
- Runtime Schema Loading
- Actor Execution
- Real-time Results
- Modern UI/UX
- Responsive Design

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS + Radix UI
- Express.js
- React Router

## Quick Start

```bash
npm install
npm run dev
```


- **Vitest** for testing
- **Hot Module Replacement** for fast development
- **Shared Types** between client and server

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Apify account with API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apify-integration-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔑 Getting Your Apify API Key

1. Visit the [Apify Console](https://console.apify.com/account/integrations)
2. Navigate to **Account Settings** → **Integrations**
3. Copy your API key (starts with `apify_api_...`)
4. Use this key in the application's authentication screen

## 📖 Usage Guide

### Step 1: Authentication
- Enter your Apify API key on the welcome screen
- Click "Connect to Apify" to validate your credentials
- The app will automatically load your actors upon successful authentication

### Step 2: Actor Selection
- Browse your available actors in the grid view
- Each card shows actor name, description, run count, and last update
- Click on any actor to proceed to the execution interface

### Step 3: Input Configuration
- The app dynamically loads the actor's input schema
- Fill in the required and optional parameters
- Input types are automatically determined (text, number, boolean, textarea)
- Required fields are marked with a red asterisk (*)

### Step 4: Execution & Results
- Click "Execute Actor" to start the run
- Monitor real-time execution status
- View detailed run information including:
  - Execution status (Running, Succeeded, Failed)
  - Start and finish timestamps
  - Runtime duration
  - Output data size
  - Complete results data (if available)

## 🏗 Architecture & Design Decisions

### API Design
- **RESTful endpoints** for clear, predictable interactions
- **Shared TypeScript types** ensure consistency between frontend and backend
- **Bearer token authentication** for secure API key handling
- **Comprehensive error responses** with actionable error messages

### Frontend Architecture
- **Component-based design** with reusable UI components
- **State management** using React hooks for simplicity
- **Progressive disclosure** of information (auth → actors → execution)
- **Responsive grid layouts** for optimal viewing on all devices

### Security Considerations
- API keys are validated server-side before use
- No API keys stored in client-side code
- CORS properly configured for development
- Input validation on both client and server

### Performance Optimizations
- Efficient API polling for run status updates
- Lazy loading of actor schemas
- Optimized bundle size with Vite
- Minimal re-renders with proper React patterns

## 🧪 Testing Actor

For demonstration purposes, we recommend testing with the following types of actors:

### Simple Web Scraper
- **Actor**: `apify/web-scraper`
- **Description**: General-purpose web scraper
- **Test Input**: 
  ```json
  {
    "startUrls": [{"url": "https://example.com"}],
    "pageFunction": "async function pageFunction(context) { return { title: document.title }; }"
  }
  ```

### Instagram Scraper
- **Actor**: `apify/instagram-scraper`
- **Description**: Extract Instagram posts and profiles
- **Test Input**:
  ```json
  {
    "usernames": ["instagram"],
    "resultsLimit": 10
  }
  ```

## 🎨 Design System

The application features a modern design system with:

### Color Palette
- **Primary**: Vibrant blue (#3B82F6) for primary actions
- **Secondary**: Deep navy (#1E293B) for secondary elements
- **Accent**: Warm orange (#FB923C) for highlights
- **Success**: Fresh green (#10B981) for success states
- **Warning**: Amber (#F59E0B) for warnings
- **Destructive**: Red (#EF4444) for errors

### Typography
- Clean, readable fonts with proper hierarchy
- Consistent spacing and sizing
- Code snippets in monospace font

### Components
- Rounded corners with 12px radius
- Subtle shadows and borders
- Smooth transitions and hover effects
- Accessible color contrast ratios

## 🚀 Deployment Options

### Netlify (Recommended)
- Connect to the [Netlify MCP integration](#open-mcp-popover)
- Automatic deployments from git repository
- Built-in CDN and HTTPS

### Vercel
- Connect to the [Vercel MCP integration](#open-mcp-popover)
- Serverless functions support
- Edge network deployment

### Manual Deployment
```bash
npm run build
# Deploy contents of dist/ folder to your hosting provider
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
- Write meaningful commit messages
- Add tests for new functionality

## 📝 Notable Design Choices

### Single-Page Application
- Chose SPA architecture for smooth user experience
- Client-side routing for instant navigation
- State preserved between views

### Real-time Execution Monitoring
- Implemented polling mechanism for run status updates
- 60-second timeout to prevent infinite waiting
- Graceful handling of long-running actors

### Dynamic Schema Rendering
- Built flexible form generator for any actor schema
- Supports various input types (string, number, boolean, textarea)
- Handles required/optional field validation

### Error Handling Strategy
- Comprehensive error boundaries
- User-friendly error messages
- Fallback states for all failure scenarios
- Clear recovery paths

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Custom ping message for health checks
PING_MESSAGE=pong

# Optional: Custom port (defaults to 8080)
PORT=8080
```

## 📊 Performance Metrics

- **Build time**: ~4.5 seconds
- **Bundle size**: ~554KB (minified)
- **CSS size**: ~61KB (includes full design system)
- **Load time**: <2 seconds on fast connections

## 🐛 Troubleshooting

### Common Issues

**Invalid API Key Error**
- Verify your API key is correct
- Ensure you have the necessary permissions
- Check your Apify account is active

**No Actors Found**
- Verify you have actors in your Apify account
- Check your account permissions
- Try creating a simple actor in Apify Console

**Execution Timeouts**
- Some actors may take longer than 60 seconds
- Check actor logs in Apify Console
- Verify your input parameters are correct

**Build Errors**
- Ensure Node.js version is 18 or higher
- Clear node_modules and reinstall dependencies
- Check for TypeScript errors

## 📚 Additional Resources

- [Apify Documentation](https://docs.apify.com/)
- [Apify API Reference](https://docs.apify.com/api/v2)
- [Apify Console](https://console.apify.com/)
- [Actor Development Guide](https://docs.apify.com/actors)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using modern web technologies and best practices**
