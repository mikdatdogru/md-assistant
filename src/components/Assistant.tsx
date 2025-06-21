import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface AssistantProps {
  onSendMessage?: (message: string) => void;
  apiKey?: string;
  activeFileName?: string;
  onRemoveContext?: () => void;
  openFiles?: string[];
  allFiles?: string[];
  onSearchFiles?: (query: string) => string[];
  contextFiles?: string[];
  onAddContextFile?: (fileName: string) => void;
  onRemoveContextFile?: (fileName: string) => void;
}

// CSS Upward Arrow Icon - Balanced and centered design
const SendIcon: React.FC<{ size?: number }> = ({ size = 16 }) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      {/* Arrow head pointing up - smaller and balanced */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size * 0.18}px solid transparent`,
          borderRight: `${size * 0.18}px solid transparent`,
          borderBottom: `${size * 0.25}px solid currentColor`,
          position: 'absolute',
          top: '25%'
        }}
      />
      {/* Arrow tail (vertical line) - properly centered */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          width: '2px',
          height: `${size * 0.35}px`,
          backgroundColor: 'currentColor',
          transform: 'translateX(-50%)'
        }}
      />
    </div>
  );
};

// CSS Agent Icon - Infinity symbol style
const AgentIcon: React.FC<{ size?: number }> = ({ size = 12 }) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      {/* Left circle */}
      <div
        style={{
          width: `${size * 0.35}px`,
          height: `${size * 0.35}px`,
          border: `${Math.max(1, size * 0.08)}px solid currentColor`,
          borderRadius: '50%',
          position: 'absolute',
          left: '15%',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      {/* Right circle */}
      <div
        style={{
          width: `${size * 0.35}px`,
          height: `${size * 0.35}px`,
          border: `${Math.max(1, size * 0.08)}px solid currentColor`,
          borderRadius: '50%',
          position: 'absolute',
          right: '15%',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      />
      {/* Center connection */}
      <div
        style={{
          position: 'absolute',
          left: '35%',
          right: '35%',
          top: '50%',
          height: `${Math.max(1, size * 0.08)}px`,
          backgroundColor: 'currentColor',
          transform: 'translateY(-50%)'
        }}
      />
    </div>
  );
};

// CSS Chat Icon - Speech bubble style
const ChatIcon: React.FC<{ size?: number }> = ({ size = 12 }) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      {/* Main bubble */}
      <div
        style={{
          width: `${size * 0.7}px`,
          height: `${size * 0.55}px`,
          border: `${Math.max(1, size * 0.08)}px solid currentColor`,
          borderRadius: `${size * 0.15}px`,
          position: 'absolute',
          top: '20%',
          left: '15%'
        }}
      />
      {/* Bubble tail */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size * 0.12}px solid transparent`,
          borderRight: `${size * 0.12}px solid transparent`,
          borderTop: `${size * 0.15}px solid currentColor`,
          position: 'absolute',
          bottom: '25%',
          left: '25%'
        }}
      />
    </div>
  );
};

// CSS Remove Icon - More prominent X
const RemoveIcon: React.FC<{ size?: number }> = ({ size = 14 }) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      {/* First diagonal line */}
      <div
        style={{
          position: 'absolute',
          width: `${size * 0.7}px`,
          height: '2px',
          backgroundColor: 'currentColor',
          transform: 'rotate(45deg)',
          borderRadius: '1px'
        }}
      />
      {/* Second diagonal line */}
      <div
        style={{
          position: 'absolute',
          width: `${size * 0.7}px`,
          height: '2px',
          backgroundColor: 'currentColor',
          transform: 'rotate(-45deg)',
          borderRadius: '1px'
        }}
      />
    </div>
  );
};

// CSS File Add Icon - Simple plus icon
const FileAddIcon: React.FC<{ size?: number }> = ({ size = 12 }) => {
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      {/* Plus horizontal line */}
      <div
        style={{
          position: 'absolute',
          width: `${size * 0.6}px`,
          height: '1px',
          backgroundColor: 'currentColor'
        }}
      />
      {/* Plus vertical line */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: `${size * 0.6}px`,
          backgroundColor: 'currentColor'
        }}
      />
    </div>
  );
};

