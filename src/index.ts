import { SessionStorage } from "@remix-run/server-runtime";
import { AuthenticateOptions, Strategy } from "remix-auth";

/**
 * This interface declares what the developer will receive from the strategy
 * to verify the user identity in their system.
 */
export interface TokenStrategyVerifyParams {
  token: string;
}

export class TokenStrategy<User> extends Strategy<
  User,
  TokenStrategyVerifyParams
> {
  name = "token";

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<User> {
    let url = new URL(request.url);
    let token: string | null = null;

    if (request.headers.has("Authorization")) {
      let parts = request.headers.get("Authorization")?.split(" ") ?? [];

      if (parts.length < 2) {
        return await this.failure(
          "Invalid Authorization header",
          request,
          sessionStorage,
          options
        );
      }
      let [scheme, credentials] = parts;

      if (/^Bearer$/i.test(scheme)) token = credentials;
    }

    if (request.body !== null) {
      let { access_token: accessToken } = await request.json();
      token = accessToken;
    }

    if (url.searchParams.has("access_token")) {
      token = url.searchParams.get("access_token") as string;
    }

    if (!token) {
      return await this.failure(
        "Missing authorization token",
        request,
        sessionStorage,
        options
      );
    }

    let user;
    try {
      user = await this.verify({ token });
      return await this.success(user, request, sessionStorage, options);
    } catch (error) {
      return await this.failure(
        (error as Error).message,
        request,
        sessionStorage,
        options
      );
    }
  }
}
