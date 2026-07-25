// Implemented a mock authentication service to simulate user accounts.
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from './firebase';
import type { User } from '../types';

export const register = async (email: string, password: string, alias: string): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: alias });

        const userData: User = { 
            email: firebaseUser.email || email, 
            alias: alias || firebaseUser.displayName || 'Learner' 
        };

        // Initialize Firestore profile
        await setDoc(doc(db, 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: userData.email,
            alias: userData.alias,
            totalQuestions: 0,
            totalCorrect: 0,
            currentStreak: 0,
            categoryStats: {},
            accuracyHistory: [],
            lastUpdated: serverTimestamp()
        });

        return userData;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const login = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        return { 
            email: firebaseUser.email || email, 
            alias: firebaseUser.displayName || 'Learner' 
        };
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const logout = async (): Promise<void> => {
    await signOut(auth);
};

export const signInWithGoogle = async (): Promise<User> => {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider);
        const firebaseUser = userCredential.user;
        
        const userData: User = { 
            email: firebaseUser.email || '', 
            alias: firebaseUser.displayName || 'Learner' 
        };

        // Check if profile exists, if not create it
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: userData.email,
                alias: userData.alias,
                totalQuestions: 0,
                totalCorrect: 0,
                currentStreak: 0,
                categoryStats: {},
                accuracyHistory: [],
                lastUpdated: serverTimestamp()
            });
        }

        return userData;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const listenToAuthChanges = (callback: (user: any) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    return {
        email: firebaseUser.email || '',
        alias: firebaseUser.displayName || 'Learner'
    };
};
