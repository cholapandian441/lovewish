const crypto = require('crypto');

// Crockford-style base32 alphabet — excludes ambiguous chars (0/O, 1/I/L, U)
// so the reference is easy to read aloud / type and hard to mistype.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const PREFIX = 'LW-';
const TOKEN_LENGTH = 10; // 30^10 ≈ 5.9e14 combinations → infeasible to enumerate

/**
 * Generate a cryptographically-random, unguessable public order reference.
 * Uses rejection sampling on crypto.randomBytes for an unbiased pick from ALPHABET.
 * Example: "LW-7F3KQ9XP2M"
 */
function generateOrderNumber() {
  let token = '';
  while (token.length < TOKEN_LENGTH) {
    for (const byte of crypto.randomBytes(TOKEN_LENGTH)) {
      // Reject the small biased tail so every character is equally likely.
      if (byte >= ALPHABET.length * Math.floor(256 / ALPHABET.length)) continue;
      token += ALPHABET[byte % ALPHABET.length];
      if (token.length === TOKEN_LENGTH) break;
    }
  }
  return PREFIX + token;
}

/**
 * Insert with collision-retry. Given a function that attempts the insert with a
 * candidate order number and returns the new row id (throwing on UNIQUE clash),
 * retry with fresh tokens until it succeeds.
 */
function generateUniqueOrderNumber(existsFn, maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateOrderNumber();
    if (!existsFn(candidate)) return candidate;
  }
  throw new Error('Could not generate a unique order number.');
}

module.exports = { generateOrderNumber, generateUniqueOrderNumber };
