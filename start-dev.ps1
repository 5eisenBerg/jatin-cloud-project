#!/usr/bin/env pwsh
# Start Traffic Fine Management System - Local Development
# This script starts both frontend and backend in separate processes

Write-Host "🚀 Traffic Fine Management System - Local Development" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check Node.js installation
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Resolve script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = $scriptDir

# Check if we're in the right directory
if (-not (Test-Path "$rootDir/frontend")) {
    Write-Host "❌ frontend folder not found. Please run from project root." -ForegroundColor Red
    exit 1
}

# Check for .env files
Write-Host ""
Write-Host "Checking environment files..." -ForegroundColor Yellow
if (-not (Test-Path "$rootDir/backend/.env")) {
    Write-Host "⚠️  backend/.env not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path "$rootDir/backend/.env.example") {
        Copy-Item "$rootDir/backend/.env.example" "$rootDir/backend/.env"
    }
}

if (-not (Test-Path "$rootDir/frontend/.env.local")) {
    Write-Host "⚠️  frontend/.env.local not found. Creating from .env.local.example..." -ForegroundColor Yellow
    if (Test-Path "$rootDir/frontend/.env.local.example") {
        Copy-Item "$rootDir/frontend/.env.local.example" "$rootDir/frontend/.env.local"
    }
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow

Write-Host "  → Backend dependencies..." -ForegroundColor Cyan
Set-Location "$rootDir/backend"
if (-not (Test-Path "node_modules")) {
    npm install --silent
} else {
    Write-Host "     ✅ Already installed" -ForegroundColor Green
}

Write-Host "  → Frontend dependencies..." -ForegroundColor Cyan
Set-Location "$rootDir/frontend"
if (-not (Test-Path "node_modules")) {
    npm install --silent
} else {
    Write-Host "     ✅ Already installed" -ForegroundColor Green
}

# Start services
Write-Host ""
Write-Host "🎯 Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start backend
Write-Host "Starting Backend (Port 3001)..." -ForegroundColor Cyan
Set-Location "$rootDir/backend"
Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/k npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend (Port 3000)..." -ForegroundColor Cyan
Set-Location "$rootDir/frontend"
Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/k npm start"

Write-Host ""
Write-Host "✅ Applications starting..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: To stop all processes, close both command windows" -ForegroundColor Yellow
Write-Host ""
