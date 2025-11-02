import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { SerializeOptions } from "cookie";

export function createSupabaseClientFromRequest(req: Request, headers?: Headers) {
    const auth = req.headers.get('Authorization')
    const access_token = auth?.split(' ')[1] || ''

    const supabase = createServerClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_KEY!,
        {
        cookies: {
            getAll() {
                return parseCookieHeader(req.headers.get('Cookie') ?? '')
                    .filter((cookie): cookie is { name: string, value: string } => cookie.value !== null && cookie.value !== undefined);
            },
            setAll(cookiesToSet: { name: string; value: string; options: SerializeOptions }[]) {
                if (!headers) return
                cookiesToSet.forEach(({ name, value, options }) =>
                    headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
                )
            }
            },
            global: {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            }
        }
    )

    return supabase
}
