// Firebase Configuration Check
// Run this in browser console to test Firebase connection

import { db, auth, storage } from './src/lib/firebase';

// Test Firebase connection
window.testFirebase = async function() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    // Test Auth
    console.log('✅ Auth initialized:', auth.app.name);
    
    // Test Firestore
    console.log('✅ Firestore initialized:', db.app.name);
    
    // Test Storage
    console.log('✅ Storage initialized:', storage.app.name);
    
    // Test Storage bucket access
    const testRef = storage.ref('test-connection');
    console.log('✅ Storage reference created:', testRef.fullPath);
    
    console.log('🎉 All Firebase services are properly initialized!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Test data saving
window.testDataSave = async function() {
  try {
    const testData = {
      title: 'Test Connection',
      description: 'Testing Firebase data saving',
      timestamp: new Date(),
      test: true
    };
    
    const docRef = await db.collection('test').add(testData);
    console.log('✅ Data saved successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Data saving failed:', error);
    return null;
  }
};

console.log('Firebase test functions loaded. Run testFirebase() or testDataSave() in console.');
