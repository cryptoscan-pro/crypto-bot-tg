import { StringSession } from 'telegram/sessions';
import { TelegramClient } from 'telegram';
import { api_id, api_hash } from './config';

async function getStringSession() {
  const client = new TelegramClient(new StringSession(), api_id, api_hash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await prompt('Please enter your phone number: '),
    password: async () => await prompt('Please enter your password: '),
    phoneCode: async () => await prompt('Please enter the code you received: '),
    onError: (err) => console.log(err),
  });

  const session = client.session.save();
  console.log('String session:', session);
  await client.disconnect();
}

async function prompt(message: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    readline.question(message, (answer: string) => {
      readline.close();
      resolve(answer);
    })
  );
}

getStringSession();
