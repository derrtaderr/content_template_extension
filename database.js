// database.js

// Use a self-executing function to create a closure and avoid global variable conflicts
(function() {
    // Check if db has already been defined
    if (typeof self.db === 'undefined') {
        // Use the global firebase object to get the database
        self.db = firebase.database();
    }

    function saveTemplate(userId, templateData) {
        const templateId = Date.now().toString();
        return self.db.ref(`users/${userId}/templates/${templateId}`).set({
            ...templateData,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => templateId);
    }

    function getTemplate(userId, templateId) {
        return self.db.ref(`users/${userId}/templates/${templateId}`).once('value')
            .then(snapshot => snapshot.val());
    }

    function updateTemplate(userId, templateId, templateData) {
        return self.db.ref(`users/${userId}/templates/${templateId}`).update({
            ...templateData,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    function deleteTemplate(userId, templateId) {
        return self.db.ref(`users/${userId}/templates/${templateId}`).remove();
    }

    function getAllTemplates(userId) {
        return self.db.ref(`users/${userId}/templates`).once('value')
            .then(snapshot => snapshot.val());
    }

    // Make these functions available globally in the service worker context
    self.dbFunctions = {
        saveTemplate,
        getTemplate,
        updateTemplate,
        deleteTemplate,
        getAllTemplates
    };
})();