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
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Update filtered results when servers or search value changes
  useEffect(() => {
    const searchTerm = value.toLowerCase().trim();
    const next = searchTerm 
      ? servers.filter(s => s.toLowerCase().includes(searchTerm))
      : [...servers];
    setFiltered(next);
    
    // Auto-open dropdown when there are results
    if (next.length > 0) {
      setIsOpen(true);
    }
  }, [value, servers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      {label && (
        <label className="text-sm font-medium mb-1 text-gray-300 block">
          {label}
        </label>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                if (e.target.value.trim()) {
                  onSearch();
                }
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search server name"
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSearch();
                }
              }}
              className="flex-1 w-full bg-[#1E1E1E] border-b border-gray-400 focus:border-white outline-none px-2 py-1 pr-8"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearch();
                setIsOpen(true);
              }}
              disabled={loading || !value.trim()}
              aria-busy={loading}
              className={`absolute right-2 text-gray-400 hover:text-white transition-colors ${
                loading || !value.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'
              }`}
            >
              <FaSearch className="w-4 h-4" />
            </button>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-full max-h-60 overflow-y-auto bg-[#1E1E1E] text-gray-100 border border-gray-700 rounded-md shadow-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-400 flex items-center">
              <span className="inline-block h-4 w-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Searching...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((server) => (
              <DropdownMenuItem
                key={server}
                onSelect={() => {
                  onChange(server);
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-700 focus:bg-gray-700 outline-none"
              >
                {server}
              </DropdownMenuItem>
            ))
          ) : value.trim() ? (
            <div className="px-4 py-2 text-sm text-gray-400">
              No servers found
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-400">
              Type to search for servers
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
