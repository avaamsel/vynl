import { createServerClient, parseCookieHeader, serializeCookieHeader  } from '@supabase/ssr';
import type { SerializeOptions } from "cookie";
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const token_hash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type') as EmailOtpType | null;
    const next = url.searchParams.get('next') ?? "/";
    const headers = new Headers();

    if (token_hash && type) {
        const supabase = createServerClient(
            process.env.EXPO_PUBLIC_SUPABASE_URL!,
            process.env.EXPO_PUBLIC_SUPABASE_KEY!,
            {
                cookies: {
                getAll(): { name: string, value: string}[] | null {
                    return parseCookieHeader(req.headers.get('Cookie') ?? '')
                    .filter((cookie): cookie is { name: string, value: string } => cookie.value !== null && cookie.value !== undefined);
                },
                setAll(cookiesToSet: {name: string, value: string, options: SerializeOptions}[]) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
                    )
                },
                },
            }
    )
    const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
    })
    if (!error) {
        return Response.redirect(`/${next.slice(1)}`, 303);
    }
    }
    // return the user to an error page with some instructions
    return Response.redirect('/auth/auth-code-error', 303);
}
