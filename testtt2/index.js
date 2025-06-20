import { generateEmailAlias, validateEmailAlias } from 'email-alias-core';

const config = {
  secretKey: 'a-very-secret-key-that-is-long-enough',
  domain: 'example.com',
};

// --- Generating an Alias ---

async function createAlias() {
  const alias = await generateEmailAlias({
    ...config,
    aliasParts: ['shop', 'amazon'],
  });
  console.log(alias);
  // Example output: shop-amazon-a1b2c3d4@example.com
  return alias;
}

// --- Validating an Alias ---

async function checkAlias(incomingAlias) {
  const isValid = await validateEmailAlias({
    ...config,
    fullAlias: incomingAlias,
  });

  if (isValid) {
    console.log(`'${incomingAlias}' is a legitimate alias.`);
  } else {
    console.log(`'${incomingAlias}' is NOT a valid alias. Rejecting email.`);
  }
}

async function main() {
  const alias = await createAlias();
  await checkAlias(alias);
  await checkAlias('shop-amazon-ffffffff@example.com');
}

main();
