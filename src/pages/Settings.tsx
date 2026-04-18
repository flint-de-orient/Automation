import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChannelIcon } from "@/components/ChannelIcon";
import { Channel, channelMeta } from "@/data/mockLeads";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const channels: Channel[] = ["whatsapp", "facebook", "instagram", "email"];

export default function Settings() {
  const [connected, setConnected] = useState<Record<Channel, boolean>>({
    whatsapp: true,
    facebook: true,
    instagram: false,
    email: true,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, channels and notifications.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar name="Alex Chen" color="from-violet-400 to-fuchsia-500" size={64} />
          <div>
            <p className="font-semibold">Alex Chen</p>
            <p className="text-sm text-muted-foreground">Admin · admin@unibox.app</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Profile updated");
          }}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" defaultValue="Alex Chen" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="admin@unibox.app" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="bg-gradient-primary text-primary-foreground">
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <h2 className="text-lg font-semibold">Channel integrations</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your business accounts to sync leads automatically.
        </p>
        <ul className="mt-4 divide-y divide-border">
          {channels.map((c) => {
            const meta = channelMeta[c];
            const isOn = connected[c];
            return (
              <li key={c} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", meta.bg)}>
                    <ChannelIcon channel={c} className={cn("h-5 w-5", meta.color)} />
                  </span>
                  <div>
                    <p className="font-semibold">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOn ? "Connected and syncing" : "Not connected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOn && <Badge variant="secondary" className="hidden sm:inline-flex">Active</Badge>}
                  <Switch
                    checked={isOn}
                    onCheckedChange={(v) => {
                      setConnected((prev) => ({ ...prev, [c]: v }));
                      toast.success(`${meta.label} ${v ? "connected" : "disconnected"}`);
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <ul className="mt-4 space-y-4">
          {[
            { id: "n1", label: "Email me when a new lead arrives", def: true },
            { id: "n2", label: "Desktop push for assigned conversations", def: true },
            { id: "n3", label: "Weekly performance digest", def: false },
          ].map((n) => (
            <li key={n.id} className="flex items-center justify-between">
              <Label htmlFor={n.id} className="text-sm font-normal">{n.label}</Label>
              <Switch id={n.id} defaultChecked={n.def} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
