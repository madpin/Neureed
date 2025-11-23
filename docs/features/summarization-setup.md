# Admin Guide: Article Summarization Setup

## Overview

The article summarization feature allows automatic generation of summaries, key points, and topics for RSS feed articles using LLM (Large Language Model) providers.

## Admin Dashboard Location

**Path:** Admin Dashboard → Search Tab → Article Summarization section

The summarization configuration panel appears at the bottom of the Search tab, after the embeddings configuration.

## Enabling Summarization

### Via Admin Dashboard (Recommended)

1. **Navigate to Admin Dashboard**
   - Go to `/admin/dashboard`
   - Click on the "Search" tab

2. **Find the Summarization Section**
   - Scroll down to the "Article Summarization" panel
   - You'll see a toggle switch on the right side

3. **Enable the Feature**
   - Click the toggle switch to enable
   - The switch will turn blue when enabled
   - A green success message will appear
   - Status will show "Enabled" in green

4. **Visual Indicators**
   - **Enabled**: Blue toggle, green status badge
   - **Disabled**: Gray toggle, yellow status badge
   - **Custom Setting**: Shows "Custom" badge if configured via database

### Via API (Alternative)

```bash
curl -X POST http://localhost:3000/api/admin/summarization/config \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"autoGenerate": true}'
```

## What Happens When Enabled

### System-Wide Effects

1. **User Access**: Users can now configure summarization for their feeds
2. **Feed Refresh**: After each feed refresh, eligible articles are automatically summarized in the background
3. **Notifications**: Users receive notifications when summarization completes

### Filtering Criteria

Articles are only summarized if ALL of these conditions are met:
- ✅ Admin has enabled the feature (you just did this!)
- ✅ User has enabled summarization for that specific feed
- ✅ Article doesn't already have a summary
- ✅ Article content length meets the minimum threshold (default: 5000 characters)

## User Configuration

Once you enable this feature, users can:

1. **Configure Per-Feed Settings**
   - Go to Feed Settings
   - Enable/disable summarization
   - Set minimum content length
   - Choose to include key points and topics

2. **View Notifications**
   - Receive notifications when summaries complete
   - See success/failure counts
   - Track skipped articles

3. **Manual Trigger**
   - Manually request summarization for pending articles
   - Estimate costs before processing

## Cost Considerations

### LLM Provider Usage

- **OpenAI**: Costs based on token usage (see pricing below)
- **Ollama**: Free (runs locally)

### Typical Costs (OpenAI)

| Model | Prompt Cost | Completion Cost | Est. per Article |
|-------|-------------|-----------------|------------------|
| GPT-3.5 Turbo | $0.0005/1K | $0.0015/1K | ~$0.002-0.005 |
| GPT-4 Turbo | $0.01/1K | $0.03/1K | ~$0.02-0.05 |

**Example**: Summarizing 100 articles with GPT-3.5 Turbo ≈ $0.20-0.50

### Cost Monitoring

View costs in Admin Dashboard:
- Total tokens used
- Total cost (USD)
- Breakdown by provider
- Per-user statistics
- Time-based reports (24h, 7d, 30d)

## Disabling Summarization

### To Temporarily Disable

1. Go to Admin Dashboard → Search tab
2. Click the toggle switch to turn it off
3. Status will change to "Disabled" (yellow)

**Effect**:
- No new summaries will be generated
- Existing summaries remain intact
- Users cannot enable it for their feeds

### To Permanently Disable

1. Disable via the toggle (as above)
2. Optionally, delete cost tracking data:
   ```bash
   curl -X DELETE http://localhost:3000/api/admin/summarization/costs
   ```

## Troubleshooting

### Toggle Not Working?

**Check:**
- Are you logged in as admin?
- Is the API endpoint responding?
- Check browser console for errors

**Solution:**
```bash
# Check current status
curl http://localhost:3000/api/admin/summarization/config

# Force enable via API
curl -X POST http://localhost:3000/api/admin/summarization/config \
  -H "Content-Type: application/json" \
  -d '{"autoGenerate": true}'
```

### Users Report No Summaries Generated?

**Common Issues:**

1. **Feature Not Enabled** → Enable in admin dashboard
2. **User Hasn't Configured Feed** → User must enable per-feed
3. **Articles Too Short** → Check minimum content length setting
4. **LLM Not Configured** → User needs to set up OpenAI API key or Ollama in preferences

**Debug Steps:**
```bash
# Check if enabled
curl http://localhost:3000/api/admin/summarization/config

# Check user's feed settings
curl http://localhost:3000/api/feeds/{feedId}/summarization

# Check pending articles
curl http://localhost:3000/api/user/articles/summarize
```

### High Costs?

**Solutions:**

1. **Increase minimum content length** → Reduces volume
   - Default: 5000 characters
   - Recommend: 7000-10000 for cost savings

2. **Recommend Ollama to users** → Free local processing
   - Users configure in Preferences → LLM Settings
   - No API costs

3. **Disable for low-value feeds** → Users can disable per-feed

4. **Monitor via dashboard** → Track costs regularly
   - Check "by user" breakdown
   - Identify high-usage users
   - Set guidelines

## Default Settings

When you enable summarization, these defaults apply:

### System Defaults
- **Enabled**: false (must be enabled by admin)
- **Min Content Length**: 5000 characters
- **Include Key Points**: true (3-5 bullet points)
- **Include Topics**: true (3-5 tags)

### User Can Customize
- Enable/disable per feed
- Adjust minimum content length (100-100,000 chars)
- Toggle key points extraction
- Toggle topics detection

## Security & Privacy

### Data Handling

- **Article content** is sent to LLM provider (OpenAI or Ollama)
- **Summaries** are stored in the database
- **API keys** are encrypted in the database
- **Costs** tracked in-memory (not persisted on restart)

### Recommendations

1. **OpenAI Users**: Use API keys, not shared accounts
2. **Sensitive Content**: Consider Ollama for privacy-sensitive feeds
3. **Cost Limits**: Monitor usage regularly
4. **User Guidelines**: Set expectations about costs

## FAQ

### Q: What LLM models are supported?
**A**: OpenAI (GPT-3.5, GPT-4) and Ollama (any local model). Users configure in their preferences.

### Q: Can I set cost limits?
**A**: Not currently. Cost tracking is available but no hard limits are enforced.

### Q: Do old articles get summarized?
**A**: No, only new articles from feed refreshes. Users can manually trigger for backlog.

### Q: What happens if summarization fails?
**A**: The feed refresh still succeeds. Users receive a notification with error details. Articles can be retried manually.

### Q: Can users override my settings?
**A**: Users can only configure if you enable the feature. They can customize thresholds but cannot enable if you've disabled it system-wide.

### Q: Where are summaries stored?
**A**: In the `articles` table, columns: `summary`, `keyPoints`, `topics`.

### Q: How do I see who's using it most?
**A**: Admin Dashboard → Check cost statistics → View "by user" breakdown.

## Next Steps

After enabling:

1. ✅ **Notify users** about the new feature
2. ✅ **Share guidelines** on cost-effective usage
3. ✅ **Monitor costs** regularly via dashboard
4. ✅ **Gather feedback** on summary quality
5. ✅ **Adjust settings** based on usage patterns

## Support

**Documentation**: See [SUMMARIZATION_FEATURE.md](./SUMMARIZATION_FEATURE.md) for complete technical details.

**Issues**: Report problems at the project repository or contact your system administrator.

**Cost Optimization**: Consider recommending Ollama for cost-sensitive users.
