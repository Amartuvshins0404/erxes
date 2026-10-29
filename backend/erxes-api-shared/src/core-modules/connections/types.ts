export interface IResolvedConnection {
  _id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}
