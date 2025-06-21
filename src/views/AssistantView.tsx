import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Assistant } from '../components/Assistant';
import MyPlugin from '../main';

export const VIEW_TYPE_ASSISTANT = "assistant-view";

export class AssistantView extends ItemView {
	private root: Root | null = null;
	private plugin: MyPlugin;
	private activeFile: TFile | null = null;
	private activeFileName: string = '';
	private openFiles: string[] = [];
	private allFiles: string[] = [];
	private contextFiles: string[] = [];

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_ASSISTANT;
	}

	getDisplayText() {
		return "AI Asistan";
	}

	getIcon() {
		return "message-circle";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		
		// Create React root and render the Assistant component
		this.root = createRoot(container as HTMLElement);
		
		// Set up active file tracking
		this.updateActiveFile();
		this.registerActiveFileChangeEvent();
		
		this.renderAssistant();
	}

	private updateActiveFile() {
		this.activeFile = this.app.workspace.getActiveFile();
		this.activeFileName = this.activeFile?.basename || '';
		this.updateFilesList();
		this.renderAssistant();
	}

	private updateFilesList() {
		// Get all open files from workspace
		this.openFiles = [];
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		
		leaves.forEach(leaf => {
			const file = (leaf.view as any).file;
			if (file && file instanceof TFile) {
				this.openFiles.push(file.basename);
			}
		});

		// Also check for other view types that might have files
		this.app.workspace.iterateAllLeaves(leaf => {
			const view = leaf.view;
			if (view && (view as any).file && (view as any).file instanceof TFile) {
				const fileName = (view as any).file.basename;
				if (!this.openFiles.includes(fileName)) {
					this.openFiles.push(fileName);
				}
			}
		});

		// Get all markdown files from vault
		this.allFiles = this.app.vault.getMarkdownFiles().map(file => file.basename);
	}

	private normalizeText = (text: string): string => {
		// Use Turkish locale for proper case conversion
		const normalized = text
			.toLocaleLowerCase('tr-TR')
			// Turkish character normalization - more explicit
			.replace(/ı/g, 'i')
			.replace(/İ/g, 'i') 
			.replace(/I/g, 'i')
			.replace(/ü/g, 'u')
			.replace(/Ü/g, 'u')
			.replace(/ş/g, 's')
			.replace(/Ş/g, 's')
			.replace(/ç/g, 'c')
			.replace(/Ç/g, 'c')
			.replace(/ö/g, 'o')
			.replace(/Ö/g, 'o')
			.replace(/ğ/g, 'g')
			.replace(/Ğ/g, 'g')
			// Additional common normalizations
			.replace(/[àáâãäå]/g, 'a')
			.replace(/[èéêë]/g, 'e')
			.replace(/[ìíîï]/g, 'i')
			.replace(/[òóôõö]/g, 'o')
			.replace(/[ùúûü]/g, 'u')
			.replace(/[ñ]/g, 'n');
		
		return normalized;
	};

	private searchFiles = (query: string): string[] => {
		if (!query.trim()) {
			// Return only open files when no search query
			return this.openFiles.slice(0, 20);
		}

		// Normalize the search query
		const normalizedQuery = this.normalizeText(query);
		
		// Use Obsidian's search API for better results
		const searchResults: string[] = [];
		
		// Search through all markdown files
		const markdownFiles = this.app.vault.getMarkdownFiles();
		
		for (const file of markdownFiles) {
			const fileName = file.basename;
			const filePath = file.path;
			
			// Normalize filename and path for comparison
			const normalizedFileName = this.normalizeText(fileName);
			const normalizedFilePath = this.normalizeText(filePath);
			
			// Search in normalized filename and path
			if (normalizedFileName.includes(normalizedQuery) || 
				normalizedFilePath.includes(normalizedQuery)) {
				searchResults.push(fileName);
			}
			
			// Stop at 20 results for performance
			if (searchResults.length >= 20) {
				break;
			}
		}

		return searchResults;
	};

	private registerActiveFileChangeEvent() {
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.updateActiveFile();
			})
		);
		
		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				this.updateActiveFile();
			})
		);

		// Listen for layout changes to update open files list
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.updateFilesList();
				this.renderAssistant();
			})
		);
	}

	private addContextFile = (fileName: string) => {
		if (!this.contextFiles.includes(fileName)) {
			this.contextFiles.push(fileName);
			this.renderAssistant();
		}
	};

	private removeContextFile = (fileName: string) => {
		this.contextFiles = this.contextFiles.filter(f => f !== fileName);
		this.renderAssistant();
	};

	private renderAssistant() {
		if (!this.root) return;

		// Get plugin instance to access settings
		const plugin = (this.app as any).plugins.plugins['md-assistant'] as MyPlugin;
		const apiKey = plugin?.settings?.openaiApiKey || '';

		this.root.render(
			React.createElement(Assistant, {
				apiKey: apiKey,
				activeFileName: this.activeFileName,
				openFiles: this.openFiles,
				allFiles: this.allFiles,
				contextFiles: this.contextFiles,
				onSearchFiles: this.searchFiles,
				onAddContextFile: this.addContextFile,
				onRemoveContextFile: this.removeContextFile,
				onRemoveContext: () => {
					this.activeFileName = '';
					this.renderAssistant();
				},
				onSendMessage: (message: string) => {
					console.log('User message:', message);
					console.log('Active file context:', this.activeFileName);
					console.log('Context files:', this.contextFiles);
					console.log('Open files:', this.openFiles);
					// Here we can handle the message, send it to OpenAI with file context, etc.
				}
			})
		);
	}

	async onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
} 