import { createSupabaseClientFromRequest } from "../../../lib/supabaseServer";

// GET "api/playlist"
export async function GET(req: Request, { id }: Record<string, string>) {
    const auth = req.headers.get('Authorization');
    if (!auth || auth.split(" ").length < 2) {
        return new Response('Missing Authorization Header', {
            status: 403
        });
    }

    const supabase = createSupabaseClientFromRequest(req);

    const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.log("Error fetching playlist:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 404 })
    }

    console.log("Fetched playlist:", data);
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
}
