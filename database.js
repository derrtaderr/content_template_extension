class DatabaseFunctions {
    constructor() {
        this.db = firebase.database();
    }

    saveTemplate(userId, templateData) {
        const templateId = Date.now().toString();
        return this.db.ref(`users/${userId}/templates/${templateId}`).set({
            ...templateData,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => templateId);
    }

    getTemplate(userId, templateId) {
        return this.db.ref(`users/${userId}/templates/${templateId}`).once('value')
            .then(snapshot => snapshot.val());
    }

    updateTemplate(userId, templateId, templateData) {
        return this.db.ref(`users/${userId}/templates/${templateId}`).update({
            ...templateData,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    deleteTemplate(userId, templateId) {
        return this.db.ref(`users/${userId}/templates/${templateId}`).remove();
    }

    getAllTemplates(userId) {
        return this.db.ref(`users/${userId}/templates`).once('value')
            .then(snapshot => snapshot.val());
    }
}

// Make DatabaseFunctions available globally in both browser and service worker contexts
(typeof self !== 'undefined' ? self : window).DatabaseFunctions = DatabaseFunctions;