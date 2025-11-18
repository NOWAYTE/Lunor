import { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

interface ServerInputProps {
  servers: string[];
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  loading?: boolean;
  label?: string;
}

export function ServerInput({ servers, value, onChange, onSearch, loading = false, label = "Server" }: ServerInputProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = servers.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
    setFiltered(next);
  }, [value, servers]);

  useEffect(() => {}, [servers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="text-sm font-medium mb-1 text-gray-300 block">{label}</label>

      <DropdownMenu open={open && (loading || filtered.length > 0)} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 w-full cursor-text" onClick={() => setOpen(true)}>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setOpen(false);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search server name"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              className="flex-1 bg-[#1E1E1E] border-b border-gray-400 focus:border-white outline-none px-2 py-1"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearch();
                setOpen(true);
              }}
              disabled={loading}
              aria-busy={loading}
              className={`text-gray-400 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed`}
            >
            </button>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-full min-w-[16rem] bg-[#1E1E1E] text-gray-100 border border-gray-700"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {loading ? (
            <DropdownMenuItem className="text-gray-300">
              <span className="inline-block h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Searching...
            </DropdownMenuItem>
          ) : (
            <>
              {filtered.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {s}
                </DropdownMenuItem>
              ))}
              {filtered.length === 0 && (
                <DropdownMenuItem className="text-gray-400">No servers found</DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
