$ErrorActionPreference = "Continue"

$baseUrl = "http://localhost:3000"
$routes = @('/', '/offers', '/catalog?on_sale=true', '/admin/login', '/admin/customers', '/admin/reviews', '/admin/banners', '/admin/orders/a8b2ed7f-710a-41e3-b764-b4bd475e1c7a')

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "      FRONTEND ROUTE SSR / RENDER VERIFICATION   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

foreach ($r in $routes) {
    try {
        $res = Invoke-WebRequest -Uri "$baseUrl$r" -UseBasicParsing -TimeoutSec 30
        if ($res.StatusCode -eq 200) {
            Write-Host " [PASS] HTTP 200 OK -> $r" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " [FAIL] HTTP $($res.StatusCode) -> $r" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " [FAIL] Route $r failed: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "=================================================" -ForegroundColor Cyan
$resColor = "Red"
if ($failed -eq 0) { $resColor = "Green" }
Write-Host " FRONTEND RESULTS: $passed PASSED, $failed FAILED" -ForegroundColor $resColor
Write-Host "=================================================" -ForegroundColor Cyan
