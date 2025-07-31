## Admin Features

### Making a User Admin

To make a user an admin, use the make-admin script:

```bash
npx tsx scripts/make-admin.ts user@example.com
```

This will grant the specified user admin privileges, allowing them to:
- Create and restore database backups
- Access admin-only analytics
- Perform system maintenance

### Backup & Restore

Admin users can manage database backups through the Analytics dashboard:

1. Navigate to `/analytics` as an admin user
2. Find the "Backup Controls" section
3. Use the "Create Backup" button to create a new full backup
4. Use the "Restore Latest" button to restore from the most recent backup

Backups are stored securely in S3 and include all database tables. The system maintains an audit log of all backup and restore operations.

⚠️ **Important:** Before restoring a backup:
- Ensure you have a recent backup of the current state
- Notify users of potential system maintenance
- Schedule maintenance during off-peak hours

Environment Variables Required:
```plaintext
AWS_REGION=<your-region>
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_BACKUP_BUCKET=<your-bucket-name>
```
