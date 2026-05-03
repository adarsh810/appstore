import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function takeScreenshot(url: string): Promise<Buffer | null> {
  try {
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${url}`;
    const res = await fetch(screenshotUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-vercel-signature');

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Only handle production deployments that succeeded
  if (body.type !== 'deployment.succeeded') return NextResponse.json({ ok: true });
  if (body.payload?.target !== 'production') return NextResponse.json({ ok: true });

  const deployment = body.payload?.deployment;
  if (!deployment) return NextResponse.json({ ok: true });

  const projectName: string = body.payload?.project?.name ?? deployment.name ?? 'Untitled';
  // Use the first alias (custom domain) if available, otherwise deployment URL
  const aliases: string[] = deployment.alias ?? [];
  const appUrl = aliases.length > 0
    ? `https://${aliases[0]}`
    : `https://${deployment.url}`;
  const description: string = deployment.meta?.githubCommitMessage ?? '';

  // Skip if app with this name already exists — just update the URL + screenshot
  const { data: existing } = await supabase
    .from('apps')
    .select('id')
    .eq('name', projectName)
    .maybeSingle();

  // Take screenshot
  const imgBuffer = await takeScreenshot(appUrl);
  let screenshotUrl: string | null = null;

  if (imgBuffer) {
    const fileName = `webhook-${Date.now()}-${projectName.replace(/[^a-z0-9]/gi, '-')}.png`;
    const { error: uploadErr } = await supabase.storage
      .from('screenshots')
      .upload(fileName, imgBuffer, { contentType: 'image/png', upsert: false });
    if (!uploadErr) {
      const { data } = supabase.storage.from('screenshots').getPublicUrl(fileName);
      screenshotUrl = data.publicUrl;
    }
  }

  if (existing) {
    await supabase
      .from('apps')
      .update({ url: appUrl, ...(screenshotUrl ? { screenshot_url: screenshotUrl } : {}) })
      .eq('id', existing.id);
    return NextResponse.json({ ok: true, action: 'updated', id: existing.id });
  }

  const { data, error } = await supabase
    .from('apps')
    .insert({ name: projectName, url: appUrl, description, screenshot_url: screenshotUrl, rating: 'good', tags: [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, action: 'created', id: data.id });
}
