# 🎨🎨🎨 CREATIVE PHASE: RAG ALGORITHM DESIGN 🎨🎨🎨

## Component Description
**RAG (Retrieval-Augmented Generation) System** - File content'i process ederek LLM'e contextual bilgi sağlayan intelligent retrieval system. Obsidian vault'daki dosyaları analyze ederek relevant context'i extract etmeli ve LLM prompt'ını enhance etmeli.

## Requirements & Constraints

### Functional Requirements
- **Content Extraction**: Markdown, code, metadata parsing
- **Context Retrieval**: Relevant file content selection
- **Prompt Enhancement**: System prompt generation with context
- **Obsidian Knowledge**: Plugin features, markdown syntax, commands
- **Semantic Search**: Keyword ve content-based retrieval
- **Memory Management**: Efficient caching ve storage

### Technical Constraints
- **No External Vector DB**: Lightweight, in-memory solution
- **Obsidian Plugin API**: File system access limitations
- **Performance**: Fast retrieval for large vaults
- **Memory Usage**: Minimal memory footprint
- **TypeScript**: Type-safe implementation
- **Bundle Size**: Keep plugin size minimal

### Content Constraints
- **Markdown Files**: Primary content type
- **Code Blocks**: Various programming languages
- **Frontmatter**: YAML metadata support
- **Images/Links**: Reference handling
- **File Types**: Text-based files primarily

## Options Analysis

### Option 1: Simple Keyword-Based Search
```typescript
class SimpleRAG {
  async retrieveContext(query: string, files: TFile[]): Promise<string[]> {
    const keywords = this.extractKeywords(query);
    const relevantFiles = [];
    
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const score = this.calculateKeywordScore(content, keywords);
      
      if (score > threshold) {
        relevantFiles.push({
          file,
          content: this.extractRelevantSections(content, keywords),
          score
        });
      }
    }
    
    return relevantFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFiles)
      .map(item => item.content);
  }
  
  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .filter(word => !STOP_WORDS.includes(word));
  }
}
```

**Pros:**
- ✅ Simple and fast implementation
- ✅ No external dependencies
- ✅ Easy to understand and debug
- ✅ Low memory usage
- ✅ Good performance for small to medium vaults

**Cons:**
- ❌ Limited semantic understanding
- ❌ May miss contextually relevant content
- ❌ No handling of synonyms or related concepts
- ❌ Basic relevance scoring

**Complexity**: Low
**Implementation Time**: 1 day

### Option 2: TF-IDF with Weighted Scoring
```typescript
class TFIDFRag {
  private documentFrequency = new Map<string, number>();
  private termFrequency = new Map<string, Map<string, number>>();
  
  async indexFiles(files: TFile[]) {
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const terms = this.tokenize(content);
      const tf = this.calculateTermFrequency(terms);
      
      this.termFrequency.set(file.path, tf);
      
      // Update document frequency
      for (const term of new Set(terms)) {
        this.documentFrequency.set(
          term, 
          (this.documentFrequency.get(term) || 0) + 1
        );
      }
    }
  }
  
  async retrieveContext(query: string, files: TFile[]): Promise<string[]> {
    const queryTerms = this.tokenize(query);
    const scores = new Map<string, number>();
    
    for (const file of files) {
      const tf = this.termFrequency.get(file.path);
      if (!tf) continue;
      
      let score = 0;
      for (const term of queryTerms) {
        const termFreq = tf.get(term) || 0;
        const docFreq = this.documentFrequency.get(term) || 1;
        const idf = Math.log(files.length / docFreq);
        
        score += termFreq * idf;
      }
      
      scores.set(file.path, score);
    }
    
    return Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxFiles)
      .map(([path]) => path);
  }
}
```

**Pros:**
- ✅ Better relevance scoring than keyword search
- ✅ Handles term importance across documents
- ✅ Standard information retrieval approach
- ✅ Scalable to larger document collections
- ✅ Good balance of complexity and effectiveness

**Cons:**
- ❌ Requires indexing step (startup cost)
- ❌ Still limited semantic understanding
- ❌ Memory overhead for indices
- ❌ Complex for simple use cases

**Complexity**: Medium
**Implementation Time**: 2-3 days

