// Multiplayer relay endpoint (Temple Play).
// Default = current cloudflared quick tunnel. The VPS auto-sync script
// (qtunnel-rialo) rewrites this line when the tunnel URL rotates.
// Override at build time with VITE_WS_URL (e.g. ws://localhost:2568 locally).
export const WS_URL: string =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  'wss://remarkable-pennsylvania-technique-evans.trycloudflare.com'
