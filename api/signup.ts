import { kv } from '@vercel/kv';

const emailPattern = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/;
const mailingListKey = 'mailing-list';

export async function POST(req: Request) {
  const { name, email } = await req.json();
  
  if (!email) return new Response('Missing email', { status: 400 });
  if (!emailPattern.test(email)) return new Response('Invalid email', { status: 400 });

  await kv.hset(mailingListKey, { [email]: name || email })

  return new Response('OK');
}

export const config = {
  runtime: 'edge',
};
