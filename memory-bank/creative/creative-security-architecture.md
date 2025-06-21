# 🎨🎨🎨 CREATIVE PHASE: SECURITY ARCHITECTURE 🎨🎨🎨

## Component Description
**Security System** - API key management, data protection, ve secure communication için comprehensive security architecture. Kullanıcı credential'larını güvenli şekilde saklayıp, LLM provider'larla secure iletişim kurmalı.

## Requirements & Constraints

### Security Requirements
- **API Key Protection**: Secure storage ve transmission
- **Data Privacy**: Vault content protection
- **Secure Communication**: HTTPS/TLS for API calls
- **Access Control**: User consent for data sharing
- **Audit Trail**: Security events logging
- **Error Security**: No sensitive data in error messages

### Technical Constraints
- **Obsidian Plugin API**: Storage limitations
- **Browser Environment**: No file system access
- **Cross-Platform**: Windows, macOS, Linux compatibility
- **No External Libraries**: Minimal dependencies
- **Local Storage**: No external credential services

### Compliance Requirements
- **GDPR**: User data protection
- **User Consent**: Explicit permissions
- **Data Minimization**: Only necessary data processing
- **Transparency**: Clear data usage policies

## Options Analysis

### Option 1: Plain Text Storage (Insecure)
```typescript
class PlainTextStorage {
  async saveApiKey(key: string): Promise<void> {
    const settings = await this.plugin.loadData();
    settings.apiKey = key;
    await this.plugin.saveData(settings);
  }
  
  async getApiKey(): Promise<string> {
    const settings = await this.plugin.loadData();
    return settings.apiKey || '';
  }
}
```

**Pros:**
- ✅ Simple implementation
- ✅ No encryption overhead
- ✅ Easy debugging
- ✅ Fast access

**Cons:**
- ❌ **MAJOR SECURITY RISK**: API keys stored in plain text
- ❌ Vulnerable to file system access
- ❌ No protection against malware
- ❌ Violates security best practices
- ❌ Compliance issues

**Complexity**: Very Low
**Implementation Time**: 30 minutes
**Security Rating**: ⚠️ UNACCEPTABLE

### Option 2: Base64 Encoding (Obfuscation Only)
```typescript
class Base64Storage {
  async saveApiKey(key: string): Promise<void> {
    const encoded = Buffer.from(key).toString('base64');
    const settings = await this.plugin.loadData();
    settings.apiKey = encoded;
    await this.plugin.saveData(settings);
  }
  
  async getApiKey(): Promise<string> {
    const settings = await this.plugin.loadData();
    if (!settings.apiKey) return '';
    
    try {
      return Buffer.from(settings.apiKey, 'base64').toString();
    } catch {
      return '';
    }
  }
}
```

**Pros:**
- ✅ Slightly better than plain text
- ✅ Simple implementation
- ✅ Hides obvious API key format

**Cons:**
- ❌ **NOT REAL ENCRYPTION**: Easily reversible
- ❌ Still vulnerable to malware
- ❌ False sense of security
- ❌ Professional tools can decode instantly

**Complexity**: Low
**Implementation Time**: 1 hour
**Security Rating**: ⚠️ INSUFFICIENT

### Option 3: Browser-based Encryption with WebCrypto ⭐ **SELECTED**
```typescript
class WebCryptoStorage {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  async saveApiKey(key: string, userPassword?: string): Promise<void> {
    try {
      const encryptionKey = await this.deriveKey(userPassword);
      const encrypted = await this.encrypt(key, encryptionKey);
      
      const settings = await this.plugin.loadData();
      settings.encryptedApiKey = encrypted;
      await this.plugin.saveData(settings);
    } catch (error) {
      throw new SecurityError('Failed to save API key securely');
    }
  }
  
  async getApiKey(userPassword?: string): Promise<string> {
    try {
      const settings = await this.plugin.loadData();
      if (!settings.encryptedApiKey) return '';
      
      const encryptionKey = await this.deriveKey(userPassword);
      return await this.decrypt(settings.encryptedApiKey, encryptionKey);
    } catch (error) {
      throw new SecurityError('Failed to decrypt API key');
    }
  }
  
  private async deriveKey(password?: string): Promise<CryptoKey> {
    const basePassword = password || this.getDeviceFingerprint();
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(basePassword);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive encryption key using PBKDF2
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.getSalt(),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  private async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      dataBuffer
    );
    
    return {
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      timestamp: Date.now()
    };
  }
  
  private async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const dataArray = new Uint8Array(encryptedData.data);
    const ivArray = new Uint8Array(encryptedData.iv);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: ivArray
      },
      key,
      dataArray
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
  
  private getDeviceFingerprint(): string {
    // Create a device-specific identifier
    const navigator = window.navigator;
    const screen = window.screen;
    
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ];
    
    return btoa(components.join('|'));
  }
  
  private getSalt(): Uint8Array {
    // Use a consistent but app-specific salt
    const saltString = 'ObsidianLLMPlugin2024';
    return new TextEncoder().encode(saltString);
  }
}

interface EncryptedData {
  data: number[];
  iv: number[];
  timestamp: number;
}
```

