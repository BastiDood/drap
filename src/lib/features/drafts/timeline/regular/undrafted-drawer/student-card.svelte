<script lang="ts" module>
  import type { Student } from '$lib/features/drafts/types';

  export interface Props {
    student: Student;
  }
</script>

<script lang="ts">
  import UserlistItem from '$lib/components/userlist-item.svelte';

  const { student }: Props = $props();
</script>

<UserlistItem
  email={student.email}
  familyName={student.familyName}
  givenName={student.givenName}
  studentNumber={student.studentNumber}
  avatar={{
    variant: 'profile',
    url: student.avatarUrl,
    alt: `${student.givenName} ${student.familyName}`,
  }}
/>
