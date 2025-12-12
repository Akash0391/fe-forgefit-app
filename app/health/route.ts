export function GET() {
  return Response.json({ status: "ok", frontend: true, timestamp: Date.now() });
}
