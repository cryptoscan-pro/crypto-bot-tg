import { StringSession } from 'telegram/sessions';
import { TelegramClient } from 'telegram';
import { api_id, api_hash } from './config';

async function getStringSession() {
  const client = new TelegramClient(new StringSession(), api_id, api_hash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await prompt('Пожалуйста, введите ваш номер телефона: '),
    password: async () => await prompt('Пожалуйста, введите ваш пароль: '),
    phoneCode: async () => await prompt('Пожалуйста, введите код, который вы получили: '),
    onError: (err) => console.log(err),
  });

  const session = client.session.save();
  console.log('Строковая сессия:', session);
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
