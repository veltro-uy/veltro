# Production Storage Setup for Laravel Cloud

## Overview

The user profile feature has been **updated to support cloud storage** (S3, DigitalOcean Spaces, Cloudflare R2, etc.) for production deployments on Laravel Cloud.

## Changes Made

### ✅ Code is Now Production-Ready

1. **AvatarController** - Uses configurable disk instead of hardcoded `'public'`
2. **User Model** - Dynamically generates avatar URLs for both local and cloud storage
3. **Tests** - Updated to work with any configured disk

## Local Development (Current Setup)

Your local `.env` should use the public disk:

```env
FILESYSTEM_DISK=public
```

This stores avatars locally in `storage/app/public/avatars/` and they're accessible via the symbolic link at `public/storage`.

## Production Setup on Laravel Cloud

### Option 1: AWS S3 (Recommended)

Laravel Cloud has first-class support for AWS S3.

#### 1. Create an S3 Bucket

```bash
# Via AWS CLI
aws s3 mb s3://veltro-avatars --region us-east-1

# Set bucket to private (Laravel will generate signed URLs if needed)
aws s3api put-bucket-acl --bucket veltro-avatars --acl private

# Enable CORS if needed for direct uploads
aws s3api put-bucket-cors --bucket veltro-avatars --cors-configuration file://cors.json
```

**cors.json:**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://veltro.app", "https://www.veltro.app"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

#### 2. Create IAM User with Limited Permissions

Create a policy with only necessary permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::veltro-avatars",
        "arn:aws:s3:::veltro-avatars/*"
      ]
    }
  ]
}
```

#### 3. Configure Laravel Cloud Environment

In your Laravel Cloud dashboard, set these environment variables:

```env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=veltro-avatars
AWS_URL=https://veltro-avatars.s3.us-east-1.amazonaws.com
```

#### 4. Make Bucket Objects Public (Optional)

If you want avatars to be publicly accessible without signed URLs:

```bash
# Add bucket policy
aws s3api put-bucket-policy --bucket veltro-avatars --policy file://policy.json
```

**policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::veltro-avatars/*"
    }
  ]
}
```

### Option 2: Cloudflare R2 (Cheaper, Free Egress)

Cloudflare R2 is S3-compatible with zero egress fees.

#### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket named `veltro-avatars`
3. Create API Token with read/write permissions

#### 2. Configure Laravel Cloud

```env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=<R2_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<R2_SECRET_ACCESS_KEY>
AWS_DEFAULT_REGION=auto
AWS_BUCKET=veltro-avatars
AWS_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
AWS_URL=https://avatars.veltro.app  # Your custom domain
AWS_USE_PATH_STYLE_ENDPOINT=false
```

#### 3. Set Up Custom Domain (Optional but Recommended)

1. In R2 bucket settings, add custom domain: `avatars.veltro.app`
2. Add CNAME record: `avatars.veltro.app` → `<bucket>.r2.cloudflarestorage.com`
3. Enable public access for the bucket

### Option 3: DigitalOcean Spaces

S3-compatible with $5/month for 250GB.

#### 1. Create Space

1. Go to DigitalOcean → Spaces
2. Create Space named `veltro-avatars` in NYC3 or SFO3
3. Generate Spaces access keys

#### 2. Configure Laravel Cloud

```env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=<SPACES_KEY>
AWS_SECRET_ACCESS_KEY=<SPACES_SECRET>
AWS_DEFAULT_REGION=nyc3
AWS_BUCKET=veltro-avatars
AWS_ENDPOINT=https://nyc3.digitaloceanspaces.com
AWS_URL=https://veltro-avatars.nyc3.digitaloceanspaces.com
AWS_USE_PATH_STYLE_ENDPOINT=false
```

## Cost Comparison

### AWS S3
- **Storage**: $0.023/GB/month
- **Requests**: $0.005 per 1,000 PUT, $0.0004 per 1,000 GET
- **Transfer OUT**: $0.09/GB (first 10TB)
- **Estimate**: ~$5-15/month for small app