**Pros:**
- ✅ Real encryption using Web Crypto API
- ✅ Industry-standard AES-GCM encryption
- ✅ Device-specific key derivation
- ✅ No external dependencies
- ✅ PBKDF2 for key strengthening
- ✅ Secure random IV generation

**Cons:**
- ❌ More complex implementation
- ❌ Potential browser compatibility issues
- ❌ Key derived from device fingerprint (not perfect)
- ❌ No master password option initially

**Complexity**: Medium
**Implementation Time**: 2-3 days
**Security Rating**: ✅ GOOD

### Option 4: Operating System Keychain Integration
```typescript
class KeychainStorage {
  async saveApiKey(key: string): Promise<void> {
    if (process.platform === 'darwin') {
      await this.macOSKeychain.setPassword('md-assistant', 'openai-key', key);
    } else if (process.platform === 'win32') {
      await this.windowsCredentialManager.setCredential('md-assistant-openai', key);
    } else {
      await this.linuxSecretService.setSecret('md-assistant', 'openai-key', key);
    }
  }
  
  async getApiKey(): Promise<string> {
    if (process.platform === 'darwin') {
      return await this.macOSKeychain.getPassword('md-assistant', 'openai-key');
    } else if (process.platform === 'win32') {
      return await this.windowsCredentialManager.getCredential('md-assistant-openai');
    } else {
      return await this.linuxSecretService.getSecret('md-assistant', 'openai-key');
    }
  }
}
```

**Pros:**
- ✅ OS-level security
- ✅ Hardware-backed encryption (where available)
- ✅ Integration with system password managers
- ✅ Highest security level

**Cons:**
- ❌ **NOT AVAILABLE IN OBSIDIAN**: Requires Node.js access
- ❌ Platform-specific implementations
- ❌ Complex error handling
- ❌ External library dependencies
- ❌ Plugin environment limitations

**Complexity**: Very High
**Implementation Time**: 5-7 days
**Security Rating**: ✅ EXCELLENT (but not feasible)

## Recommended Approach: Option 3 - Browser-based Encryption with WebCrypto

### Justification
**WebCrypto-based encryption** en uygun seçim çünkü:

1. **Real Security**: Industry-standard AES-GCM encryption
2. **Browser Compatibility**: Native Web Crypto API support
3. **No Dependencies**: Built into modern browsers
4. **Practical Implementation**: Achievable within Obsidian constraints
5. **Compliance Ready**: GDPR-compatible approach
6. **Performance**: Hardware-accelerated crypto operations

## Implementation Guidelines

### Core Security Architecture
```typescript
interface SecurityService {
  saveApiKey(key: string, password?: string): Promise<void>;
  getApiKey(password?: string): Promise<string>;
  validateApiKey(key: string): boolean;
  clearApiKey(): Promise<void>;
  isKeyStored(): Promise<boolean>;
}

interface SecurityConfig {
  encryptionAlgorithm: 'AES-GCM';
  keyLength: 256;
  pbkdf2Iterations: 100000;
  saltString: string;
}

class SecurityError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SecurityError';
  }
}
```

### Data Transmission Security
```typescript
class SecureAPIClient {
  async makeSecureRequest(
    url: string, 
    apiKey: string, 
    payload: any
  ): Promise<Response> {
    // Validate URL is HTTPS
    if (!url.startsWith('https://')) {
      throw new SecurityError('Only HTTPS connections allowed');
    }
    
    // Sanitize API key
    if (!this.validateApiKey(apiKey)) {
      throw new SecurityError('Invalid API key format');
    }
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ObsidianLLMPlugin/1.0'
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(this.sanitizePayload(payload))
      });
      
      if (!response.ok) {
        await this.handleAPIError(response);
      }
      
      return response;
    } catch (error) {
      // Never log API keys or sensitive data
      this.logSecurityEvent('API_REQUEST_FAILED', {
        url: this.sanitizeURL(url),
        status: error.status,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  private sanitizePayload(payload: any): any {
    // Remove or redact sensitive information
    const sanitized = { ...payload };
    
    // Remove potential PII from content
    if (sanitized.messages) {
      sanitized.messages = sanitized.messages.map(msg => ({
        ...msg,
        content: this.redactSensitiveInfo(msg.content)
      }));
    }
    
    return sanitized;
  }
  
  private validateApiKey(key: string): boolean {
    // OpenAI API key format validation
    const openAIPattern = /^sk-[A-Za-z0-9]{48}$/;
    return openAIPattern.test(key);
  }
}
```