### Option 3: Semantic Chunks with Context Windows ⭐ **SELECTED**
```typescript
class SemanticRAG {
  private chunks = new Map<string, DocumentChunk[]>();
  private obsidianKnowledge: ObsidianKnowledgeBase;
  
  interface DocumentChunk {
    id: string;
    filePath: string;
    content: string;
    type: 'header' | 'paragraph' | 'code' | 'list';
    metadata: ChunkMetadata;
    context: string; // Surrounding context
  }
  
  async indexFiles(files: TFile[]) {
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const chunks = await this.createSemanticChunks(content, file);
      this.chunks.set(file.path, chunks);
    }
  }
  
  async retrieveContext(query: string, files: TFile[]): Promise<ContextResult[]> {
    const queryIntent = this.analyzeQueryIntent(query);
    const relevantChunks = [];
    
    // Multi-stage retrieval
    for (const file of files) {
      const fileChunks = this.chunks.get(file.path) || [];
      
      for (const chunk of fileChunks) {
        const scores = {
          semantic: this.calculateSemanticScore(query, chunk),
          structural: this.calculateStructuralScore(queryIntent, chunk),
          recency: this.calculateRecencyScore(chunk),
          obsidian: this.calculateObsidianRelevance(query, chunk)
        };
        
        const finalScore = this.weightedScore(scores);
        
        if (finalScore > threshold) {
          relevantChunks.push({
            chunk,
            score: finalScore,
            context: this.expandContext(chunk, fileChunks)
          });
        }
      }
    }
    
    return this.rankAndFilter(relevantChunks);
  }
  
  private createSemanticChunks(content: string, file: TFile): DocumentChunk[] {
    const lines = content.split('\n');
    const chunks: DocumentChunk[] = [];
    let currentChunk: string[] = [];
    let currentType: ChunkType = 'paragraph';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect semantic boundaries
      if (this.isSemanticBoundary(line, lines[i-1], lines[i+1])) {
        if (currentChunk.length > 0) {
          chunks.push(this.createChunk(
            currentChunk.join('\n'),
            currentType,
            file,
            this.getContext(lines, i - currentChunk.length, i)
          ));
          currentChunk = [];
        }
        currentType = this.detectChunkType(line);
      }
      
      currentChunk.push(line);
    }
    
    return chunks;
  }
  
  private analyzeQueryIntent(query: string): QueryIntent {
    return {
      type: this.detectQueryType(query), // 'question', 'request', 'analysis'
      domain: this.detectDomain(query), // 'code', 'concept', 'specific'
      scope: this.detectScope(query), // 'file', 'project', 'concept'
      obsidianSpecific: this.isObsidianQuery(query)
    };
  }
}
```

**Pros:**
- ✅ Intelligent semantic chunking
- ✅ Multi-dimensional relevance scoring
- ✅ Context-aware retrieval
- ✅ Obsidian-specific optimization
- ✅ Good balance of semantic understanding and performance

**Cons:**
- ❌ Higher implementation complexity
- ❌ More memory usage than simple approaches
- ❌ Requires sophisticated scoring algorithms
- ❌ Longer development time

**Complexity**: Medium-High
**Implementation Time**: 3-4 days

### Option 4: Vector Embeddings with Local Model
```typescript
class EmbeddingRAG {
  private embeddings = new Map<string, Float32Array>();
  private localEmbeddingModel: LocalEmbeddingModel;
  
  async indexFiles(files: TFile[]) {
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const chunks = this.chunkContent(content);
      
      for (const chunk of chunks) {
        const embedding = await this.localEmbeddingModel.embed(chunk.text);
        this.embeddings.set(chunk.id, embedding);
      }
    }
  }
  
  async retrieveContext(query: string): Promise<string[]> {
    const queryEmbedding = await this.localEmbeddingModel.embed(query);
    const similarities = [];
    
    for (const [chunkId, embedding] of this.embeddings.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      similarities.push({ chunkId, similarity });
    }
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => this.getChunkContent(item.chunkId));
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

**Pros:**
- ✅ True semantic understanding
- ✅ Best relevance quality
- ✅ Handles synonyms and related concepts
- ✅ State-of-the-art retrieval performance

**Cons:**
- ❌ Requires local embedding model (large bundle size)
- ❌ High memory usage
- ❌ Slow indexing process
- ❌ Complex implementation
- ❌ May require GPU acceleration

**Complexity**: Very High
**Implementation Time**: 5-7 days

## Recommended Approach: Option 3 - Semantic Chunks with Context Windows

### Justification
**Semantic Chunks with Context Windows** en uygun seçim çünkü:

1. **Balanced Performance**: Good semantic understanding without heavy dependencies
2. **Obsidian Optimization**: Specifically designed for Obsidian content patterns
3. **Context Awareness**: Maintains document structure and relationships
4. **Practical Implementation**: Achievable within plugin constraints
5. **Scalability**: Works well for various vault sizes
6. **Memory Efficiency**: Reasonable memory usage compared to embeddings

## Implementation Guidelines

### Core Architecture
```typescript
interface RAGService {
  indexFiles(files: TFile[]): Promise<void>;
  retrieveContext(query: string, files: TFile[]): Promise<ContextResult[]>;
  enhancePrompt(query: string, context: ContextResult[]): string;
  getObsidianKnowledge(query: string): ObsidianKnowledge;
}

