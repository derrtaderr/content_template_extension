// firebaseConfig.js
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
firebase.initializeApp(firebaseConfig);
  
  // Get a reference to the database service
  const db = firebase.database();