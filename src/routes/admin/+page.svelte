<script lang="ts">
    import LabQuotaInput from './LabQuotaInput.svelte';
</script>

<section class="space-y-4">
    <h1 class="h1">Set the quota for each laboratory for this draft process</h1>
    <form method="post">
        <div class="table-container my-4">
            <table class="table table-hover table-comfortable">
                <thead>
                    <tr>
                        <th>Laboratory</th>
                        <th class="w-2/5">Input Quota</th>
                    </tr>
                </thead>
                <tbody>
                    <LabQuotaInput name="ndsl">Networks and Distributed Systems Laboratory</LabQuotaInput>
                    <LabQuotaInput name="cvmig">Computer Vision & Machine Intelligence Laboratory</LabQuotaInput>
                    <LabQuotaInput name="s3">Service Science & Software Engineering Laboratory</LabQuotaInput>
                    <LabQuotaInput name="acl">Algorithms & Complexity Laboratory</LabQuotaInput>
                    <LabQuotaInput name="wsl">Web Science Laboratory</LabQuotaInput>
                    <LabQuotaInput name="csl">Computer Security Laboratory</LabQuotaInput>
                    <LabQuotaInput name="smsl">System Modelling and Simulation Laboratory</LabQuotaInput>
                    <LabQuotaInput name="scl">Scientific Computing Laboratory</LabQuotaInput>
                </tbody>
            </table>
        </div>

        <button type="submit" class="variant-filled btn"> Save Selection </button>
    </form>
</section>
