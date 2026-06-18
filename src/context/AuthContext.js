'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  doc,
  getDoc,
  setDoc
} from '../lib/firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOutUser: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          // User is authenticated, let's fetch their Firestore profile
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              displayName: userData.name || authUser.displayName,
              role: userData.role || 'student',
              ...userData
            });
          } else {
            // Profile document doesn't exist (e.g., account created manually in Firebase Console).
            // Let's self-heal and create the profile document automatically.
            const nameFallback = authUser.displayName || authUser.email.split('@')[0] || 'Student';
            const userData = {
              uid: authUser.uid,
              name: nameFallback,
              email: authUser.email.toLowerCase(),
              role: 'student',
              createdAt: new Date().toISOString()
            };
            
            await setDoc(userDocRef, userData);

            setUser({
              uid: authUser.uid,
              email: authUser.email,
              displayName: nameFallback,
              role: 'student',
              ...userData
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error syncing auth state with firestore:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, name, samithi, district) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Store name in uppercase for certificates
      const upperName = name.toUpperCase();
      const upperSamithi = samithi.toUpperCase();
      const upperDistrict = district.toUpperCase();

      // Update Auth Profile Display Name
      await updateProfile(newUser, { displayName: upperName });

      // Save Student Profile to Firestore 'users' collection
      const userDocRef = doc(db, 'users', newUser.uid);
      const userData = {
        uid: newUser.uid,
        name: upperName,
        samithi: upperSamithi,
        district: upperDistrict,
        email: email.toLowerCase(),
        role: 'student',
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, userData);

      setUser({
        uid: newUser.uid,
        email: newUser.email,
        displayName: upperName,
        role: 'student',
        ...userData
      });

      return newUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
