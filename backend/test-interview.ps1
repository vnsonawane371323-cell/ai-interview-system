# Test Interview Creation with AI Feedback
# Gets token and creates an interview

$loginData = @{
    email = 'test@example.com'
    password = 'password123'
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method POST -ContentType 'application/json' -Body $loginData

$token = $loginResponse.token
Write-Host "Token obtained: $($token.Substring(0, 20))..."

# Create an interview
$interviewData = @{
    question = 'What is the difference between let and var in JavaScript?'
    answer = 'Let is block-scoped while var is function-scoped. Let does not allow redeclaration in the same scope, but var does. Variables declared with let are not hoisted to the top of their scope.'
    category = 'technical'
    difficulty = 'medium'
} | ConvertTo-Json

Write-Host "`nCreating interview with AI feedback generation..."
$headers = @{
    Authorization = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    $interviewResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/interviews' -Method POST -Headers $headers -Body $interviewData
    
    Write-Host "`n✅ Interview Created Successfully!"
    Write-Host "Interview ID: $($interviewResponse.data._id)"
    Write-Host "Question: $($interviewResponse.data.question)"
    Write-Host "Score: $($interviewResponse.data.score)/100"
    Write-Host "`nAI Feedback:"
    Write-Host $interviewResponse.data.aiFeedback
} catch {
    Write-Host "❌ Error creating interview:"
    Write-Host $_.Exception.Message
}
