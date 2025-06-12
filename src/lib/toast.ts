import { getContext, setContext } from 'svelte';
import { createToaster } from '@skeletonlabs/skeleton-svelte';

const TOASTER = Symbol('skeleton.toaster');

export function initToaster() {
  return setContext(TOASTER, createToaster({ duration: 5000 }));
}

type Toaster = ReturnType<typeof createToaster>;

export function useToaster() {
  return getContext<Toaster>(TOASTER);
}
