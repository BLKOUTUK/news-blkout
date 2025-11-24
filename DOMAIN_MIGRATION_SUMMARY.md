# BLKOUTUK.COM Domain Configuration Summary

## Strategy: DNS Pointer (No Domain Transfer)

Instead of transferring the domain from WordPress hosting to a new registrar, we're using DNS A records to point the domain to Vercel while keeping the registration at the current provider.

---

## Quick Reference

### DNS Records Required

| Type  | Name | Value                | Purpose                      |
|-------|------|----------------------|------------------------------|
| A     | @    | 76.76.21.21         | Points blkoutuk.com to Vercel |
| CNAME | www  | cname.vercel-dns.com | Points www subdomain to Vercel |
| A     | legacy | [WP Hosting IP]    | Points WordPress subdomain (optional) |

---

## Implementation Order

1. ✅ **Add domain in Vercel** (Settings → Domains)
2. ✅ **Configure A record** at domain registrar (@ → 76.76.21.21)
3. ✅ **Configure CNAME** for www subdomain
4. ⏳ **Wait for DNS propagation** (5-30 minutes)
5. ✅ **Verify SSL** auto-provisioned by Vercel
6. 🔄 **Optional:** Move WordPress to subdomain (legacy.blkoutuk.com)

---

## Current Status

- **Main Domain:** blkoutuk.com
- **React Platform:** Deployed on Vercel (blkout-community-platform.vercel.app)
- **WordPress Site:** Currently at blkoutuk.com (will need subdomain migration)
- **Vercel IP:** 76.76.21.21 (Anycast)

---

## Next Steps

### Immediate (Before DNS Change):
1. Back up WordPress site completely
2. Note WordPress hosting IP address
3. Document important WordPress URLs for redirects

### During Migration:
1. Update DNS A record to point to Vercel
2. Add www CNAME to Vercel
3. Configure legacy.blkoutuk.com for WordPress (optional)

### After Migration:
1. Update WordPress URLs to legacy.blkoutuk.com
2. Create redirects in vercel.json for old content
3. Update Google Search Console
4. Monitor for broken links

---

## Key Benefits of This Approach

✅ **No domain transfer fees or waiting period**
✅ **Keep existing registrar relationship**
✅ **Simpler rollback** (just change DNS back)
✅ **No registrar account migration**
✅ **Faster implementation** (no 5-7 day transfer wait)

---

## Rollback Plan

If issues arise, simply:
1. Change A record back to WordPress hosting IP
2. Remove domain from Vercel project
3. Wait 30 minutes for DNS propagation
4. Original WordPress site restored

---

## Support Documentation

- Full Vercel Setup Guide: `/tmp/vercel-domain-setup.md`
- WordPress Migration Guide: `/tmp/wordpress-subdomain-migration.md`
- DNS Propagation Checker: https://whatsmydns.net
- Vercel Docs: https://vercel.com/docs/custom-domains

---

**Created:** 2025-10-10
**Strategy:** DNS A Record Configuration (No Transfer)
**Platform:** Vercel
**Domain:** blkoutuk.com
