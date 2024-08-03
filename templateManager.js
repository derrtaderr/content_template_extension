class TemplateManager {
    constructor() {
      this.templates = [];
    }
  
    async saveTemplate(template) {
      this.templates.push(template);
      await this.syncToStorage();
    }
  
    async loadTemplates() {
      const data = await chrome.storage.sync.get('templates');
      this.templates = data.templates || [];
      return this.templates;
    }
  
    async syncToStorage() {
      await chrome.storage.sync.set({templates: this.templates});
    }
  
    searchTemplates(query) {
      return this.templates.filter(template => 
        template.content.toLowerCase().includes(query.toLowerCase()) ||
        template.framework.toLowerCase().includes(query.toLowerCase())
      );
    }
  }
  
  export const templateManager = new TemplateManager();