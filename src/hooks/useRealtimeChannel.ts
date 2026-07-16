import { useEffect, useId, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Handlers = Record<string, (payload: unknown) => void>;

interface Subscriber {
  handlersRef: React.MutableRefObject<Handlers>;
  onSubscribedRef: React.MutableRefObject<(() => void) | undefined>;
}

interface ChannelEntry {
  channel: RealtimeChannel;
  refCount: number;
  subscribers: Map<string, Subscriber>;
}

const channelRegistry = new Map<string, ChannelEntry>();

function dispatchEvent(channelName: string, event: string, payload: unknown) {
  const entry = channelRegistry.get(channelName);
  if (!entry) return;
  for (const { handlersRef } of entry.subscribers.values()) {
    handlersRef.current[event]?.(payload);
  }
}

function notifySubscribed(channelName: string) {
  const entry = channelRegistry.get(channelName);
  if (!entry) return;
  for (const { onSubscribedRef } of entry.subscribers.values()) {
    onSubscribedRef.current?.();
  }
}

function acquireChannel(channelName: string, subscriberId: string, subscriber: Subscriber) {
  let entry = channelRegistry.get(channelName);

  if (!entry) {
    const channel = supabase
      .channel(
        channelName,
        import.meta.env.DEV ? { config: { broadcast: { self: true } } } : undefined
      )
      .on("broadcast", { event: "*" }, (message) => {
        dispatchEvent(channelName, message.event, message.payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          notifySubscribed(channelName);
        }
      });

    entry = { channel, refCount: 0, subscribers: new Map() };
    channelRegistry.set(channelName, entry);
  }

  entry.refCount++;
  entry.subscribers.set(subscriberId, subscriber);

  if (entry.channel.state === "joined") {
    queueMicrotask(() => subscriber.onSubscribedRef.current?.());
  }
}

function releaseChannel(channelName: string, subscriberId: string) {
  const entry = channelRegistry.get(channelName);
  if (!entry) return;

  entry.subscribers.delete(subscriberId);
  entry.refCount--;

  if (entry.refCount <= 0) {
    void supabase.removeChannel(entry.channel);
    channelRegistry.delete(channelName);
  }
}

export function useRealtimeChannel(
  channelName: string | null,
  handlers: Handlers,
  options?: { onSubscribed?: () => void }
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const onSubscribedRef = useRef(options?.onSubscribed);
  onSubscribedRef.current = options?.onSubscribed;

  const subscriberId = useId();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) {
        console.warn("[realtime] skipped — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set");
      }
      return;
    }
    if (!channelName) return;

    const subscriber: Subscriber = { handlersRef, onSubscribedRef };
    acquireChannel(channelName, subscriberId, subscriber);

    return () => {
      releaseChannel(channelName, subscriberId);
    };
  }, [channelName, subscriberId]);
}
