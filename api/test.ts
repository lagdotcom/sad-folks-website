export function GET(_req: Request) {
  return new Response(`Hello from ${process.env.VERCEL_REGION}`);
}
