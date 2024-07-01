<script lang="ts">
    import LabQuotaInput from './LabQuotaInput.svelte';
    import { enhance } from '$app/forms';
</script>

<section class="space-y-4">
    <h1 class="h1">Lab Quotas</h1>
    <form method="post" use:enhance>
        <div class="table-container my-4">
            <table class="table table-hover table-comfortable">
                <thead>
                    <tr>
                        <th>Laboratory</th>
                        <th class="w-2/5">Input Quota</th>
                    </tr>
                </thead>
                <tbody>
                    <LabQuotaInput name="acl">Algorithms &amp; Complexity Laboratory</LabQuotaInput>
                    <LabQuotaInput name="aclrl">Automata, Combinatorics, &amp; Logic Research Laboratory</LabQuotaInput>
                    <LabQuotaInput name="csl">Computer Security Laboratory</LabQuotaInput>
                    <LabQuotaInput name="cvmil">Computer Vision &amp; Machine Intelligence Laboratory</LabQuotaInput>
                    <LabQuotaInput name="ndsl">Networks &amp; Distributed Systems Laboratory</LabQuotaInput>
                    <LabQuotaInput name="scl">Scientific Computing Laboratory</LabQuotaInput>
                    <LabQuotaInput name="s3">Service Science &amp; Software Engineering Laboratory</LabQuotaInput>
                    <LabQuotaInput name="smsl">System Modelling &amp; Simulation Laboratory</LabQuotaInput>
                    <LabQuotaInput name="wsl">Web Science Laboratory</LabQuotaInput>
                </tbody>
            </table>
        </div>
        <!-- TODO: Set up form actions. -->
        <button type="submit" class="variant-filled btn">Save Selection</button>
    </form>
</section>
