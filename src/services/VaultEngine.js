class VaultEngine {
  constructor() {
    if (typeof window !== 'undefined' && window.__nexaVault) {
      return window.__nexaVault;
    }
    this.isInitialized = false;
    this.status = "IDLE";
    this.registry = new Map();
    this.lastAccess = Date.now();
    
    if (typeof window !== 'undefined') {
      window.__nexaVault = this;
    }
  }

  initialize() {
    if (this.isInitialized) return;
    this.status = "ACTIVE";
    this.isInitialized = true;
  }

  getStatus() {
    return this.status;
  }

  ping() {
    this.lastAccess = Date.now();
    return true;
  }

  syncState(key, data) {
    this.registry.set(key, {
      data,
      timestamp: Date.now()
    });
    try {
      localStorage.setItem(`nexa_vault_sync_${key}`, JSON.stringify(data));
    } catch (e) {
      // Fallback to memory only if quota exceeded
    }
  }

  getCachedState(key) {
    if (this.registry.has(key)) return this.registry.get(key).data;
    try {
      const raw = localStorage.getItem(`nexa_vault_sync_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
}

const vaultInstance = new VaultEngine();
vaultInstance.initialize();

export default vaultInstance;
