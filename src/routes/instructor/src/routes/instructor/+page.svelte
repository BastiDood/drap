<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<div class="w-auto m-10">
    <h3 class="h3">Drag and Drop desired draftees for this draft round</h3>
    <div class = "grid grid-cols-5 w-auto my-6">
        <div class="col-span-2 border-primary-900-50-token">
            Div 1
        </div>
        <div class="col-span-1 border-secondary-900-50-token">
            Div 2
        </div>
        <div class="col-span-2 border-error-500-400-token">
            Div 3
        </div>
    </div>
</div>