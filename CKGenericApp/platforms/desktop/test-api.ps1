# Test API Injection Script
# Runs the Electron app and provides testing instructions

Write-Host "=== CKDesktop API Injection Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Not in the correct directory!" -ForegroundColor Red
    Write-Host "Please run this script from: platforms/desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Starting CKDesktop in development mode..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Testing Instructions:" -ForegroundColor Yellow
Write-Host "  1. Wait for the app window to open" -ForegroundColor White
Write-Host "  2. Click Settings (⚙️) and add test API keys:" -ForegroundColor White
Write-Host "     - Mistral: 'test_mistral_key_123'" -ForegroundColor White
Write-Host "     - Deepgram: 'test_deepgram_key_456'" -ForegroundColor White
Write-Host "  3. Save and close Settings" -ForegroundColor White
Write-Host "  4. Open any app (e.g., Memory or Search)" -ForegroundColor White
Write-Host "  5. Press F12 to open DevTools in the app window" -ForegroundColor White
Write-Host "  6. In the Console tab, run:" -ForegroundColor White
Write-Host "     console.log(window.CKDesktop)" -ForegroundColor Cyan
Write-Host "     console.log(window.CKDesktop.apiKeys)" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Expected result:" -ForegroundColor Green
Write-Host "   You should see: [CKDesktop] API keys injected: [...]" -ForegroundColor White
Write-Host "   window.CKDesktop should be defined with apiKeys object" -ForegroundColor White
Write-Host ""
Write-Host "📄 For detailed instructions, see: TEST_API_INJECTION.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Launching app..." -ForegroundColor Green
Write-Host ""

# Start the app
npm run dev
