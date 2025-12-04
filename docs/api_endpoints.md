# API Documentation 

This documentation describes the API that serves the Vynl mobile app. The backend system of Vynl handles data passage between from the database and getting song recommendations to the user. We have broken up our API into two primary routes, `user` and `playlist`. We use supabase's access tokens to verify user idenity so we do not have any authenication middleware.

## User Endpoints

### `GET 'api/user/:id'`

**Description:** Given a user's access token and id, returns the user information associated with that user.

### `PUT 'api/user/:id'`

**Description:** Given a user's access token and id and information to update, updates the user's metadata.

## Playlist Endpoints

### `GET 'api/playlist?party=true/false'`

**Description:** Get all the playlist for a user. Requires user's access token in header. Returns a list of playlist objects that contains a list of songs in order.

**Example Request:**

*URL:* 'api/playlist'

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
    [
        {
            "id": 1, 
            "name": "First Playlist", 
            "created_at": "2025-11-06T07:34:50.276674+00:00", 
            "user_id": "16f69cd8-8a2d-4be5-8876-a518756ee7b8", 
            "songs": [
                {"song_id": 1, "title": "Unknown/Nth", "artist": "Hozier", "duration_sec": 10},
                {"song_id": 4, "title": "Like Real People Do", "artist": "Hozier", "duration_sec": 682},
                {"song_id": 3, "title": "Bathroom Light", "artist": "Mt. Joy", "duration_sec": 152}
            ]
        },
        {
            "id": 7, 
            "name": "Workout Music", 
            "created_at": "2025-10-23T03:56:23.00000+00:00", 
            "user_id": "16f69cd8-8a2d-4be5-8876-a518756ee7b8", 
            "songs": [
                {"song_id": 8, "title": "Love Story", "artist": "Taylor Swift", "duration_sec": 210},
                {"song_id": 23, "title": "Somebody You Used To Know", "artist": "Goyte", "duration_sec": 170},
                {"song_id": 145, "title": "Party In The USA", "artist": "Miley Crius", "duration_sec": 130}
            ]
        },
    ]
}
```

### `GET 'api/playlist/:id'`

**Description:** Get a playlist object owned by the user given its id. Requires user's access token and a playlist id, returns a playlist object with all the songs in the playlist.

**Example Request:**

*URL:* 'api/playlist/1'

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
    "id": 1, 
    "name": "First Playlist", 
    "created_at": "2025-11-06T07:34:50.276674+00:00", 
    "user_id": "16f69cd8-8a2d-4be5-8876-a518756ee7b8", 
    "songs": [
        {"song_id": 1, "title": "Unknown/Nth", "artist": "Hozier", "duration_sec": 10},
        {"song_id": 4, "title": "Like Real People Do", "artist": "Hozier", "duration_sec": 682},
        {"song_id": 3, "title": "Bathroom Light", "artist": "Mt. Joy", "duration_sec": 152}
    ]
}
```

### `DELETE 'api/playlist/:id`

**Description:** Deletes a playlist. Calling user must own the playlist.

### `PUT 'api/playlist/:id'`

**Description:** Update a playlist with a new list of songs and/or a new name. Requires user's access token, a playlist id, and a playlist object in the body. Created at time, user id, and playlist id will not be updated even if passed object's differ. Returns the old playlist object in json of response.

**Example Request:**

*URL:* 'api/playlist/1'

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*
```json
{
    "id": 42, 
    "name": "Updated Name", 
    "created_at": "2025-11-06T07:34:50.276674+00:00", 
    "user_id": "16f69cd8-8a2d-4be5-8876-a518756ee7b8", 
    "songs": [
        {"song_id": 4, "title": "Like Real People Do", "artist": "Hozier", "duration_sec": 682},
        {"song_id": 1, "title": "Unknown/Nth", "artist": "Hozier", "duration_sec": 10},
        {"song_id": 8, "title": "Love Story", "artist": "Taylor Swift", "duration_sec": 210}
    ]
}
```

**Example Response:**
```json
{
    "id": 1, 
    "name": "First Playlist", 
    "created_at": "2025-11-06T07:34:50.276674+00:00", 
    "user_id": "16f69cd8-8a2d-4be5-8876-a518756ee7b8", 
    "songs": [
        {"song_id": 1, "title": "Unknown/Nth", "artist": "Hozier", "duration_sec": 10},
        {"song_id": 4, "title": "Like Real People Do", "artist": "Hozier", "duration_sec": 682},
        {"song_id": 3, "title": "Bathroom Light", "artist": "Mt. Joy", "duration_sec": 152}
    ]
}
```
*Note: id was not updated in this example.*

### `PUT 'api/playlist/add/:id'`

**Description:** Adds a song to the playlist. Calling user must be owner of playlist or linked to the playlist in party mode.

### `POST 'api/playlist'`

**Description:** Creates a playlist that contains a given set of songs. Requires user's access token to be passed and a playlist object. Created at and playlist id will be ignored when creating the playlist, songs will be added to the songs table if not already in there. Will return the filled out playlist object.

**Example Request:**

*URL:* 'api/playlist'

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*
```json
{
    "id": 0, 
    "name": "Updated Name", 
    "created_at": "", 
    "user_id": "", 
    "songs": [
        {"song_id": 4, "title": "Like Real People Do", "artist": "Hozier", "duration_sec": 682},
        {"song_id": 1, "title": "Unknown/Nth", "artist": "Hozier", "duration_sec": 10},
        {"song_id": 8, "title": "Love Story", "artist": "Taylor Swift", "duration_sec": 210}
    ]
}
```

**Example Response:**
```json
{
    "id": 4, 
    "name": "Updated Name", 
    "created_at": "2025-11-06T07:34:50.276674+00:00", 
    "user_id": "16f69cd8-8a2d-4be5-8876-a518756ee7b8", 
    "songs": [
        {"song_id": 4, "title": "Like Real People Do", "artist": "Hozier", "duration_sec": 682},
        {"song_id": 1, "title": "Unknown/Nth", "artist": "Hozier", "duration_sec": 10},
        {"song_id": 8, "title": "Love Story", "artist": "Taylor Swift", "duration_sec": 210}
    ]
}
```

### `GET 'api/playlist/recommendation/:id?amount=amount'`

**Description:** Get a list of somg recommendation based on the songs in a given playlist that is owned by the user. Requires user's access token and playlist id. Optional query parameter `amount` to determine the amount of songs to return, defaults to 10 if not given.


### `PUT 'api/playlist/party/link/:code'`

**Description:** Links a user to a party mode playlist by taking in the party code. Once a user is linked to a playlist they can then called get playlist by the playlist's id and add songs to the playlist (Using add endpoint). Additionally, upon this user calling get all playlist once being linked, the linked playlist will also be returned. This endpoint returns the playlist's current state.

### `PUT 'api/playlist/party/unlink/:id'`

**Description:** Unlinks a user from a playlist, making it so they cannot call get on that playlist or add songs to it. Returns nothing.

### `PUT 'api/playlist/party/toggle/:id`

**Description:** Enables party mode on a given playlist's id. The calling user must own the playlist. Returns the party code.
