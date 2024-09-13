class Auth {
  constructor() {
    this.auth = firebase.auth();
    this.db = firebase.database();
    this.setupAuthStateListener();
  }

  setupAuthStateListener() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.onSignIn(user);
      } else {
        this.onSignOut();
      }
    });
  }

  async signUp(email, password) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      await this.sendEmailVerification();
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }

  async signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await this.auth.signInWithPopup(provider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  async sendEmailVerification() {
    const user = this.auth.currentUser;
    if (user) {
      try {
        await user.sendEmailVerification();
      } catch (error) {
        console.error("Error sending email verification:", error);
        throw error;
      }
    }
  }

  async resetPassword(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  async getUserRole() {
    const user = this.auth.currentUser;
    if (user) {
      try {
        const snapshot = await this.db.ref(`users/${user.uid}/role`).once('value');
        return snapshot.val() || 'free';
      } catch (error) {
        console.error("Error getting user role:", error);
        return 'free';
      }
    }
    return null;
  }

  async refreshToken() {
    const user = this.auth.currentUser;
    if (user) {
      try {
        await user.getIdToken(true);
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
      }
    }
  }

  onSignIn(user) {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('userProfile').style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;
    // Show main app content
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('authView').style.display = 'none';
  }

  onSignOut() {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('userProfile').style.display = 'none';
    document.getElementById('userEmail').textContent = '';
    // Hide main app content
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('authView').style.display = 'block';
  }
}

const authInstance = new Auth();
window.authInstance = authInstance; // Make it globally available