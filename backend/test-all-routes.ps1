# Complete API Test Suite
# Tests all endpoints of the AI Interview System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Interview System - API Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Test Root Endpoint
Write-Host "[1] Testing Root Endpoint..." -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri 'http://localhost:5000/' -Method GET
    Write-Host "  ✅ $($root.message)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Root endpoint failed" -ForegroundColor Red
}

# 2. Test Auth Test Endpoint
Write-Host "`n[2] Testing Auth Test Endpoint..." -ForegroundColor Yellow
try {
    $authTest = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/test' -Method GET
    Write-Host "  ✅ $($authTest.message)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Auth test endpoint failed" -ForegroundColor Red
}

# 3. Test Login
Write-Host "`n[3] Testing Login..." -ForegroundColor Yellow
$loginData = @{
    email = 'test@example.com'
    password = 'password123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body $loginData
    $token = $loginResponse.token
    Write-Host "  ✅ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 4. Test Get All Interviews
Write-Host "`n[4] Testing Get All Interviews..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}
try {
    $interviews = Invoke-RestMethod -Uri 'http://localhost:5000/api/interviews' -Method GET -Headers $headers
    Write-Host "  ✅ Found $($interviews.count) interviews" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to get interviews" -ForegroundColor Red
}

# 5. Test Create Interview with AI Feedback
Write-Host "`n[5] Testing Create Interview (with AI feedback)..." -ForegroundColor Yellow
$interviewData = @{
    question = 'Explain the concept of closures in JavaScript'
    answer = 'A closure is a function that has access to variables in its outer scope, even after the outer function has returned. Closures are created when a function is defined inside another function.'
    category = 'technical'
    difficulty = 'medium'
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    $newInterview = Invoke-RestMethod -Uri 'http://localhost:5000/api/interviews' -Method POST -Headers $headers -Body $interviewData
    Write-Host "  ✅ Interview created successfully" -ForegroundColor Green
    Write-Host "  Interview ID: $($newInterview.data._id)" -ForegroundColor Gray
    Write-Host "  Score: $($newInterview.data.score)/100" -ForegroundColor Gray
    Write-Host "  AI Feedback: $($newInterview.data.aiFeedback.Substring(0, [Math]::Min(60, $newInterview.data.aiFeedback.Length)))..." -ForegroundColor Gray
    $interviewId = $newInterview.data._id
} catch {
    Write-Host "  ❌ Failed to create interview: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Test Get Single Interview
if ($interviewId) {
    Write-Host "`n[6] Testing Get Single Interview..." -ForegroundColor Yellow
    try {
        $singleInterview = Invoke-RestMethod -Uri "http://localhost:5000/api/interviews/$interviewId" -Method GET -Headers @{Authorization = "Bearer $token"}
        Write-Host "  ✅ Retrieved interview: $($singleInterview.data.question.Substring(0, 40))..." -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to get single interview" -ForegroundColor Red
    }
}

# 7. Test Interview Statistics
Write-Host "`n[7] Testing Interview Statistics..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri 'http://localhost:5000/api/interviews/stats/summary' -Method GET -Headers @{Authorization = "Bearer $token"}
    Write-Host "  ✅ Statistics retrieved" -ForegroundColor Green
    Write-Host "  Total Interviews: $($stats.data.totalInterviews)" -ForegroundColor Gray
    Write-Host "  Average Score: $([Math]::Round($stats.data.averageScore, 2))" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to get statistics" -ForegroundColor Red
}

# 8. Test Generate Question
Write-Host "`n[8] Testing Generate Question..." -ForegroundColor Yellow
$questionData = @{
    category = 'behavioral'
    difficulty = 'easy'
} | ConvertTo-Json

try {
    $question = Invoke-RestMethod -Uri 'http://localhost:5000/api/interviews/generate-question' -Method POST -Headers $headers -Body $questionData
    Write-Host "  ✅ Question generated" -ForegroundColor Green
    Write-Host "  Question: $($question.data.question)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to generate question: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Test Protected Route without Token
Write-Host "`n[9] Testing Protected Route (without token)..." -ForegroundColor Yellow
try {
    $unauthorized = Invoke-RestMethod -Uri 'http://localhost:5000/api/interviews' -Method GET
    Write-Host "  ❌ Should have been unauthorized" -ForegroundColor Red
} catch {
    Write-Host "  ✅ Correctly rejected unauthorized request" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Suite Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
