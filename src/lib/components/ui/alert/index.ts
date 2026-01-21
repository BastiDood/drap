import Description from './alert-description.svelte';
import Root from './alert.svelte';
import Title from './alert-title.svelte';
export { alertVariants, type AlertVariant, type AlertBorder } from './alert.svelte';

export {
  Root,
  Description,
  Title,
  //
  Root as Alert,
  Description as AlertDescription,
  Title as AlertTitle,
};
