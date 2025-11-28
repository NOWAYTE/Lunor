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

  // FIX: Ensure 'MT4' is used for the default platform
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BrokerFormValues>({
    resolver: zodResolver(brokerFormSchema),
    defaultValues: {
      server: "",
      brokerName: "",
      platform: "MT4", // Default platform is necessary here
      accountNumber: "",
      password: "",
    },
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values: BrokerFormValues) => {
    setLoading(true);
    const toastId = toast.loading("Connecting to broker and provisioning server (This may take up to 90 seconds)..."); 

    try {
      console.log("Submitting form values:", values);
      
      const res = await fetch("/api/broker", {
        method: "POST", // This is the POST request for submission
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(values),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid response from server or server crashed.");
      }
      
      if (!res.ok || !data?.ok) {
        const message = data?.message || data?.error || `Failed to connect (Status: ${res.status})`;
        console.error("Broker connection failed:", { status: res.status, data });
        toast.error(message, { id: toastId });
        return;
      }

      const finalStatus = data.brokerAccount.status; 
      
      if (finalStatus === 'ACTIVE') {
        toast.success("Broker account successfully connected and is ACTIVE!", { id: toastId });
      } else {
        toast.error(`Provisioning returned unexpected status: ${finalStatus}`, { id: toastId });
      }

      console.log("Final broker status:", finalStatus);

      reset();
      closeModal();

    } catch (err: any) {
      console.error("Error submitting broker details:", err);
      toast.error(err?.message || "Error submitting broker details", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, (formErrors) => {
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
