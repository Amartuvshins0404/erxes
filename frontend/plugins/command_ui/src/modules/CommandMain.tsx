const COMMAND_URL = 'https://os-erxes.darjs.dev/';

export function CommandMain() {
  return (
    <iframe
      className="h-full min-h-0 w-full border-0"
      title="Command"
      src={COMMAND_URL}
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