export const Assistant: React.FC<AssistantProps> = ({ 
  onSendMessage, 
  apiKey, 
  activeFileName, 
  onRemoveContext,
  openFiles = [],
  allFiles = [],
  onSearchFiles,
  contextFiles = [],
  onAddContextFile,
  onRemoveContextFile
}) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Dropdown states
  const [chatType, setChatType] = useState('Agent');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [showChatTypeDropdown, setShowChatTypeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // File selector states
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const chatTypes = ['Agent', 'Chat with Vault','Chat with selected file(s)'];
  const openAIModels = [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' },
    { id: 'gpt-4-1106-preview', name: 'GPT-4 Turbo Preview' },
    { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision Preview' }
  ];

  // Search function for files
  const searchFiles = (query: string): string[] => {
    if (!query.trim()) {
      // Show only open files when no search query
      return openFiles.slice(0, 20);
    }
    
    // Use Obsidian API search when query exists
    if (onSearchFiles) {
      return onSearchFiles(query);
    }
    
    // Fallback: search in all files
    const filtered = allFiles.filter(file => 
      file.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, 20); // Max 20 results
  };

  // Close dropdowns and file selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowChatTypeDropdown(false);
        setShowModelDropdown(false);
      }
      if (!target.closest('.file-selector-container')) {
        setShowFileSelector(false);
        setFileSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update search results when search query changes
  useEffect(() => {
    if (showFileSelector) {
      const results = searchFiles(fileSearchQuery);
      setSearchResults(results);
      setSelectedIndex(-1); // Reset selection when results change
    }
  }, [fileSearchQuery, showFileSelector]);

  // Handle keyboard navigation in file selector
  const handleFileSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showFileSelector || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < searchResults.length - 1 ? prev + 1 : prev;
          // Scroll to selected item after state update
          setTimeout(() => scrollToSelectedItem(newIndex), 0);
          return newIndex;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : -1;
          // Scroll to selected item after state update
          setTimeout(() => scrollToSelectedItem(newIndex), 0);
          return newIndex;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const selectedFile = searchResults[selectedIndex];
          if (onAddContextFile) {
            onAddContextFile(selectedFile);
          }
          setShowFileSelector(false);
          setFileSearchQuery('');
          setSelectedIndex(-1);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowFileSelector(false);
        setFileSearchQuery('');
        setSelectedIndex(-1);
        break;
    }
  };

  // Scroll to selected item in file list
  const scrollToSelectedItem = (index: number) => {
    if (index < 0) return;
    
    const fileList = document.querySelector('.assistant-file-list');
    const selectedItem = document.querySelector(`.assistant-file-item:nth-child(${index + 1})`);
    
    if (fileList && selectedItem) {
      const listRect = fileList.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();
      
      // Check if item is below visible area
      if (itemRect.bottom > listRect.bottom) {
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      // Check if item is above visible area
      else if (itemRect.top < listRect.top) {
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    const newConversation = [...conversation, { role: 'user' as const, content: userMessage }];
    
    // Update state synchronously
    setMessage('');
    setShowWelcome(false);
    setConversation(newConversation);
    setIsLoading(true);
    
    // Immediately refocus the textarea after sending
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    // Simulate API call for now
    setTimeout(() => {
      const assistantResponse = `[${chatType} - ${openAIModels.find(m => m.id === selectedModel)?.name}] Bu mesajınıza cevap: "${userMessage}"`;
      setConversation([...newConversation, { role: 'assistant' as const, content: assistantResponse }]);
      setIsLoading(false);
    }, 1000);

    if (onSendMessage) {
      onSendMessage(userMessage);
    }
  };

  const WelcomeContent = () => (
    <div className="assistant-welcome-content">
      
      <div className="assistant-welcome-final">
        <p>
          Artık çok daha profesyonel ve genişletilebilir bir AI asistan plugin'iniz var! 
          Gelecekte OpenAI API entegrasyonu, daha fazla AI özelliği ve özelleştirmeler ekleyebiliriz. 🎊
        </p>
      </div>
    </div>
  );

  // Custom Dropdown Component
  const Dropdown = ({ 
    value, 
    options, 
    onChange, 
    isOpen, 
    onToggle, 
    icon 
  }: {
    value: string;
    options: Array<{id: string, name: string} | string>;
    onChange: (value: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    icon?: string; // Make icon optional
  }) => {
    // Dynamic icon logic for agent selector
    const getDisplayIcon = () => {
      if (icon === 'dynamic-agent') {
        return value === 'Agent' ? 
          <div className="dropdown-icon infinity"><AgentIcon size={12} /></div> : 
          <div className="dropdown-icon chat"><ChatIcon size={12} /></div>;
      }
      return null;
    };

    const displayIcon = getDisplayIcon();

    return (
      <div className="dropdown-container">
        <button 
          onClick={onToggle}
          className="dropdown-button"
        >
          {displayIcon}
          <span className="dropdown-text">
            {typeof options[0] === 'string' ? value : (options as Array<{id: string, name: string}>).find(o => o.id === value)?.name || value}
          </span>
          <span className={`dropdown-chevron ${isOpen ? 'open' : ''}`}>
            ▼
          </span>
        </button>
        
        {isOpen && (
          <div className="dropdown-menu">
            {options.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.id;
              const optionLabel = typeof option === 'string' ? option : option.name;
              const isSelected = value === optionValue;
              
              return (
                <button
                  key={optionValue}
                  onClick={() => {
                    onChange(optionValue);
                    onToggle();
                  }}
                  className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                >
                  <span className="dropdown-item-bullet">
                    {isSelected ? 
                      <span>●</span> : 
                      <span>○</span>
                    }
                  </span>
                  <span>{optionLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="assistant-container">
      {showWelcome && conversation.length === 0 ? (
        <div className="assistant-welcome">
          <WelcomeContent />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="assistant-header">
            <div className="assistant-header-left">
              <span className="assistant-title">AI Assistant</span>
            </div>
            <div className="assistant-status">
              <div className="assistant-status-dot"></div>
              <span>Online</span>
            </div>
          </div>

          {/* Chat Area */}
          <div className="assistant-chat">
            {conversation.map((msg, index) => (
              <div key={index} className={`assistant-message ${msg.role}`}>
                <div className={`assistant-avatar ${msg.role}`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={`assistant-message-content ${msg.role}`}>
                  {msg.content}
                  <div className={`assistant-message-time ${msg.role}`}>
                    {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="assistant-message">
                <div className="assistant-avatar assistant">AI</div>
                <div className="assistant-loading">
                  <div className="assistant-loading-spinner"></div>
                  <span>AI düşünüyor...</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Input Area */}
      <div className="assistant-input-area">
        <div className="assistant-input-container">
          {/* File controls area */}
          <div className="assistant-file-controls">
            {/* File add button */}
            <div className="file-selector-container">
              <button
                className="assistant-file-add-button"
                onClick={() => {
                  setShowFileSelector(!showFileSelector);
                  if (!showFileSelector) {
                    setFileSearchQuery('');
                    setSearchResults(searchFiles(''));
                    setSelectedIndex(-1);
                  }
                }}
                title="Dosya ekle"
              >
                <FileAddIcon size={10} />
              </button>

              {/* File selector dropdown */}
              {showFileSelector && (
                <div className="assistant-file-selector">
                  <div className="assistant-file-search">
                    <input
                      type="text"
                      placeholder="Dosya ara..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      onKeyDown={handleFileSearchKeyDown}
                      className="assistant-file-search-input"
                      autoFocus
                    />
                  </div>
                                  <div className="assistant-file-list">
                  {searchResults.map((file, index) => {
                    const isOpen = openFiles.includes(file);
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={index}
                        className={`assistant-file-item ${isOpen ? 'open-file' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (onAddContextFile) {
                            onAddContextFile(file);
                          }
                          setShowFileSelector(false);
                          setFileSearchQuery('');
                          setSelectedIndex(-1);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        {isOpen && <span className="file-status-indicator">●</span>}
                        <span className="assistant-file-name">{file}</span>
                      </button>
                    );
                  })}
                  {searchResults.length === 0 && (
                    <div className="assistant-file-no-results">
                      Dosya bulunamadı
                    </div>
                  )}
                </div>
                </div>
              )}
            </div>

            {/* Context files tags */}
            {contextFiles.map((fileName, index) => (
              <div key={index} className="assistant-context-tag">
                <span className="assistant-context-tag-content">
                  <span className="assistant-context-tag-at">@</span>
                  <span>{fileName}</span>
                  <span 
                    className="assistant-context-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveContextFile) {
                        onRemoveContextFile(fileName);
                      }
                    }}
                  >
                    <RemoveIcon size={12} />
                  </span>
                </span>
              </div>
            ))}

            {/* Active file tag (legacy support) */}
            {activeFileName && !contextFiles.includes(activeFileName) && (
              <div className="assistant-context-tag">
                <span className="assistant-context-tag-content">
                  <span className="assistant-context-tag-at">@</span>
                  <span>{activeFileName}</span>
                  <span 
                    className="assistant-context-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveContext) {
                        onRemoveContext();
                      }
                    }}
                  >
                    <RemoveIcon size={12} />
                  </span>
                </span>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={apiKey ? "mesaj buraya yazılmalı." : "Önce API anahtarınızı ayarlardan girin..."}
            disabled={!apiKey}
            className="assistant-textarea"
          />
          
          {/* Toolbar */}
          <div className="assistant-toolbar">
            <div className="assistant-toolbar-left">
              <Dropdown
                value={chatType}
                options={chatTypes}
                onChange={(value) => setChatType(value)}
                isOpen={showChatTypeDropdown}
                onToggle={() => {
                  setShowChatTypeDropdown(!showChatTypeDropdown);
                  setShowModelDropdown(false);
                }}
                icon="dynamic-agent"
              />
              <Dropdown
                value={selectedModel}
                options={openAIModels}
                onChange={(value) => setSelectedModel(value)}
                isOpen={showModelDropdown}
                onToggle={() => {
                  setShowModelDropdown(!showModelDropdown);
                  setShowChatTypeDropdown(false);
                }}
              />
            </div>
            <div className="assistant-toolbar-right">
        
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim() || !apiKey}
                className="assistant-send-button"
                style={{ borderRadius: '50%' }}
              >
                {isLoading ? (
                  <div className="assistant-send-spinner"></div>
                ) : (
                  <SendIcon size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 