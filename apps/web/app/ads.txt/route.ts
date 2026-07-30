// AdSense審査通過後、発行されたpublisher IDに差し替える（docs/ops-notes.md参照）
// 例: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
const ADS_TXT_CONTENT = process.env.ADS_TXT_CONTENT ?? "";

export function GET() {
  return new Response(ADS_TXT_CONTENT, {
    headers: { "Content-Type": "text/plain" },
  });
}
