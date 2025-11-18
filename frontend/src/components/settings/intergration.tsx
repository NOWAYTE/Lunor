"use client";

import { useEffect, useState, useRef } from "react";
import { useIntegration } from "~/hooks/settings/use-setting";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import TextInput from "../ui/textInput";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import { ServerInput } from "../ui/serverInput";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";

export default function Integration() {
  const {
    open,
    openModal,
    closeModal,
    register,
    onSubmit,
    errors,
    loading,
    watch,
    setValue,
  } = useIntegration();

  const [servers, setServers] = useState<string[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchCache, setSearchCache] = useState<Record<string, { servers: string[]; platform?: string | null; brokers?: string[] }>>({});

  useEffect(() => {
    register("server");
    register("brokerName");
    register("platform");
    register("accountNumber");
    register("password");
    // register("region"); // if applicable
  }, [register]);

  useEffect(() => {
    const q = watch("server")?.trim();
    if (!q || q.length < 2) return;
    const id = setTimeout(() => {
      handleServerSearch();
    }, 300);
    return () => clearTimeout(id);
  }, [watch("server")]);

  const handleServerSearch = async () => {
    const query = watch("server")?.trim();
    if (!query) return;

    const key = query.toLowerCase();
    const cached = searchCache[key];
    // only set default values if not yet filled by user
    if (!watch("platform") && cached?.platform) {
      setValue("platform", String(cached.platform).toLowerCase());
    }
    if (!watch("brokerName") && Array.isArray(cached?.brokers) && cached?.brokers[0]) {
      setValue("brokerName", String(cached.brokers[0]));
    }
    // never overwrite server input


    setSearching(true);
    try {
      const res = await fetch(`/api/broker?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.ok) {
        const nextServers = Array.isArray(data.servers) ? data.servers : [];
        setServers(nextServers);
        if (data.platform) setValue("platform", String(data.platform).toLowerCase());
        if (Array.isArray(data.brokers) && !watch("brokerName")) {
          setValue("brokerName", String(data.brokers[0] ?? ""));
        }
        setSearchCache((prev) => ({
          ...prev,
          [key]: { servers: nextServers, platform: data.platform ?? null, brokers: data.brokers },
        }));
      } else {
        setServers([]);
        setSearchCache((prev) => ({ ...prev, [key]: { servers: [] } }));
      }
    } catch {
      setServers([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-2">
          <div className="flex flex-col">
            <h1 className="text-lg font-medium text-[#F7ECE9]">Add Account</h1>
            <p className="text-muted-foreground text-xs">
              Add your trading account to start tracking your portfolio.
            </p>
          </div>
          <Button onClick={openModal}>Add Account</Button>
        </div>
      </div>

      {open && (
        <Dialog open={open} onOpenChange={closeModal}>
          <DialogContent className="w-full max-w-3xl p-6 rounded-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Connect Broker Account</DialogTitle>
            </DialogHeader>

            <form onSubmit={onSubmit} className="flex flex-col gap-6 mt-4">
              {/* All inputs in the same responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 items-start justify-start content-start">
                <div className="max-w-sm w-full">
                  <ServerInput
                    label="Server"
                    servers={servers}
                    value={watch("server") ?? ""}
                    onChange={(val) => setValue("server", val)}
                    onSearch={handleServerSearch}
                    loading={searching}
                  />
                  {errors.server && (
                    <p className="text-destructive text-sm mt-1">{errors.server.message}</p>
                  )}
                </div>

                <div className="max-w-sm w-full">
                  <TextInput
                    label="Broker Name"
                    placeholder="Broker Name"
                    value={watch("brokerName") ?? ""}
                    onChange={(val) => setValue("brokerName", val)}
                  />
                </div>

                <div className="max-w-sm w-full">
                  <label className="text-sm font-medium mb-1 text-gray-300 block">Platform</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full bg-[#1E1E1E] border-none border-b border-gray-400 focus:border-white outline-none px-2 py-1 text-gray-100 flex items-center justify-between"
                      >
                        <span>
                          {(() => {
                            const p = (watch("platform") ?? "").toLowerCase();
                            if (p === "mt4") return "MT4";
                            if (p === "mt5") return "MT5";
                            return "Select platform";
                          })()}
                        </span>
                        <FaChevronDown className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[12rem] text-gray-100 border border-gray-700">
                      <DropdownMenuItem onClick={() => setValue("platform", "mt4")}>MT4</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setValue("platform", "mt5")}>MT5</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="max-w-sm w-full">
                  <TextInput
                    label="Account Number"
                    placeholder="Account Number"
                    value={watch("accountNumber") ?? ""}
                    onChange={(val) => setValue("accountNumber", val)}
                    
                  />
                </div>

                <div className="max-w-sm w-full">
                  <TextInput
                    label="Password"
                    placeholder="MetaTrader password"
                    type="password"
                    value={watch("password") ?? ""}
                    onChange={(val) => setValue("password", val)}
                    
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Connecting..." : "Connect"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}