### Cloudflare R2
- **Storage**: $0.015/GB/month
- **Requests**: $0.0036 per 1M Class B (PUT), free Class A (GET)
- **Transfer OUT**: **$0 (FREE!)**
- **Estimate**: ~$3-5/month for small app
- **🏆 Best for public assets**

### DigitalOcean Spaces
- **Flat rate**: $5/month for 250GB storage + 1TB outbound transfer
- **Overage**: $0.01/GB transfer, $0.02/GB storage
- **Estimate**: $5/month (predictable)
- **🏆 Best for predictable costs**

## Deployment Checklist

### Before Deploying

- [ ] Choose storage provider (S3, R2, or Spaces)
- [ ] Create bucket/space
- [ ] Generate access credentials
- [ ] Configure CORS if needed
- [ ] Set up custom domain (optional)

### On Laravel Cloud

- [ ] Add environment variables for chosen provider
- [ ] Set `FILESYSTEM_DISK=s3`
- [ ] Deploy application
- [ ] Run migration: `php artisan migrate`
- [ ] Test avatar upload in production

### After Deployment

- [ ] Upload a test avatar
- [ ] Verify URL is correct
- [ ] Check avatar displays on profile modal
- [ ] Test avatar deletion
- [ ] Monitor storage usage

## Migrating Existing Avatars (If Any)

If you already have avatars in local storage that need migration:

```php
// Run this Artisan command (create if needed)
php artisan avatars:migrate-to-cloud

// Or manually via tinker
php artisan tinker

// Get all users with custom avatars
$users = User::whereNotNull('avatar_path')->get();

foreach ($users as $user) {
    $oldPath = $user->avatar_path;
    $localFile = storage_path('app/public/' . $oldPath);
    
    if (file_exists($localFile)) {
        // Upload to S3
        $contents = file_get_contents($localFile);
        Storage::disk('s3')->put($oldPath, $contents);
        
        echo "Migrated: {$user->name} - {$oldPath}\n";
    }
}
```

## Testing

### Test in Staging First

```bash
# Set staging environment to use S3
php artisan config:clear
php artisan test --filter=AvatarUploadTest
```

### Verify URLs

```php
php artisan tinker

$user = User::find(1);
echo $user->avatar_url;
// Should output S3 URL like:
// https://veltro-avatars.s3.us-east-1.amazonaws.com/avatars/1/abc123.jpg
```

## Troubleshooting

### Images Not Loading

**Check CORS settings** - Browser may block cross-origin requests

```bash
aws s3api get-bucket-cors --bucket veltro-avatars
```

### 403 Forbidden

**Check bucket policy** - Ensure public read access or use signed URLs

### Slow Uploads

**Check region** - Use region closest to Laravel Cloud deployment

### High Costs

**Enable CloudFront/CDN** - Cache images at edge locations

## CDN Setup (Recommended for Production)

### With AWS CloudFront

1. Create CloudFront distribution pointing to S3 bucket
2. Update `AWS_URL` to CloudFront domain
3. Enable caching with long TTL (1 year for avatars)

```env
AWS_URL=https://d111111abcdef8.cloudfront.net
```

### With Cloudflare

If using Cloudflare R2, CDN is included free!

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use IAM roles** if possible (future Laravel Cloud feature)
3. **Enable bucket versioning** - Recover accidentally deleted avatars
4. **Set up lifecycle rules** - Auto-delete old/unused files
5. **Monitor access logs** - Detect unusual activity

## Support

- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Laravel Filesystem**: https://laravel.com/docs/filesystem
- **Laravel Cloud**: https://cloud.laravel.com/docs

---

## Quick Start (Recommended: Cloudflare R2)

For the best balance of cost and performance:

1. **Create R2 bucket** at Cloudflare
2. **Generate API token**
3. **Set environment variables** in Laravel Cloud:
   ```env
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_DEFAULT_REGION=auto
   AWS_BUCKET=veltro-avatars
   AWS_ENDPOINT=https://xxx.r2.cloudflarestorage.com
   AWS_URL=https://avatars.veltro.app
   ```
4. **Deploy and test!**

**You're done!** Avatars will now be stored in the cloud with zero egress fees. 🎉
