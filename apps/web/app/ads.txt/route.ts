// ads.txtの内容はpublic情報(秘密情報ではない)なので直接ハードコードしている
const ADS_TXT_CONTENT = "google.com, pub-5921153595051694, DIRECT, f08c47fec0942fa0";

export function GET() {
  return new Response(ADS_TXT_CONTENT, {
    headers: { "Content-Type": "text/plain" },
  });
}
