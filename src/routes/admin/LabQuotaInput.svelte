<script lang="ts">
    // eslint-disable-next-line init-declarations
    export let name: string;
</script>

<tr>
    <td><slot /></td>
    <td><input 
            type="number" 
            required  
            min="0"
            {name} 
            placeholder="Quota" 
            class="input variant-form-material py-1 px-2"
        />
    </td>
</tr> 

