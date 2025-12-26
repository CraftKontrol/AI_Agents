// Quick test script to open the API injection test page
// Run this in the DevTools console of the main CKDesktop window

console.log('Opening API injection test page...');

// Use the electronAPI to trigger opening the test page as if it were an app
const testUrl = 'file://' + __dirname + '/test-api-injection.html';

// If electronAPI is available, use it
if (typeof window.electronAPI !== 'undefined') {
    console.log('Using electronAPI...');
    // You'll need to manually add this app to test
    // or use the tray menu
} else {
    console.log('ElectronAPI not available - are you in the main window?');
    console.log('To test manually:');
    console.log('1. Add API keys in Settings');
    console.log('2. Open any app (e.g., Memory, Search)');
    console.log('3. In that app\'s DevTools console, run:');
    console.log('   console.log(window.CKDesktop)');
    console.log('   console.log(window.CKDesktop.apiKeys)');
}

console.log('\nAlternatively, open the test file directly:');
console.log('file:///' + window.location.pathname.replace('renderer/index.html', 'test-api-injection.html'));
