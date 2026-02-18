export type TPrompt = {
  name: string;
  reasons: Array<string>;
  details: {
    [key: string]: unknown;
  };
}

export type TParams = {
  client_id: string;
  code_challenge: string;
  code_challenge_method: string;
  prompt: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
}
