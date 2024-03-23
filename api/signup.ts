import { kv } from '@vercel/kv';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email')
  if (!email) return new Response('Missing ?email', { status: 400 });

  await kv.sadd('mailing-list', email);

  return new Response(undefined, { status: 204 });
}
