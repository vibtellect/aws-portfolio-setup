# static-site-cloudfront-s3-oac – Kurz

Zweck
- Statische Website via S3 (privat) + CloudFront (OAC), optional Logging/WAF

Wann verwenden
- Websites, SPAs, statische Inhalte (günstig & schnell)

Voraussetzungen
- CDK v2, Node 18+, gültiges Zertifikat (ACM, us-east-1 für CloudFront-SSL)

Einbindung
1) Ordner nach src/constructs/static-site-cloudfront-s3-oac kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { StaticSiteCloudFrontS3Oac } from "./constructs/static-site-cloudfront-s3-oac";
// new StaticSiteCloudFrontS3Oac(this, "Site", {
//   domainName: "example.com",
//   aliases: ["www.example.com"],
//   certificateArn: "arn:aws:acm:us-east-1:...:certificate/...",
//   enableWaf: false,
// });
```

Props
- domainName?: string, aliases?: string[]
- certificateArn?: string (us-east-1)
- loggingBucket?: Bucket, enableWaf?: boolean

Outputs
- distributionDomainName, bucketName

Defaults
- S3 privat + OAC, Block Public Access, Logs optional
