import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { brokerFormSchema, type BrokerFormValues } from "~/lib/validations/broker/broker";
import { onSubmitBrokerDetails } from "~/actions/settings";

export const useIntegration = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BrokerFormValues>({
    resolver: zodResolver(brokerFormSchema),
  });

  const onSubmit = handleSubmit(async (values: BrokerFormValues) => {
    setLoading(true);

    try {
      const res = await onSubmitBrokerDetails(values);

      if (!res?.success) {
        console.error("Broker connection failed:", res?.message);
        setLoading(false);
        return;
      }

      const brokerId = res.brokerAccount.metaApiAccountId;

      let status = res.brokerAccount.status;
      const maxRetries = 10;
      let retries = 0;

      while (status === "INITIALIZING" && retries < maxRetries) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/broker/status/${brokerId}`);
        const statusData = await statusRes.json();
        status = statusData.status;
        retries++;
      }

      console.log("Final broker status:", status);

      reset();
      closeModal();

    } catch (err: any) {
      console.error("Error submitting broker details:", err);
    } finally {
      setLoading(false);
    }
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
  };
};
