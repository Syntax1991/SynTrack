import { randomBytes, randomInt } from "node:crypto";
import { createHash } from "node:crypto";

/*
 * userCode and deviceCode are deliberately different security concerns:
 * userCode is short and human-typed/read (verification UI), deviceCode
 * is high-entropy and only ever handled by the desktop client for
 * polling - a leaked userCode alone must never be enough to poll or
 * receive a credential.
 */
const userCodeAlphabet =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomUserCodeGroup(
  length: number
): string {
  let result = "";

  for (
    let index = 0;
    index < length;
    index++
  ) {
    result +=
      userCodeAlphabet[
        randomInt(
          userCodeAlphabet.length
        )
      ];
  }

  return result;
}

export function generateUserCode(): string {
  return `${randomUserCodeGroup(4)}-${randomUserCodeGroup(4)}`;
}

export function generateDeviceCode(): string {
  return randomBytes(32).toString(
    "hex"
  );
}

const deviceTokenPrefix = "dvc_";

export function generateDeviceToken(): string {
  return `${deviceTokenPrefix}${randomBytes(32).toString("hex")}`;
}

export function hashSecret(
  secret: string
): string {
  return createHash("sha256")
    .update(secret)
    .digest("hex");
}
