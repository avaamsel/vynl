# API Documentation 

This documentation describes the API that serves the Vynl mobile app. The backend system of Vynl handles data passage between from the database and getting song recommendations to the user. We have broken up our API into two primary routes, `user` and `playlist`. We use supabase's access tokens to verify user idenity so we do not have any authenication middleware.

## User Endpoints

### `GET 'api/user/:id'`

**Description:** Given a user's access token and id, returns the user information associated with that user.

### `PUT 'api/user/:id'`

**Description:** Given a user's access token and id and information to update, updates the user's metadata.

## Playlist Endpoints

### `GET 'api/playlist'`

**Description:** Get all the playlist for a user. Requires user's access token in header.

### `GET 'api/playlist/:id'`

**Description:** Get a playlist object owned by the user given its id. Requires user's access token and a playlist id, returns a playlist object with all the songs in the playlist.

### `PUT 'api/playlist/:id'`

**Description:** Update a playlist with a new list of songs. Requires user's access token, a playlist id, and a list of songs.

### `CREATE 'api/playlist'`

**Description:** Creates a playlist that contains a given set of songs. Requires user's access token to be passed and a list of seed songs for the playlist to contain.

### `GET 'api/playlist/recommendation/:id?amount=amount'`

**Description:** Get a list of somg recommendation based on the songs in a given playlist that is owned by the user. Requires user's access token and playlist id. Optional query parameter `amount` to determine the amount of songs to return, defaults to 10 if not given.