### User Consent Management
```typescript
class ConsentManager {
  async requestDataSharingConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new ConsentModal(this.app);
      modal.setContent({
        title: 'Data Sharing Consent',
        message: `
          To provide AI assistance, this plugin will:
          
          • Send your selected file content to OpenAI servers
          • Include your chat messages in API requests
          • Store your API key locally with encryption
          
          Your data will:
          ✅ Be sent over secure HTTPS connections
          ✅ Be used only for generating responses
          ✅ Not be stored on OpenAI servers (per their policy)
          
          Do you consent to this data sharing?
        `,
        confirmText: 'I Consent',
        cancelText: 'Cancel'
      });
      
      modal.onConfirm = () => {
        this.saveConsentRecord('data_sharing', true);
        resolve(true);
      };
      
      modal.onCancel = () => {
        resolve(false);
      };
      
      modal.open();
    });
  }
  
  async hasValidConsent(type: string): Promise<boolean> {
    const consent = await this.getConsentRecord(type);
    return consent && consent.granted && !this.isConsentExpired(consent);
  }
  
  private async saveConsentRecord(type: string, granted: boolean): Promise<void> {
    const settings = await this.plugin.loadData();
    if (!settings.consents) settings.consents = {};
    
    settings.consents[type] = {
      granted,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    await this.plugin.saveData(settings);
  }
}
```

### Security Audit Trail
```typescript
class SecurityAuditor {
  async logSecurityEvent(event: string, details: any): Promise<void> {
    const auditEntry = {
      event,
      timestamp: Date.now(),
      details: this.sanitizeAuditDetails(details),
      sessionId: this.getSessionId()
    };
    
    // Store in memory-only log (not persisted)
    this.securityLog.push(auditEntry);
    
    // Keep only last 100 entries
    if (this.securityLog.length > 100) {
      this.securityLog.shift();
    }
  }
  
  getSecuritySummary(): SecuritySummary {
    return {
      totalEvents: this.securityLog.length,
      recentEvents: this.securityLog.slice(-10),
      criticalEvents: this.securityLog.filter(e => e.event.includes('ERROR')),
      lastAPICall: this.getLastAPICallTime(),
      encryptionStatus: this.getEncryptionStatus()
    };
  }
  
  private sanitizeAuditDetails(details: any): any {
    // Remove sensitive information from audit logs
    const sanitized = { ...details };
    
    // Remove API keys, passwords, etc.
    delete sanitized.apiKey;
    delete sanitized.password;
    delete sanitized.token;
    
    // Truncate long content
    if (sanitized.content && sanitized.content.length > 100) {
      sanitized.content = sanitized.content.substring(0, 100) + '...';
    }
    
    return sanitized;
  }
}
```

### Secure Error Handling
```typescript
class SecureErrorHandler {
  handleError(error: Error, context: string): void {
    // Create safe error message for user
    const userMessage = this.createSafeErrorMessage(error);
    
    // Log detailed error internally (without sensitive data)
    this.logError(error, context);
    
    // Show user-friendly message
    new Notice(userMessage, 5000);
  }
  
  private createSafeErrorMessage(error: Error): string {
    if (error instanceof SecurityError) {
      return 'Security error occurred. Please check your settings.';
    }
    
    if (error.message.includes('API key')) {
      return 'Authentication failed. Please verify your API key.';
    }
    
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    
    return 'An error occurred. Please try again.';
  }
  
  private logError(error: Error, context: string): void {
    // Log error without exposing sensitive information
    console.error('Plugin Error:', {
      context,
      errorType: error.constructor.name,
      message: this.sanitizeErrorMessage(error.message),
      timestamp: Date.now()
    });
  }
  
  private sanitizeErrorMessage(message: string): string {
    // Remove potential API keys from error messages
    return message.replace(/sk-[A-Za-z0-9]{48}/g, 'sk-***REDACTED***');
  }
}
```

## Verification Checkpoint
✅ **Security Requirements Met:**
- API key encryption with AES-GCM
- Secure HTTPS communication
- User consent management
- Audit trail for security events
- Safe error handling without data leakage
- GDPR compliance considerations

✅ **Technical Feasibility:** High - uses Web Crypto API
✅ **Compliance:** Good - supports data protection regulations
✅ **Performance:** Excellent - hardware-accelerated encryption

# 🎨🎨🎨 EXITING CREATIVE PHASE: SECURITY ARCHITECTURE 🎨🎨🎨 