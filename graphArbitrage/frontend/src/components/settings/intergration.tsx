"use client"
import { useIntegration } from "~/hooks/settings/use-setting";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"; // import your Dialog components
import { Input } from "../ui/input";

export default function Integration() {
  const { open, openModal, closeModal, register, onSubmit, errors, loading } = useIntegration();

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
          <div>
            <Button onClick={openModal}>Add Account</Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <Dialog open={open} onOpenChange={closeModal}>
  <DialogContent className="w-full max-w-md p-6 rounded-lg">
    <DialogHeader>
      <DialogTitle>Connect Broker Account</DialogTitle>
    </DialogHeader>

    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col">
        <Input {...register("brokerName")} placeholder="Broker Name" />
        {errors.brokerName && (
          <p className="text-destructive text-sm mt-1">{errors.brokerName.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <Input {...register("accountNumber")} placeholder="Account Number" />
        {errors.accountNumber && (
          <p className="text-destructive text-sm mt-1">{errors.accountNumber.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <Input {...register("server")} placeholder="Server" />
        {errors.server && (
          <p className="text-destructive text-sm mt-1">{errors.server.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <Input {...register("platform")} placeholder="Platform (MT4/MT5)" />
        {errors.platform && (
          <p className="text-destructive text-sm mt-1">{errors.platform.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <Input
          {...register("password")}
          placeholder="Password"
          type="password"
        />
        {errors.password && (
          <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <Input {...register("region")} placeholder="Region (e.g. London)" />
        {errors.region && (
          <p className="text-destructive text-sm mt-1">{errors.region.message}</p>
        )}
      </div>

      <Button type="submit" className="mt-4" disabled={loading}>
        {loading ? "Connecting..." : "Connect"}
      </Button>
    </form>
  </DialogContent>
</Dialog>

      )}
    </>
  );
}
