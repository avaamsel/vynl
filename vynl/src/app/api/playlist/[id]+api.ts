// GET "api/playlist"
export async function GET(req: Request, { id }: Record<string, string>) {
    const auth = req.headers.get('Authorization');
    if (!auth || auth.split(" ").length < 2) {
        return new Response('Missing Authorization Header', {
            status: 403
        });
    }
    const access_token = auth.split(" ")[1];
    console.log('here id playlist');
    console.log(id);
    return new Response("Yay", {
        status: 200
    });
}
