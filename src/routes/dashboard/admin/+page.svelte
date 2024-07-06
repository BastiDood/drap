<script lang="ts">
    import { enhance } from '$app/forms';

    // eslint-disable-next-line
    export let data;
    $: ({ labs } = data);
</script>

<section class="space-y-4">
    <h1 class="h1">Lab Quotas</h1>
    <form method="post" use:enhance>
        <div class="table-container my-4">
            <table class="table table-hover table-comfortable">
                <thead>
                    <tr>
                        <th>Laboratory</th>
                        <th class="w-2/5">Quota</th>
                    </tr>
                </thead>
                <tbody>
                    {#each labs as { lab_id, lab_name, quota } (lab_id)}
                        <tr>
                            <td class="!align-middle">{lab_name}</td>
                            <td
                                ><input
                                    type="number"
                                    required
                                    min="0"
                                    name={lab_id}
                                    value={quota}
                                    placeholder="Quota"
                                    class="input variant-form-material px-2 py-1"
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <!-- TODO: Set up form actions. -->
        <button type="submit" class="variant-filled-primary btn">Save Selection</button>
    </form>
</section>
