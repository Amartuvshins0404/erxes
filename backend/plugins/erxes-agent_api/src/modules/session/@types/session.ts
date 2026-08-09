// A file attached to a user message. `url` is either a storage key (private
// files, read back via core's /read-file) or a full public URL.
export interface IMastraChatAttachment {
  url: string;
  name: string;
  type?: string;
  size?: number;
}
