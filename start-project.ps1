# Script para iniciar o projeto completo (Frontend + Backend)

Write-Host "🚀 Iniciando REStooq ERP..." -ForegroundColor Green
Write-Host ""

# Inicia o backend
Write-Host "📦 Iniciando o backend na porta 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Aguarda um pouco para o backend iniciar
Start-Sleep -Seconds 3

# Inicia o frontend
Write-Host "🎨 Iniciando o frontend na porta 4200..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; ng serve"

Write-Host ""
Write-Host "✅ Projeto iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📌 Frontend: http://localhost:4200" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔐 Credenciais de teste:" -ForegroundColor Magenta
Write-Host "   Email: admin@restooq.com" -ForegroundColor White
Write-Host "   Senha: 123456" -ForegroundColor White

