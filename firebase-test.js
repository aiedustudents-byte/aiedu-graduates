// Firebase Connection Test
// This file can be used to test Firebase connectivity

import { db, auth, storage } from './src/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore connection
    const testCollection = collection(db, 'test');
    const testDoc = await addDoc(testCollection, {
      message: 'Firebase connection test',
      timestamp: new Date()
    });
    console.log('✅ Firestore connection successful:', testDoc.id);
    
    // Test Auth connection
    console.log('✅ Auth connection successful:', auth.app.name);
    
    // Test Storage connection
    console.log('✅ Storage connection successful:', storage.app.name);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

// Test data saving
export async function testDataSaving() {
  try {
    const testData = {
      title: 'Test Post',
      description: 'This is a test post to verify Firebase data saving',
      createdAt: new Date(),
      test: true
    };
    
    const docRef = await addDoc(collection(db, 'artPosts'), testData);
    console.log('✅ Data saving successful:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Data saving failed:', error);
    return null;
  }
}
