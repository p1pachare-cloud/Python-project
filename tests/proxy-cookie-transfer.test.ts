import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { transferResponseCookies, type ResponseWithCookies, type CookieLike } from "../src/lib/auth/cookieTransfer.ts";

function createMockResponse(): ResponseWithCookies {
  const store = new Map<string, CookieLike>();
  return {
    cookies: {
      getAll: () => Array.from(store.values()),
      set: (cookie: CookieLike) => {
        store.set(cookie.name, cookie);
      },
    },
  };
}

describe("Proxy Cookie Deletion and Transfer on Redirect (ISSUE-H1)", () => {
  it("transfers deleted cookies to a redirect response with 1970 expiration", () => {
    // 1. Simulate source response where cookies were evicted on CONFIRMED_INVALID
    const sourceResponse = createMockResponse();
    // Simulate what response.cookies.delete({ name: "sb-access-token", path: "/" }) produces:
    sourceResponse.cookies.set({
      name: "sb-access-token",
      value: "",
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });

    // 2. Create destination redirect
    const redirectResponse = createMockResponse();

    // Prior to transfer: redirect has no cookies
    assert.equal(redirectResponse.cookies.getAll().length, 0);

    // 3. Transfer cookies
    transferResponseCookies(sourceResponse, redirectResponse);

    // 4. Assert cookie deletion is now present on the redirect response
    const transferred = redirectResponse.cookies.getAll();
    assert.equal(transferred.length, 1);
    assert.equal(transferred[0].name, "sb-access-token");
    assert.equal(transferred[0].value, "");
    assert.equal(transferred[0].path, "/");
    assert.equal(transferred[0].maxAge, 0);
  });

  it("transfers multiple deleted auth cookies without re-introducing old values", () => {
    const sourceResponse = createMockResponse();
    sourceResponse.cookies.set({
      name: "sb-refresh-token",
      value: "",
      maxAge: 0,
      path: "/",
    });
    sourceResponse.cookies.set({
      name: "sb-auth-token-code-verifier",
      value: "",
      maxAge: 0,
      path: "/",
    });

    const redirectResponse = createMockResponse();
    transferResponseCookies(sourceResponse, redirectResponse);

    const cookies = redirectResponse.cookies.getAll();
    assert.equal(cookies.length, 2);

    for (const c of cookies) {
      assert.equal(c.value, "");
      assert.equal(c.path, "/");
      assert.equal(c.maxAge, 0);
    }
  });

  it("preserves active session cookies during transient failures without deletion", () => {
    const sourceResponse = createMockResponse();
    sourceResponse.cookies.set({
      name: "sb-access-token",
      value: "valid-persisted-jwt",
      httpOnly: true,
      secure: true,
      path: "/",
    });

    const outageRedirect = createMockResponse();
    transferResponseCookies(sourceResponse, outageRedirect);

    const transferred = outageRedirect.cookies.getAll().find((c) => c.name === "sb-access-token");
    assert.ok(transferred, "Cookie must be transferred to outage redirect");
    assert.equal(transferred.value, "valid-persisted-jwt");
    assert.notEqual(transferred.value, "");
    assert.notEqual(transferred.maxAge, 0);
  });
});
