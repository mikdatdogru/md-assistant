# TECHNICAL CONTEXT: Obsidian LLM Chat Plugin

## Technology Stack Overview

### Core Technologies
- **Runtime Environment**: Node.js (v16+)
- **Language**: TypeScript 4.7.4
- **Framework**: React 19.1.0
- **Build Tool**: esbuild 0.17.3
- **Package Manager**: npm
- **Platform**: Obsidian Plugin API

### LLM Integration Stack
- **Primary Provider**: OpenAI API (ChatGPT)
- **HTTP Client**: Native fetch with streaming support
- **Authentication**: API key-based
- **Rate Limiting**: Custom implementation
- **Error Handling**: Retry logic with exponential backoff

### Data & Storage
- **Configuration**: Obsidian plugin settings API
- **File System**: Obsidian Vault API
- **Cache**: In-memory caching for context
- **Security**: Encrypted API key storage
- **State Management**: React Context + Hooks

## Architecture Patterns

### Plugin Architecture
Obsidian Plugin Entry Point
├── Settings Manager
├── LLM Service Layer
├── Chat Interface (React)
├── File System Integration
└── RAG System

### Component Architecture
React Component Tree
├── AssistantView (Main Container)
├── ChatInterface (Message Display)
├── InputSystem (User Input)
├── ContextSelector (File Selection)
├── SettingsPanel (Configuration)
└── UtilityComponents (Icons, Modals)

### Service Layer Architecture
Service Abstraction
├── LLMProvider Interface
│ ├── OpenAIProvider
│ ├── ClaudeProvider (Future)
│ └── GoogleLLMProvider (Future)
├── RAGService
├── FileService
└── ConfigService


## API Integration Details

### OpenAI API Integration
- **Endpoint**: https://api.openai.com/v1/chat/completions
- **Models**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Features**: Streaming responses, function calling
- **Rate Limits**: 3,500 RPM (Tier 1), 10,000 RPM (Tier 2)
- **Error Codes**: 429 (rate limit), 401 (auth), 500 (server)

### Obsidian API Integration
- **Plugin API**: obsidian.d.ts definitions
- **File System**: TFile, TFolder, Vault methods
- **Settings**: PluginSettingTab, Setting components
- **UI**: Modal, Notice, Menu classes
- **Events**: Workspace events, file system events

## Data Flow Architecture

### Request Flow
1. **User Input** → InputComponent
2. **Context Selection** → FileService
3. **Request Preparation** → RAGService
4. **LLM API Call** → LLMProvider
5. **Response Processing** → ChatInterface
6. **UI Update** → React State Management

### File Processing Flow
1. **File Selection** → Obsidian Vault API
2. **Content Extraction** → FileService
3. **Context Preparation** → RAGService
4. **Metadata Extraction** → FileService
5. **Cache Management** → In-memory storage

## Security Architecture

### API Key Management
- **Storage**: Obsidian encrypted plugin data
- **Transmission**: HTTPS only
- **Rotation**: User-controlled key updates
- **Validation**: Key format and permission checking

### Data Privacy
- **Local Processing**: Vault data stays local until sent to LLM
- **User Consent**: Explicit permission for cloud processing
- **Data Minimization**: Only send relevant context
- **Audit Trail**: Log API requests (without content)

### Error Security
- **Sanitization**: Clean error messages
- **No Key Exposure**: Avoid API keys in logs
- **Fallback Handling**: Graceful degradation
- **Rate Limit Protection**: Prevent abuse

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load components on demand
- **Context Caching**: Cache processed file content
- **Debounced Input**: Prevent excessive API calls
- **Streaming**: Real-time response display
- **Memory Management**: Cleanup unused contexts

### Scalability Factors
- **Large Vaults**: Efficient file system access
- **Context Size**: Smart content truncation
- **Concurrent Requests**: Request queuing
- **Memory Usage**: Garbage collection optimization
- **Bundle Size**: Code splitting and tree shaking

## Development Environment

### Build System
- **Development**: `npm run dev` (watch mode)
- **Production**: `npm run build` (optimized)
- **Type Checking**: `tsc -noEmit -skipLibCheck`
- **Hot Reload**: esbuild watch mode
- **Output**: `dist/main.js`, `dist/styles.css`

### Testing Strategy
- **Unit Tests**: Component and service testing
- **Integration Tests**: API interaction testing
- **E2E Tests**: Full user workflow testing
- **Manual Testing**: Obsidian plugin testing
- **Performance Tests**: Load and stress testing

### Development Tools
- **IDE**: VS Code with TypeScript support
- **Debugging**: Chrome DevTools, Obsidian DevTools
- **Version Control**: Git with semantic versioning
- **Documentation**: JSDoc comments, README files
- **Linting**: ESLint with TypeScript rules

## Deployment & Distribution

### Plugin Distribution
- **Primary**: Obsidian Community Plugin Store
- **Secondary**: GitHub Releases (manual install)
- **Beta**: GitHub pre-releases for testing
- **Development**: Local installation for testing

### Release Process
1. **Version Bump**: Update manifest.json, package.json
2. **Build**: Production build with optimization
3. **Testing**: Final validation and testing
4. **Release**: GitHub release with assets
5. **Store**: Community plugin store submission

### Monitoring & Maintenance
- **Error Tracking**: GitHub Issues
- **User Feedback**: Plugin store reviews
- **Performance**: User-reported performance issues
- **Updates**: Regular dependency updates
- **Security**: Security audit and updates