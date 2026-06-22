<script lang="ts">
  interface Props {
    date: Date;
  }

  const { date }: Props = $props();

  const dateTime = $derived(
    new Intl.DateTimeFormat(void 0, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
  );
</script>

<time datetime={date.toISOString()}>{dateTime}</time>
