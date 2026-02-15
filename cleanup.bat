@echo off
echo Cleaning up unused folders and files...

REM Set the root directory (adjust if needed)
set ROOT_DIR=%~dp0src

REM Delete unused folders and files
echo Deleting authentication and Sentry-related files...

REM Authentication-related files
if exist "%ROOT_DIR%\lib\authUtils.ts" (
    del "%ROOT_DIR%\lib\authUtils.ts"
    echo Deleted: %ROOT_DIR%\lib\authUtils.ts
)

if exist "%ROOT_DIR%\lib\cognito.ts" (
    del "%ROOT_DIR%\lib\cognito.ts"
    echo Deleted: %ROOT_DIR%\lib\cognito.ts
)

REM Authentication-related components
if exist "%ROOT_DIR%\components\auth" (
    rmdir /s /q "%ROOT_DIR%\components\auth"
    echo Deleted: %ROOT_DIR%\components\auth
)

REM Authentication-related pages
if exist "%ROOT_DIR%\app\login" (
    rmdir /s /q "%ROOT_DIR%\app\login"
    echo Deleted: %ROOT_DIR%\app\login
)

REM Sentry-related components
if exist "%ROOT_DIR%\components\ErrorBoundary.tsx" (
    del "%ROOT_DIR%\components\ErrorBoundary.tsx"
    echo Deleted: %ROOT_DIR%\components\ErrorBoundary.tsx
)

REM Types related to authentication
if exist "%ROOT_DIR%\types\auth.d.ts" (
    del "%ROOT_DIR%\types\auth.d.ts"
    echo Deleted: %ROOT_DIR%\types\auth.d.ts
)

if exist "%ROOT_DIR%\types\auth.ts" (
    del "%ROOT_DIR%\types\auth.ts"
    echo Deleted: %ROOT_DIR%\types\auth.ts
)

REM Clean up global types if unused
if exist "%ROOT_DIR%\types\global.d.ts" (
    del "%ROOT_DIR%\types\global.d.ts"
    echo Deleted: %ROOT_DIR%\types\global.d.ts
)

echo Cleaning complete.

REM Exit with success message
echo All specified files and folders have been deleted.
pause
exit /b 0
