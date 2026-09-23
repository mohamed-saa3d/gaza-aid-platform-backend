# E2E_CATEGORY_DELETE - mandatory runtime test (Phase 1 / 11)
# Verifies: deleting a category never deletes its projects; linked projects
# survive as Uncategorized and stay visible under "All Projects".
# Windows PowerShell 5.1 compatible (no -SkipHttpErrorCheck).

$ErrorActionPreference = 'Continue'
$BASE = 'http://127.0.0.1:5000/api/v1'
$PREFIX = 'E2E_DASHBOARD_2026_09_22'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Send([string]$method, [string]$path, $body, $session) {
  $params = @{
    Uri = "$BASE$path"; Method = $method; UseBasicParsing = $true; TimeoutSec = 30
  }
  if ($session) { $params.WebSession = $session }
  if ($null -ne $body) {
    $json = $body | ConvertTo-Json -Compress
    $params.ContentType = 'application/json; charset=utf-8'
    $params.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
  }
  try {
    $r = Invoke-WebRequest @params
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = $r.Content }
  }
  catch {
    $resp = $_.Exception.Response
    if ($resp) {
      # Windows PowerShell 5.1 can expose an already-drained stream here, which
      # silently yields an empty body for error responses. `GetResponseStream()`
      # is re-read via a MemoryStream copy so the real JSON body is preserved.
      $stream = $resp.GetResponseStream()
      $ms = New-Object System.IO.MemoryStream
      $stream.CopyTo($ms)
      $bytes = $ms.ToArray()
      $text = [System.Text.Encoding]::UTF8.GetString($bytes)

      if ([string]::IsNullOrWhiteSpace($text)) {
        # Fallback: read directly off the response stream position 0.
        $stream.Position = 0
        $sr = New-Object System.IO.StreamReader($stream)
        $text = $sr.ReadToEnd()
      }

      return [pscustomobject]@{ Status = [int]$resp.StatusCode; Body = $text }
    }
    return [pscustomobject]@{ Status = 0; Body = $_.Exception.Message }
  }
}

