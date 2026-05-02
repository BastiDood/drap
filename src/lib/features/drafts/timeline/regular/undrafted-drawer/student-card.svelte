<script lang="ts" module>
  import type { Student } from '$lib/features/drafts/types';

  export interface Props {
    student: Student;
  }
</script>

<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';

  const { student }: Props = $props();
</script>

<article class="flex items-center gap-3 rounded-md border bg-card p-3">
  <Avatar.Root class="size-10">
    <Avatar.Image src={student.avatarUrl} alt="{student.givenName} {student.familyName}" />
  </Avatar.Root>
  <div class="min-w-0 grow">
    <p class="truncate font-medium">{student.familyName}, {student.givenName}</p>
    <p class="truncate text-xs text-muted-foreground">{student.email}</p>
  </div>
  {#if student.studentNumber !== null}
    <Badge variant="outline" class="font-mono text-xs">
      {student.studentNumber.toString()}
    </Badge>
  {/if}
</article>
