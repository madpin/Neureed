# Cookie Extraction Guide

This guide explains how to extract cookies from your browser to enable authenticated content extraction in NeuReed.

## Why Extract Cookies?

Some websites require authentication (login) to access their content. By extracting cookies from your browser after logging in, NeuReed can access paywalled or members-only content on your behalf.

## Security Notice

⚠️ **Important Security Information:**
- Cookies are stored **encrypted** in the database using AES-256-GCM encryption
- Never share your cookies with others - they provide access to your accounts
- Cookies may expire and need to be updated periodically
- Only extract cookies from sites you trust
- NeuReed only uses cookies for content extraction, never for tracking

## Browser-Specific Instructions

### Google Chrome

1. **Open the website and log in**
   - Navigate to the website you want to extract content from
   - Complete the login process

2. **Open Developer Tools**
   - Press `F12` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Or right-click anywhere and select "Inspect"

3. **Go to Console tab**
   - Click on the "Console" tab in Developer Tools

4. **Extract cookies**
   - Paste this code and press Enter:
   ```javascript
   document.cookie.split(';').map(c => {
     const [name, ...rest] = c.trim().split('=');
     return { name, value: rest.join('=') };
   });
   ```

5. **Copy the output**
   - Right-click on the output array
   - Select "Copy object"

6. **Paste into NeuReed**
   - Go to Feed Settings in NeuReed
   - Enable "Requires authentication"
   - Paste the copied cookies into the Cookies field

### Mozilla Firefox

1. **Open the website and log in**
   - Navigate to the website and complete login

2. **Open Web Console**
   - Press `F12` (Windows/Linux) or `Cmd+Option+K` (Mac)
   - Or go to Menu > More Tools > Web Developer Tools

3. **Go to Console tab**
   - Click on the "Console" tab

4. **Extract cookies**
   - Paste this code and press Enter:
   ```javascript
   document.cookie.split(';').map(c => {
     const [name, ...rest] = c.trim().split('=');
     return { name, value: rest.join('=') };
   });
   ```

5. **Copy the output**
   - Right-click on the output
   - Select "Copy Object"

6. **Paste into NeuReed**
   - Follow the same steps as Chrome

### Safari

1. **Enable Developer Menu**
   - Go to Safari > Preferences > Advanced
   - Check "Show Develop menu in menu bar"

2. **Open the website and log in**
   - Navigate to the website and complete login

3. **Open Web Inspector**
   - Press `Cmd+Option+I`
   - Or go to Develop > Show Web Inspector

4. **Go to Console tab**
   - Click on the "Console" tab

5. **Extract cookies**
   - Paste this code and press Enter:
   ```javascript
   document.cookie.split(';').map(c => {
     const [name, ...rest] = c.trim().split('=');
     return { name, value: rest.join('=') };
   });
   ```

6. **Copy the output**
   - Right-click on the output
   - Select "Copy"

7. **Paste into NeuReed**
   - Follow the same steps as Chrome

## Supported Cookie Formats

NeuReed supports multiple cookie formats:

### 1. JSON Array (Recommended)
```json
[
  {"name": "session", "value": "abc123..."},
  {"name": "token", "value": "xyz789..."}
]
```

### 2. Header String Format
```
session=abc123...; token=xyz789...; user_id=12345
```

### 3. Key=Value Pairs (One per line)
```
session=abc123...
token=xyz789...
user_id=12345
```

### 4. Netscape Format (Tab-separated)
```
.example.com	TRUE	/	FALSE	1234567890	session	abc123...
.example.com	TRUE	/	FALSE	1234567890	token	xyz789...
```

## Common Issues and Solutions

### Issue: "Authentication required" error after setting cookies

**Solutions:**
- Verify you're logged in to the website before extracting cookies
- Make sure you copied ALL cookies, not just some
- Try extracting cookies again - they may have expired
- Check if the website uses additional authentication methods (2FA, etc.)

### Issue: Cookies expire quickly

**Solutions:**
- Some websites have short session timeouts
- You'll need to re-extract cookies periodically
- Look for "Remember me" or "Keep me logged in" options when logging in
- Consider using a dedicated account for feed extraction

### Issue: Extraction still fails with valid cookies

**Solutions:**
- The website may use JavaScript-heavy rendering - try Playwright extraction method
- Some websites detect automated access - try adding custom headers
- The website may require additional authentication steps
- Check the website's robots.txt and terms of service

### Issue: Can't find cookies in browser console

**Solutions:**
- Make sure you're on the actual website page, not a login redirect
- Some websites use httpOnly cookies that can't be accessed via JavaScript
- Try using browser extensions like "EditThisCookie" to export cookies
- Check if cookies are set for a different domain/subdomain

## Best Practices

1. **Use Dedicated Accounts**
   - Create separate accounts for feed extraction when possible
   - Don't use your primary account credentials

2. **Regular Updates**
   - Update cookies when you see authentication errors
   - Set a reminder to refresh cookies monthly

3. **Test After Setting**
   - Always use the "Test" button after setting cookies
   - Verify the extracted content looks correct

4. **Minimal Permissions**
   - Only extract cookies from sites you trust
   - Review what data the cookies provide access to

5. **Monitor Usage**
   - Check feed refresh logs for authentication errors
   - Update cookies promptly when they expire

## Privacy Considerations

### What NeuReed Does With Cookies:
- ✅ Stores them encrypted in the database
- ✅ Uses them only for content extraction
- ✅ Sends them only to the original website
- ✅ Never shares them with third parties

### What NeuReed Does NOT Do:
- ❌ Track your browsing activity
- ❌ Share cookies with other users
- ❌ Use cookies for any purpose other than content extraction
- ❌ Store cookies in plain text

## Advanced: Manual Cookie Management

### Exporting Cookies with Browser Extensions

For more control, you can use browser extensions:

**Chrome/Firefox:**
- EditThisCookie
- Cookie-Editor
- Export Cookies

These extensions allow you to:
- Export cookies in various formats
- Filter cookies by domain
- View cookie details (expiration, httpOnly, etc.)
- Import/export cookie sets

### Using Browser DevTools Storage Tab

1. Open DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click on "Cookies" in the sidebar
4. Select the website domain
5. Manually copy cookie names and values

## Troubleshooting Checklist

Before reporting issues, check:

- [ ] You're logged in to the website
- [ ] You extracted cookies from the correct domain
- [ ] You copied the entire cookie output
- [ ] The cookies are in a supported format
- [ ] You tested the extraction after saving
- [ ] The website allows automated access
- [ ] Your account has access to the content
- [ ] Cookies haven't expired

## Getting Help

If you're still having issues:

1. Check the feed refresh logs for specific error messages
2. Try the "Test" button in Feed Settings to see detailed errors
3. Verify the website's content is accessible when logged in manually
4. Check if the website has changed its authentication method
5. Consider using Playwright extraction method for JavaScript-heavy sites

## Legal and Ethical Considerations

⚠️ **Important:**
- Only extract content you have legitimate access to
- Respect website terms of service
- Don't circumvent paywalls you haven't paid for
- Be aware of copyright and fair use laws
- Some websites explicitly prohibit automated access

NeuReed is designed for personal use to aggregate content you already have access to. Use it responsibly and ethically.

