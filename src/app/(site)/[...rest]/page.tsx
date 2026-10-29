import { permanentRedirect } from 'next/navigation';

// Unknown addresses go to the home page with a permanent redirect, like the old site.
export default function NotFoundRedirect() {
  permanentRedirect('/');
}