# 1. Admin login
$cred = @{ email = 'mohamed.saad@qaza.org'; password = 'MySecureAdminPassword2026!' }
$loginBytes = [System.Text.Encoding]::UTF8.GetBytes(($cred | ConvertTo-Json -Compress))
$S = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
  $raw = Invoke-WebRequest -Uri "$BASE/admin/login" -Method POST -ContentType 'application/json; charset=utf-8' `
    -Body $loginBytes -UseBasicParsing -SessionVariable S -TimeoutSec 30
}
catch { Write-Output "FATAL login: $($_.Exception.Message)"; exit 1 }
$loginJson = $raw.Content | ConvertFrom-Json
Write-Output "1. Admin login .............. OK  role=$($loginJson.data.admin.role)"

# 2. Create test category
$catBody = @{
  nameAr = "${PREFIX}_cat_ar"; nameEn = "${PREFIX}_Category"
  descriptionAr = 'E2E delete test category ar'; descriptionEn = 'E2E delete test category en'
}
$cat = Send 'POST' '/categories' $catBody $S
if ($cat.Status -ne 201) { Write-Output "FATAL create category HTTP $($cat.Status): $($cat.Body)"; exit 1 }
$catId = ($cat.Body | ConvertFrom-Json).data.id
Write-Output "2. Category created ......... id=$catId"

# 3. Create test project linked to it
$projBody = @{
  titleAr = "${PREFIX}_proj_ar"; titleEn = "${PREFIX}_Project"
  descriptionAr = 'E2E delete test project description ar'; descriptionEn = 'E2E delete test project description en'
  targetAmount = '50000'; beneficiariesCount = '123'; status = 'ACTIVE'
  categoryId = $catId
  imageUrl = 'https://via.placeholder.com/600x400?text=E2E'
}
$proj = Send 'POST' '/projects' $projBody $S
if ($proj.Status -ne 201) { Write-Output "FATAL create project HTTP $($proj.Status): $($proj.Body)"; exit 1 }
$projId = ($proj.Body | ConvertFrom-Json).data.id
Write-Output "3. Project created .......... id=$projId"

# 4. First delete attempt MUST NOT delete anything
$attempt = Send 'DELETE' "/categories/$catId" $null $S
Write-Output "4. First DELETE status ...... $($attempt.Status)  (expect 409)"
$conflict = $attempt.Body | ConvertFrom-Json
Write-Output "   code .................... $($conflict.code)  (expect CATEGORY_HAS_PROJECTS)"
Write-Output "   linkedProjectCount ...... $($conflict.data.linkedProjectCount)  (expect 1)"
Write-Output "   confirmationRequired .... $($conflict.data.confirmationRequired)  (expect True)"

$catStill = Send 'GET' "/categories/$catId" $null $null
Write-Output "   category still exists ... HTTP $($catStill.Status)  (expect 200)"

$projStill = (Send 'GET' "/projects/$projId" $null $null).Body | ConvertFrom-Json
Write-Output "   project still exists .... $($projStill.data.titleEn)"
Write-Output "   project still linked .... $($projStill.data.category.id)  (expect $catId)"

# 5. Confirmed delete
$del = Send 'DELETE' "/categories/$catId" @{ confirmUnassignProjects = $true } $S
$delJson = $del.Body | ConvertFrom-Json
Write-Output "5. Confirmed DELETE ......... HTTP $($del.Status) success=$($delJson.success)"
Write-Output "   unassignedProjectCount .. $($delJson.data.unassignedProjectCount)  (expect 1)"

# 6. Category gone
$catGone = Send 'GET' "/categories/$catId" $null $null
Write-Output "6. Category after delete .... HTTP $($catGone.Status)  (expect 404)"

# 7. Project SURVIVED and is Uncategorized
$after = (Send 'GET' "/projects/$projId" $null $null).Body | ConvertFrom-Json
Write-Output "7. Project after delete ..... $($after.data.titleEn)"
if ($null -eq $after.data.category) { $catVal = 'null' } else { $catVal = $after.data.category.id }
Write-Output "   category ................ $catVal  (expect null)"
Write-Output "   targetAmount ............ $($after.data.targetAmount)  (expect 50000)"
Write-Output "   beneficiariesCount ...... $($after.data.beneficiariesCount)  (expect 123)"
Write-Output "   status .................. $($after.data.status)  (expect ACTIVE)"

# 8. Project visible in the public "All Projects" list
$list = (Send 'GET' '/projects?limit=100' $null $null).Body | ConvertFrom-Json
$inAll = @($list.data | Where-Object { $_.id -eq $projId }).Count -gt 0
Write-Output "8. Project in All Projects .. $inAll  (expect True)"

# 9. Deleted category no longer offered as a filter
$cats = (Send 'GET' '/categories?limit=100' $null $null).Body | ConvertFrom-Json
$catPresent = @($cats.data | Where-Object { $_.id -eq $catId }).Count -gt 0
Write-Output "9. Category in filter list .. $catPresent  (expect False)"

# 10. Category filter contract: filtering BY the deleted category returns nothing,
#     while the unfiltered "All" list still contains the now-uncategorized project.
$byDeleted = (Send 'GET' "/projects?limit=100&categoryId=$catId" $null $null).Body | ConvertFrom-Json
$inDeletedFilter = @($byDeleted.data | Where-Object { $_.id -eq $projId }).Count -gt 0
Write-Output "10. Filter by deleted cat ... $inDeletedFilter  (expect False)"

$allCount = @($list.data).Count
$uncategorizedInAll = @($list.data | Where-Object { $_.id -eq $projId -and $null -eq $_.category }).Count -gt 0
Write-Output "    All list size ............ $allCount"
Write-Output "    Uncategorized under All .. $uncategorizedInAll  (expect True)"

# 11. Localization contract on the public project payload
$en = (Send 'GET' "/projects/$projId`?locale=en" $null $null).Body | ConvertFrom-Json
$ar = (Send 'GET' "/projects/$projId`?locale=ar" $null $null).Body | ConvertFrom-Json
Write-Output "11. locale=en title .......... $($en.data.title)  (expect English)"
Write-Output "    locale=ar title .......... $($ar.data.title)  (expect Arabic)"
Write-Output "    locale=en categoryName ... $($en.data.categoryName)"

Write-Output ""
Write-Output "E2E_CLEANUP_PROJECT_ID=$projId"
