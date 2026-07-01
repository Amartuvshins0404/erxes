import { IncomingHttpHeaders } from 'http';
import {
  userHeaderName,
  cpUserHeaderName,
  clientPortalHeaderName,
} from './user';
import { erxesSubdomainHeaderName } from './subdomain';

// Strip EVERY client-supplied identity header at the gateway edge so
// userMiddleware can only derive identity from a verified token, never a forged
// header. This must cover both staff identity (user/userid) AND client-portal
// identity (cpuser/clientportal) — otherwise an unauthenticated request can forge
// a `cpuser`/`clientportal` header and impersonate any portal customer, since the
// middleware only re-sets those inside the JWT-verified client-token branch and
// never defensively clears a forged value. userMiddleware re-sets all of these
// from validated tokens after this runs.
export function sanitizeHeaders(headers: IncomingHttpHeaders) {
  delete headers[erxesSubdomainHeaderName];
  delete headers[userHeaderName];
  delete headers['userid'];
  delete headers[cpUserHeaderName];
  delete headers[clientPortalHeaderName];
}
