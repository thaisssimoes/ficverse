@echo off
echo Opening Rich Text Editor Test Page...
echo.
echo This will open the test page in your default browser.
echo You can manually test the rich text editor functionality.
echo.
start frontend\tests\rich-text-editor.test.html
echo.
echo Test page opened!
echo.
echo To test the integration in the dashboard:
echo 1. Start the backend server (if not running)
echo 2. Open frontend/dashboard.html in your browser
echo 3. Login and create/edit a fanfic
echo 4. Verify that synopsis, disclaimer, and chapter content use rich text editors
echo.
pause
