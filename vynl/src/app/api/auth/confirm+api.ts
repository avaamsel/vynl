import { createServerClient, parseCookieHeader, serializeCookieHeader  } from '@supabase/ssr';
import type { SerializeOptions } from "cookie";
import { type EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseClientFromRequest } from '../../../lib/supabaseServer'
import { createSupabaseClient } from '../../../server/supabase';

// export async function GET(req: Request) {
//     console.log('HERE SERVER');
//     const url = new URL(req.url);
//     const token_hash = url.searchParams.get('token_hash');
//     const type = url.searchParams.get('type') as EmailOtpType | null;
//     const next = url.searchParams.get('next') ?? "/";
//     const headers = new Headers();

//     if (!(token_hash && type)) return Response.redirect('/auth/auth-code-error', 303);
    
//     const supabase = createSupabaseClient(req);
    
//     const { error } = await supabase.auth.verifyOtp({
//         type,
//         token_hash,
//     })
//     if (!error) {
//         return Response.redirect(`/${next.slice(1)}`, 303);
//     }
    
//     // return the user to an error page with some instructions
//     return Response.redirect('/auth/auth-code-error', 303);
// }
