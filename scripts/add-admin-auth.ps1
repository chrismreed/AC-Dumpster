$adminDir = 'C:\Users\chris\Documents\Alley Cat Dumpsters\Alleycat\AC-Dumpster\src\app\api\admin'

$files = Get-ChildItem -Path $adminDir -Recurse -Filter 'route.ts' | Where-Object {
    $_.FullName -notmatch '\\login\\' -and $_.FullName -notmatch '\\logout\\'
}

$withTodo = $files | Where-Object { (Get-Content $_.FullName -Raw) -match 'TODO: Add admin authentication' }
$withoutTodo = $files | Where-Object { (Get-Content $_.FullName -Raw) -notmatch 'TODO: Add admin authentication' }

Write-Host "With TODO: $($withTodo.Count)"
Write-Host "Without TODO: $($withoutTodo.Count)"
Write-Host "--- Files WITHOUT TODO ---"
$withoutTodo | ForEach-Object { Write-Host $_.FullName }

Write-Host ""
Write-Host "=== APPLYING AUTH GUARD TO FILES WITH TODO ==="

$importLine = "import { verifyAdminAuth } from '@/lib/admin-auth';"
$authGuard = @"
    const authResult = await verifyAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
"@

$todoPattern = '(\s*)// TODO: Add admin authentication middleware\r?\n(\s*)// For now, allow all requests\r?\n'
$todoPatternSimple = '(\s*)// TODO: Add admin authentication middleware\r?\n'

foreach ($file in $withTodo) {
    $content = Get-Content $file.FullName -Raw

    # Add import if not already present
    if ($content -notmatch "verifyAdminAuth") {
        # Add import after the last existing import line
        $content = $content -replace "(import [^\n]+\n)(?!import )", "`$1$importLine`n"
    }

    # Replace TODO comment block (with or without the "For now" line)
    if ($content -match '// TODO: Add admin authentication middleware\r?\n\s*// For now, allow all requests') {
        $content = $content -replace '[ \t]*// TODO: Add admin authentication middleware\r?\n[ \t]*// For now, allow all requests\r?\n', $authGuard
    } else {
        $content = $content -replace '[ \t]*// TODO: Add admin authentication middleware\r?\n', $authGuard
    }

    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name) in $($file.Directory.Name)"
}

Write-Host ""
Write-Host "Done! Updated $($withTodo.Count) files."
