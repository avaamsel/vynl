// GET "api/playlist"
export async function GET(req: Request) {
    console.log('here playlist');
    console.log(req);
    return new Response("Yay", {
        status: 200
    });
}

// PUT "api/pliaylist/:id"
export async function PUT(req: Request) {

}