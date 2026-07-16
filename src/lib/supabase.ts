import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase realtime disabled: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);


/* DEVELOPMENT UTILITY BLOCK
 if (import.meta.env.DEV) {
 console.info("[realtime] config", {
   url: supabaseUrl ? "set" : "missing",
   key: supabaseAnonKey ? "set" : "missing",
   enabled: isSupabaseConfigured,
 });

   type DevWindow = Window & {
     __supabase?: typeof supabase;
     __testRealtime?: (
       channelName: string,
       event: string,
       payload?: unknown
     ) => Promise<string>;
   };
 
   const win = window as DevWindow;
   win.__supabase = supabase;

   win.__testRealtime = (channelName, event, payload = {}) =>
     new Promise((resolve, reject) => {
       const existing = supabase
         .getChannels()
         .find((c) => c.subTopic === channelName);
 
       const send = (ch: ReturnType<typeof supabase.channel>) => {
         ch.send({ type: "broadcast", event, payload })
           .then(resolve)
           .catch(reject);
       };
 
       if (existing) {
         send(existing);
         return;
       }
 
       const ch = supabase.channel(channelName, {
         config: { broadcast: { self: true } },
       });
       ch.subscribe((status) => {
         if (status === "SUBSCRIBED") send(ch);
         if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
           reject(new Error(`subscribe failed: ${status}`));
         }
       });
     });
 }*/
