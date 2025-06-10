Write-Host "Starting local development server..." -ForegroundColor Green
Write-Host ""
Write-Host "Demo users available:" -ForegroundColor Yellow
Write-Host "  - Username: siphiwe, Password: 1924@Khumalo" -ForegroundColor Cyan
Write-Host "  - Username: agent007, Password: secret123" -ForegroundColor Cyan
Write-Host "  - Username: fieldagent, Password: field123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will run on http://localhost:3001" -ForegroundColor Blue
Write-Host "Frontend should run on http://localhost:5173 or http://localhost:5000" -ForegroundColor Blue
Write-Host ""

node server-local-simple.js