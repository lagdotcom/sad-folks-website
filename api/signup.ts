import { kv } from '@vercel/kv';

const emailPattern = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/;
const mailingListKey = 'mailing-list';

export async function GET(req: Request) {
  const url = new URL(req.url);

  const name = url.searchParams.get('name');
  if (!name) return new Response('Missing ?name', { status: 400 });

  const email = url.searchParams.get('email')
  if (!email) return new Response('Missing ?email', { status: 400 });
  if (!emailPattern.test(email)) return new Response('Invalid ?email', { status: 400 });

  await kv.hset(mailingListKey, { [email]: name })

  return new Response('OK');
}
