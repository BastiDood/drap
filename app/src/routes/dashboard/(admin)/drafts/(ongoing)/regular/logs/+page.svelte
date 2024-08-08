<script lang="ts">
    export let data;

    let { choiceRecords } = data;
</script>

{#each choiceRecords as choice}
    <div>
        Round {choice.round ?? "+"} - {choice.created_at.toUTCString()}:
        {#if choice.student_email == null}
            {choice.lab_id.toUpperCase()} has auto-acknowledged or chosen no one for this round
        {:else}
            {choice.lab_id.toUpperCase()} has chosen {choice.student_email}
        {/if}
    </div>
{/each}