interface ContextResult {
  content: string;
  filePath: string;
  relevanceScore: number;
  chunkType: 'header' | 'paragraph' | 'code' | 'list';
  metadata: {
    fileType: string;
    lastModified: Date;
    section?: string;
    tags?: string[];
  };
}

interface ObsidianKnowledge {
  commands: string[];
  markdownSyntax: string[];
  pluginFeatures: string[];
  shortcuts: string[];
}
```

### Obsidian Knowledge Base
```typescript
class ObsidianKnowledgeBase {
  private knowledgeBase = {
    markdownSyntax: [
      "# Headers: Use # for H1, ## for H2, etc.",
      "**Bold text** and *italic text*",
      "[[Internal links]] to other notes",
      "![[Embedded images or files]]",
      "```code blocks``` with language specification",
      "- [ ] Task lists with checkboxes",
      "| Tables | With | Pipes |",
      "> Blockquotes for emphasis",
      "Tags: #tag-name for organization"
    ],
    
    obsidianFeatures: [
      "Graph view for visualizing note connections",
      "Search with operators: path:, tag:, line:",
      "Quick switcher with Ctrl/Cmd + O",
      "Command palette with Ctrl/Cmd + P",
      "Templates for consistent note structure",
      "Daily notes for journaling",
      "Canvas for visual note organization",
      "Plugin system for extended functionality"
    ],
    
    shortcuts: [
      "Ctrl/Cmd + N: New note",
      "Ctrl/Cmd + E: Toggle edit/preview",
      "Ctrl/Cmd + [: Navigate back",
      "Ctrl/Cmd + ]: Navigate forward",
      "Ctrl/Cmd + .: Open settings",
      "Alt + Click: Open in new pane"
    ]
  };
  
  getRelevantKnowledge(query: string): string[] {
    const relevant = [];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('markdown') || queryLower.includes('format')) {
      relevant.push(...this.knowledgeBase.markdownSyntax);
    }
    
    if (queryLower.includes('obsidian') || queryLower.includes('feature')) {
      relevant.push(...this.knowledgeBase.obsidianFeatures);
    }
    
    if (queryLower.includes('shortcut') || queryLower.includes('hotkey')) {
      relevant.push(...this.knowledgeBase.shortcuts);
    }
    
    return relevant;
  }
}
```

### Prompt Enhancement Strategy
```typescript
class PromptEnhancer {
  enhancePrompt(
    userQuery: string, 
    context: ContextResult[], 
    obsidianKnowledge: string[]
  ): string {
    const systemPrompt = this.buildSystemPrompt();
    const contextSection = this.buildContextSection(context);
    const knowledgeSection = this.buildKnowledgeSection(obsidianKnowledge);
    
    return `${systemPrompt}

## Available Context
${contextSection}

## Obsidian Knowledge
${knowledgeSection}

## User Query
${userQuery}

Please provide a helpful response based on the available context and your knowledge of Obsidian. If you suggest creating or modifying files, use proper Obsidian markdown syntax.`;
  }
  
  private buildSystemPrompt(): string {
    return `You are an AI assistant integrated into Obsidian, a powerful note-taking application. You have access to the user's vault content and knowledge about Obsidian features.

Guidelines:
- Use the provided context from the user's files when relevant
- Suggest Obsidian-specific features and syntax when appropriate
- If creating or modifying content, use proper markdown formatting
- Reference specific files from the context when applicable
- Provide actionable advice that works within Obsidian`;
  }
  
  private buildContextSection(context: ContextResult[]): string {
    if (context.length === 0) return "No specific files selected.";
    
    return context.map(ctx => 
      `### ${ctx.filePath}
${ctx.content}
`
    ).join('\n');
  }
}
```

## Verification Checkpoint
✅ **Requirements Met:**
- Content extraction with markdown parsing
- Context retrieval with relevance scoring
- Prompt enhancement with system context
- Obsidian-specific knowledge integration
- Semantic search capabilities
- Memory-efficient implementation

✅ **Technical Feasibility:** High - uses proven algorithms
✅ **Performance:** Good - optimized for Obsidian use cases
✅ **Bundle Size Impact:** Minimal - no external models

# 🎨🎨🎨 EXITING CREATIVE PHASE: RAG ALGORITHM DESIGN 🎨🎨🎨 