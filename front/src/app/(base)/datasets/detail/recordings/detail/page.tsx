"use client";
import { useSearchParams, notFound } from "next/navigation";

import Error from "@/app/error";
import Loading from "@/app/loading";
import RecordingDetail from "@/app/components/recordings/RecordingDetail";
import useRecording from "@/app/hooks/useRecording";

export default function Page() {
  const searchParams = useSearchParams();
  const recordingUUID = searchParams.get("recording_uuid") ?? "recording_uuid";
  const recording = useRecording({ uuid: recordingUUID });

  if (recordingUUID == null) {
    notFound();
  }

  if (recording.isLoading) {
    return <Loading />;
  }

  if (recording.isError || recording.data == null) {
    // @ts-ignore
    return <Error error={recording.error} />;
  }

  return <RecordingDetail recording={recording.data} />;
}
