import AnnotationContextBase from "@/lib/components/annotation/AnnotationContext";
import Loading from "@/lib/components/ui/Loading";
import Error from "@/app/error";
import type { AnnotationTask, Recording, Tag } from "@/lib/types";

import useStore from "@/app/store";
import useAnnotationTask from "@/app/hooks/api/useAnnotationTask";

export default function AnnotationContext({
  task,
  onTagClick,
}: {
  task: AnnotationTask;
  onTagClick?: (tag: Tag) => void;
}) {
  const tagColorFn = useStore((state) => state.getTagColor);

  const {
    clipAnnotation: { isLoading, isError, error, data: clipAnnotation },
  } = useAnnotationTask({
    uuid: task.uuid,
    annotationTask: task,
    withAnnotations: true,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError || clipAnnotation == null) {
    return <Error error={error || undefined} />;
  }

  return (
    <AnnotationContextBase
      recording={clipAnnotation.clip?.recording as Recording}
      onTagClick={onTagClick}
      tagColorFn={tagColorFn}
    />
  );
}
