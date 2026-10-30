import { ConfirmInvitationForm } from '@/auth/components/ConfirmInvitationForm';

const UserConfirmInvitationPage = () => {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <ConfirmInvitationForm />
    </div>
  );
};

export default UserConfirmInvitationPage;
