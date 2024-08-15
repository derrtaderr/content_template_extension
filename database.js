// database.js

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBzrEDWx9qiiLsDQ_tQjjj2JjI-4ZfQmcY",
  authDomain: "templatiz-bdccd.firebaseapp.com",
  projectId: "templatiz-bdccd",
  storageBucket: "templatiz-bdccd.appspot.com",
  messagingSenderId: "580096691721",
  appId: "1:580096691721:web:5b7d94f531e6ef785fb2d8",
  // Remove measurementId as it's not needed for the database
  databaseURL: "https://templatiz-bdccd-default-rtdb.firebaseio.com/" // Add this line
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// CRUD operations go here
export async function saveTemplate(userId, templateData) {
  const templateId = Date.now().toString();
  await set(ref(db, `users/${userId}/templates/${templateId}`), {
    ...templateData,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return templateId;
}

export async function getTemplate(userId, templateId) {
  const snapshot = await get(ref(db, `users/${userId}/templates/${templateId}`));
  return snapshot.val();
}

export async function updateTemplate(userId, templateId, templateData) {
  await update(ref(db, `users/${userId}/templates/${templateId}`), {
    ...templateData,
    updatedAt: Date.now()
  });
}

export async function deleteTemplate(userId, templateId) {
  await remove(ref(db, `users/${userId}/templates/${templateId}`));
}

export async function getAllTemplates(userId) {
  const snapshot = await get(ref(db, `users/${userId}/templates`));
  return snapshot.val();
}