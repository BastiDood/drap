<script>
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";

    if (browser) goto("/dashboard/drafts/regular/students");
</script>