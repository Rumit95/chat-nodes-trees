## Goal

Publish a single post about **Chat Nodes** to your LinkedIn ("Rumit's LinkedIn"), with your demo video attached. No app UI changes — this is a one-time action run through the LinkedIn connector gateway.

## What I need from you

- **The demo footage**: upload the video file in chat (MP4 recommended, under 20MB per upload). I'll attach it to the post.

## Proposed post copy

> Excited to share something I've been building: **Chat Nodes** 🧠
>
> It's a conversational AI interface with a twist — instead of losing context in long threads, you can highlight any part of a reply and spin off a focused "side quest" Q&A that stays grounded in the original passage.
>
> ✨ Highlights:
> • AI chat with full Markdown rendering
> • Text annotations / nested side-quest threads
> • An interactive knowledge graph that visualizes conversations as a node network
> • Global search across every annotation
>
> Built with TanStack Start, React, and Lovable AI.
>
> Try it out 👉 https://chat-nodes-trees.lovable.app
>
> #AI #React #TanStackStart #BuildInPublic #Lovable

(Tweak any wording before I post.)

## Steps

1. **Link the LinkedIn connection** ("Rumit's LinkedIn") to this project so its gateway credentials are available.
2. **Verify scope** — confirm the connection has `w_member_social` (required to publish member posts + video). If missing, I'll prompt you to reconnect and grant it.
3. **Get author URN** via `GET v2/userinfo` through the gateway.
4. **Upload the video** through the LinkedIn video/assets upload flow via the gateway:
   - Register the upload (`assets?action=registerUpload` / images-video API) to get an upload URL + asset URN.
   - Upload your footage bytes to that URL.
5. **Publish the post** via the UGC/posts API referencing the uploaded video asset, with the copy above.
6. **Confirm** the post was created and share the result.

## Technical notes

- All calls go through the Lovable connector gateway (`https://connector-gateway.lovable.dev/linkedin/...`) with `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${LINKEDIN_API_KEY}` headers — no direct LinkedIn API/SDK calls.
- The video must finish LinkedIn-side processing before the post is created; I'll poll asset status if needed.
- This is a throwaway script run during build; no permanent server functions, routes, or UI are added to the app.
- LinkedIn limits: video should be MP4, ideally short for a demo. If your file exceeds the 20MB chat upload limit, let me know and we'll find an alternative path.
