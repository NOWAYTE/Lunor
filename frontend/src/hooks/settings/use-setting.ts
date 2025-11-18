import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { brokerFormSchema, type BrokerFormValues } from "~/lib/validations/broker/broker";
import { toast } from "sonner";

export const useIntegration = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BrokerFormValues>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: {
      server: "",
      brokerName: "",
      platform: "",
      accountNumber: "",
      password: "",
    },
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values: BrokerFormValues) => {
    setLoading(true);
    const toastId = toast.loading("Connecting to broker...");

    try {
      const res = await fetch("/api/broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!data?.ok) {
        // Capture and log message + details per MetaAPI validation error format
        const message = data?.message || data?.friendly || data?.error || "Failed to connect";
        const details = data?.details;
        console.error("Broker connection failed:", { status: data?.status, error: data?.error, message, details });
        // Show toast with message; append short details if it's a string
        const detailsSuffix = typeof details === 'string' ? `: ${details}` : '';
        toast.error(`${message}${detailsSuffix}`, { id: toastId });
        setLoading(false);
        return;
      }

      const brokerId = data.brokerAccount.metaApiAccountId;
      toast.success("Connected. Initializing...", { id: toastId });

      let status = data.brokerAccount.status;
      const maxRetries = 10;
      let retries = 0;

      while (status === "INITIALIZING" && retries < maxRetries) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/broker/status/${brokerId}`);
        const statusData = await statusRes.json();
        status = statusData.status;
        retries++;
      }

      toast.success(`Final broker status: ${status}`, { id: toastId });
      console.log("Final broker status:", status);

      reset();
      closeModal();

    } catch (err: any) {
      console.error("Error submitting broker details:", err);
      toast.error(err?.message || "Error submitting broker details", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, (formErrors) => {
    // Invalid submission: show a toast so the user knows why nothing happens
    const firstKey = Object.keys(formErrors)[0] as keyof BrokerFormValues | undefined;
    const msg = firstKey && formErrors[firstKey]?.message ? String(formErrors[firstKey]?.message) : "Please fix the highlighted errors";
    toast.error(msg);
  });

  return {
    open,
    openModal,
    closeModal,
    register,
    handleSubmit,
    errors,
    reset,
    onSubmit,
    loading,
    setValue,
    watch,
  };
};
