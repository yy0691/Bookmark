/**
 * Settings Panel Module - Modular settings management system
 */

export class SettingsPanel {
  constructor() {
    this.isOpen = false;
    this.settings = {
      theme: 'light',
      accentColor: 'blue',
      recentCount: 20,
      autoRefresh: true,
      showFavicons: true,
      groupByDomain: false,
      defaultView: 'grid',
      backgroundStyle: 'solid',
      blurIntensity: 12,
      opacityLevel: 0.9,
      enableAnimations: true,
      compactMode: false
    };
    this.callbacks = new Map();
    this.init();
  }

  init() {
    this.loadSettings();
    this.createSettingsModal();
    this.bindEvents();
  }

  // Load settings from storage
  loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('newtabSettings', (result) => {
        if (result.newtabSettings) {
          this.settings = { ...this.settings, ...result.newtabSettings };
          this.applySettings();
        }
      });
    }
  }

  // Save settings to storage
  saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ newtabSettings: this.settings });
    }
    this.applySettings();
    this.notifyCallbacks('settingsChanged', this.settings);
  }

  // Create the settings modal HTML
  createSettingsModal() {
    const modalHTML = `
      <div id="settings-modal" class="modal-overlay hidden">
        <div class="modal-content settings-modal">
          <div class="modal-header">
            <h2 class="modal-title">Settings</h2>
            <button class="close-btn" id="close-settings">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="settings-content">
              ${this.generateSettingsHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('settings-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize icons for the new modal
    this.initModalIcons();
  }

  // Generate organized settings HTML
  generateSettingsHTML() {
    return `
      <!-- Appearance Settings -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="palette"></i>
          Appearance
        </h3>
        
        <div class="settings-group">
          <label class="settings-label">Theme</label>
          <p class="settings-description">Choose your preferred color scheme</p>
          <div class="theme-selector">
            <button class="theme-option ${this.settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
              <i data-lucide="moon"></i>
              <span>Dark</span>
            </button>
            <button class="theme-option ${this.settings.theme === 'light' ? 'active' : ''}" data-theme="light">
              <i data-lucide="sun"></i>
              <span>Light</span>
            </button>
            <button class="theme-option ${this.settings.theme === 'auto' ? 'active' : ''}" data-theme="auto">
              <i data-lucide="monitor"></i>
              <span>Auto</span>
            </button>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Accent Color</label>
          <p class="settings-description">Choose your preferred accent color</p>
          <div class="accent-colors">
            ${this.generateAccentColors()}
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Background Style</label>
          <p class="settings-description">Customize the background appearance</p>
          <div class="background-selector">
            <div class="background-option ${this.settings.backgroundStyle === 'gradient' ? 'active' : ''}" 
                 data-bg="gradient" title="Gradient"></div>
            <div class="background-option ${this.settings.backgroundStyle === 'solid' ? 'active' : ''}" 
                 data-bg="solid" title="Solid Color"></div>
            <div class="background-option ${this.settings.backgroundStyle === 'pattern' ? 'active' : ''}" 
                 data-bg="pattern" title="Pattern"></div>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Glass Effect Intensity</label>
          <p class="settings-description">Adjust blur intensity: <span id="blur-value">${this.settings.blurIntensity}px</span></p>
          <div class="slider-container">
            <input type="range" class="slider" id="blur-intensity" 
                   min="0" max="40" value="${this.settings.blurIntensity}">
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Glass Opacity</label>
          <p class="settings-description">Adjust transparency: <span id="opacity-value">${Math.round(this.settings.opacityLevel * 100)}%</span></p>
          <div class="slider-container">
            <input type="range" class="slider" id="opacity-level" 
                   min="0.3" max="1" step="0.1" value="${this.settings.opacityLevel}">
          </div>
        </div>
      </div>

      <!-- Behavior Settings -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="settings"></i>
          Behavior
        </h3>
        
        <div class="settings-group">
          <div class="settings-toggle">
            <div>
              <label class="settings-label">Enable Animations</label>
              <p class="settings-description">Show smooth transitions and effects</p>
            </div>
            <div class="toggle-switch ${this.settings.enableAnimations ? 'active' : ''}" id="enable-animations"></div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-toggle">
            <div>
              <label class="settings-label">Compact Mode</label>
              <p class="settings-description">Reduce spacing for more content</p>
            </div>
            <div class="toggle-switch ${this.settings.compactMode ? 'active' : ''}" id="compact-mode"></div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-toggle">
            <div>
              <label class="settings-label">Auto Refresh</label>
              <p class="settings-description">Automatically update bookmark data</p>
            </div>
            <div class="toggle-switch ${this.settings.autoRefresh ? 'active' : ''}" id="auto-refresh"></div>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Default View</label>
          <p class="settings-description">Choose how bookmarks are displayed by default</p>
          <select class="setting-select" id="default-view">
            <option value="grid" ${this.settings.defaultView === 'grid' ? 'selected' : ''}>Grid View</option>
            <option value="list" ${this.settings.defaultView === 'list' ? 'selected' : ''}>List View</option>
          </select>
        </div>
      </div>

      <!-- Bookmark Settings -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="bookmark"></i>
          Bookmarks
        </h3>
        
        <div class="settings-group">
          <div class="settings-toggle">
            <div>
              <label class="settings-label">Show Favicons</label>
              <p class="settings-description">Display website icons for bookmarks</p>
            </div>
            <div class="toggle-switch ${this.settings.showFavicons ? 'active' : ''}" id="show-favicons"></div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-toggle">
            <div>
              <label class="settings-label">Group by Domain</label>
              <p class="settings-description">Organize bookmarks by website domain</p>
            </div>
            <div class="toggle-switch ${this.settings.groupByDomain ? 'active' : ''}" id="group-by-domain"></div>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">Recent Bookmarks Count</label>
          <p class="settings-description">Number of recent bookmarks to display</p>
          <input type="number" class="setting-input" id="recent-count" 
                 min="5" max="100" value="${this.settings.recentCount}">
        </div>

        <div class="settings-group">
          <label class="settings-label">Quick Actions</label>
          <p class="settings-description">Manage your bookmarks</p>
          <div class="bookmark-actions">
            <button class="bookmark-action-btn" id="open-manager-btn">
              <i data-lucide="folder-open"></i>
              <span>Open Manager</span>
            </button>
            <button class="bookmark-action-btn" id="export-bookmarks-btn">
              <i data-lucide="download"></i>
              <span>Export</span>
            </button>
            <button class="bookmark-action-btn" id="import-bookmarks-btn">
              <i data-lucide="upload"></i>
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Reset Settings -->
      <div class="settings-section">
        <h3 class="settings-section-title">
          <i data-lucide="rotate-ccw"></i>
          Reset
        </h3>
        
        <div class="settings-group">
          <button class="settings-reset-btn" id="reset-settings">
            <i data-lucide="rotate-ccw"></i>
            Reset to Defaults
          </button>
        </div>
      </div>
    `;
  }

  // Generate accent color options
  generateAccentColors() {
    const colors = [
      { name: 'blue', value: '#3b82f6' },
      { name: 'purple', value: '#8b5cf6' },
      { name: 'green', value: '#10b981' },
      { name: 'orange', value: '#f59e0b' },
      { name: 'red', value: '#ef4444' },
      { name: 'pink', value: '#ec4899' }
    ];

    return colors.map(color => 
      `<div class="accent-color ${this.settings.accentColor === color.name ? 'active' : ''}" 
            data-color="${color.name}" 
            style="background-color: ${color.value}" 
            title="${color.name}"></div>`
    ).join('');
  }

  // Initialize icons in modal
  initModalIcons() {
    const icons = {
      'x': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      'palette': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>',
      'moon': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
      'sun': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
      'monitor': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
      'settings': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
      'bookmark': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>',
      'folder-open': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><path d="M2 7h20"></path></svg>',
      'download': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      'upload': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17,8 12,3 7,8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
      'rotate-ccw': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1,4 1,10 7,10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>'
    };

    document.querySelectorAll('#settings-modal [data-lucide]').forEach(element => {
      const iconName = element.getAttribute('data-lucide');
      if (icons[iconName]) {
        element.innerHTML = icons[iconName];
        element.removeAttribute('data-lucide');
      }
    });
  }

  // Bind all event listeners
  bindEvents() {
    document.addEventListener('click', (e) => {
      // Settings button
      if (e.target.closest('#settings-btn')) {
        this.open();
      }
      
      // Close button
      if (e.target.closest('#close-settings')) {
        this.close();
      }
      
      // Theme selection
      const themeOption = e.target.closest('.theme-option');
      if (themeOption) {
        this.setTheme(themeOption.dataset.theme);
      }
      
      // Accent color selection
      const accentColor = e.target.closest('.accent-color');
      if (accentColor) {
        this.setAccentColor(accentColor.dataset.color);
      }
      
      // Background style selection
      const backgroundOption = e.target.closest('.background-option');
      if (backgroundOption) {
        this.setBackgroundStyle(backgroundOption.dataset.bg);
      }
      
      // Toggle switches
      const toggleSwitch = e.target.closest('.toggle-switch');
      if (toggleSwitch) {
        this.handleToggle(toggleSwitch);
      }
      
      // Reset button
      if (e.target.closest('#reset-settings')) {
        this.resetSettings();
      }
    });

    // Slider events
    document.addEventListener('input', (e) => {
      if (e.target.id === 'blur-intensity') {
        this.setBlurIntensity(parseInt(e.target.value));
      }
      if (e.target.id === 'opacity-level') {
        this.setOpacityLevel(parseFloat(e.target.value));
      }
      if (e.target.id === 'recent-count') {
        this.setRecentCount(parseInt(e.target.value));
      }
    });

    // Select events
    document.addEventListener('change', (e) => {
      if (e.target.id === 'default-view') {
        this.setDefaultView(e.target.value);
      }
    });

    // Close modal on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') {
        this.close();
      }
    });
  }

  // Public methods
  open() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('hidden');
      this.isOpen = false;
      document.body.style.overflow = '';
    }
  }

  // Setting methods
  setTheme(theme) {
    this.settings.theme = theme;
    this.saveSettings();
    this.updateThemeUI();
  }

  setAccentColor(color) {
    this.settings.accentColor = color;
    this.saveSettings();
    this.updateAccentColorUI();
  }

  setBackgroundStyle(style) {
    this.settings.backgroundStyle = style;
    this.saveSettings();
    this.updateBackgroundUI();
  }

  setBlurIntensity(value) {
    this.settings.blurIntensity = value;
    document.getElementById('blur-value').textContent = `${value}px`;
    this.saveSettings();
  }

  setOpacityLevel(value) {
    this.settings.opacityLevel = value;
    document.getElementById('opacity-value').textContent = `${Math.round(value * 100)}%`;
    this.saveSettings();
  }

  setRecentCount(count) {
    this.settings.recentCount = count;
    this.saveSettings();
  }

  setDefaultView(view) {
    this.settings.defaultView = view;
    this.saveSettings();
  }

  handleToggle(toggleElement) {
    const isActive = toggleElement.classList.contains('active');
    toggleElement.classList.toggle('active');
    
    const settingKey = toggleElement.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    this.settings[settingKey] = !isActive;
    this.saveSettings();
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = {
        theme: 'light',
        accentColor: 'blue',
        recentCount: 20,
        autoRefresh: true,
        showFavicons: true,
        groupByDomain: false,
        defaultView: 'grid',
        backgroundStyle: 'solid',
        blurIntensity: 12,
        opacityLevel: 0.9,
        enableAnimations: true,
        compactMode: false
      };
      this.saveSettings();
      this.close();
      setTimeout(() => this.open(), 100); // Reopen to show updated UI
    }
  }

  // UI update methods
  updateThemeUI() {
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.dataset.theme === this.settings.theme);
    });
  }

  updateAccentColorUI() {
    document.querySelectorAll('.accent-color').forEach(color => {
      color.classList.toggle('active', color.dataset.color === this.settings.accentColor);
    });
  }

  updateBackgroundUI() {
    document.querySelectorAll('.background-option').forEach(option => {
      option.classList.toggle('active', option.dataset.bg === this.settings.backgroundStyle);
    });
  }

  // Apply settings to the page
  applySettings() {
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    document.documentElement.setAttribute('data-accent', this.settings.accentColor);
    
    // Apply other settings as needed
    if (this.settings.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
    
    if (!this.settings.enableAnimations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }

  // Callback system
  onSettingsChange(callback) {
    this.callbacks.set('settingsChanged', callback);
  }

  notifyCallbacks(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event)(data);
    }
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }
}
