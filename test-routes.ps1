$routes = @(
    '/',
    '/catalog',
    '/offers',
    '/login',
    '/profile',
    '/admin/orders/a8b2ed7f-710a-41e3-b764-b4bd475e1c7a',
    '/admin/orders',
    '/admin/customers',
    '/admin/chat',
    '/admin/pages',
    '/about-us'
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FRONTEND ROUTE VERIFICATION SUITE      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

foreach ($r in $routes) {
    try {
        $res = Invoke-WebRequest -Uri ("http://localhost:3000" + $r) -UseBasicParsing -TimeoutSec 15
        if ($res.StatusCode -eq 200) {
            Write-Host " [PASS 200] $r" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " [FAIL $($res.StatusCode)] $r" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " [FAIL] $r -> $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " TOTAL: $passed PASSED, $failed FAILED   " -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=========================================" -ForegroundColor Cyan
