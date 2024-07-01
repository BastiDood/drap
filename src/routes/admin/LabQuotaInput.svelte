<script lang="ts">
    export let name: string;
</script>

<tr>
    <td><slot /></td>
    <td><input 
            type="number" 
            required  
            min=0 
            placeholder="Quota" 
            class="input variant-form-material py-1 px-2"
        />
    </td>
</tr> 

