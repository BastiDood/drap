<script>
    import { AcademicCap, Beaker, ShieldExclamation } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
</script>

<h1 class="h1">Welcome to DRAP.</h1>
<p>Let's complete your registration. Are you a student, a laboratory head, or a draft administrator?</p>
<div class="logo-cloud grid-cols-1 gap-1 md:grid-cols-3">
    <a class="logo-item" href="/register/student/">
        <Icon src={AcademicCap} class="size-8" />
        <span>Student</span>
    </a>
    <a class="logo-item" href="/register/faculty/">
        <Icon src={Beaker} class="size-8" />
        <span>Laboratory Head</span>
    </a>
    <a class="logo-item" href="/register/admin/">
        <Icon src={ShieldExclamation} class="size-8" />
        <span>Administrator</span>
    </a>
</div>
