<script>
    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        user: { family_name, given_name },
    } = data);
</script>

<h1 class="h1">Hello {family_name.toUpperCase()}, {given_name}</h1>
