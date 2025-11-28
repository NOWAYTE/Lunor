"use client";

import { useEffect, useState, useRef } from "react";
import { useIntegration } from "~/hooks/settings/use-setting";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import TextInput from "../ui/textInput";
import { FaChevronDown } from "react-icons/fa";
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

  // --- STATE AND REFS ---
  const [servers, setServers] = useState<string[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchCache, setSearchCache] = useState<Record<string, { servers: string[]; platform?: string | null; brokers?: string[] }>>({}); 

  // FIX: Declared missing variables
  const serverQuery = watch("server");
  const lastRequestTime = useRef<number>(0);

  // --- EFFECTS ---
  useEffect(() => {
    register("server");
    register("brokerName");
    register("platform");
    register("accountNumber");
    register("password");
  }, [register]);

  useEffect(() => {
    const q = serverQuery?.trim();
    
    // Clear servers if query is too short or empty
    if (!q || q.length < 2) {
      setServers([]); 
      return;
    }

    // Debounce the API call
    const id = setTimeout(() => {
      handleServerSearch(q);
    }, 300);

    return () => clearTimeout(id);
  }, [serverQuery]); 

  // --- HANDLER ---
  const handleServerSearch = async (query: string) => {
    const key = query.toLowerCase();
    
    // 1. Check Cache
    const cached = searchCache[key];
    if (cached) {
      setServers(cached.servers || []);
      
      // FIX: Check if the current value is the DEFAULT "MT4" or empty before overwriting
      const currentPlatform = watch("platform");
      if ((!currentPlatform || currentPlatform.toUpperCase() === "MT4") && cached.platform) {
         setValue("platform", String(cached.platform).toLowerCase());
      }
      
      if (!watch("brokerName") && Array.isArray(cached.brokers) && cached.brokers[0]) {
        setValue("brokerName", String(cached.brokers[0]));
      }
      return; 
    }

    // 2. Prepare Network Request
    setSearching(true);
    const requestTime = Date.now();
    lastRequestTime.current = requestTime;

    try {
      const res = await fetch(`/api/broker?q=${encodeURIComponent(query)}`);
      
      // 3. RACE CONDITION CHECK: If a newer request started while we were waiting, ignore this result.
      if (requestTime !== lastRequestTime.current) return;

      const data = await res.json();
      
      if (data.ok) {
        const nextServers = Array.isArray(data.servers) ? data.servers : [];
        setServers(nextServers);

        // FIX: Allow overwriting if current is just the default "MT4"
        const currentPlatform = watch("platform");
        if (data.platform && (!currentPlatform || currentPlatform.toUpperCase() === "MT4")) {
            setValue("platform", String(data.platform).toLowerCase());
        }

        if (Array.isArray(data.brokers) && !watch("brokerName")) {
          setValue("brokerName", String(data.brokers[0] ?? ""));
        }

        setSearchCache((prev) => ({
          ...prev,
          [key]: { servers: nextServers, platform: data.platform ?? null, brokers: data.brokers },
        }));
      } else {
        setServers([]);
      }
    } catch (error) {
      console.error("Search failed", error);
      setServers([]);
    } finally {
      // Only turn off loading if this was the last request
      if (requestTime === lastRequestTime.current) {
        setSearching(false);
      }
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 items-start justify-start content-start">
                
                {/* SERVER INPUT */}
                <div className="max-w-sm w-full">
                  <ServerInput
                    label="Server"
                    servers={servers}
                    value={watch("server") ?? ""}
                    onChange={(val) => setValue("server", val, { shouldValidate: true })}
                    onSearch={() => handleServerSearch(watch("server") || '')}
                    loading={searching}
                  />
                  {errors.server && (
                    <p className="text-destructive text-sm mt-1">{errors.server.message}</p>
                  )}
                </div>

                {/* BROKER NAME */}
                <div className="max-w-sm w-full">
                  <TextInput
                    label="Broker Name"
                    placeholder="Broker Name"
                    value={watch("brokerName") ?? ""}
                    onChange={(val) => setValue("brokerName", val)}
                  />
                </div>

                {/* PLATFORM SELECT */}
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

                {/* ACCOUNT NUMBER */}
                <div className="max-w-sm w-full">
                  <TextInput
                    label="Account Number"
                    placeholder="Enter account number"
                    type="text"
                    value={watch("accountNumber") ?? ""}
                    onChange={(val) => setValue("accountNumber", val, { shouldValidate: true })}
                  />
                  {errors.accountNumber && (
                    <p className="text-destructive text-sm mt-1">{errors.accountNumber.message}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="max-w-sm w-full">
                  <TextInput
                    label="Password"
                    placeholder="Enter password"
                    type="password"
                    value={watch("password") ?? ""}
                    onChange={(val) => setValue("password", val, { shouldValidate: true })}
                  />
                  {errors.password && (
                    <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
                  )}
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