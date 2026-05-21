import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    localnetPort: number;
    faucetPort: number;
    suiToolsContainerId: string;
  }
}

const SUI_TOOLS_TAG =
  process.env.SUI_TOOLS_TAG ||
  (process.arch === 'arm64'
    ? '951cae315d8b252131836a331bcc16b89eb340d6-arm64'
    : '951cae315d8b252131836a331bcc16b89eb340d6');

export default async function setup(project: TestProject) {
  const containers: StartedTestContainer[] = [];

  console.log('Starting Sui localnet container...');
  const localnet = await new GenericContainer(
    `mysten/sui-tools:${SUI_TOOLS_TAG}`,
  )
    .withCommand(['sui', 'start', '--with-faucet', '--force-regenesis'])
    .withExposedPorts(9000, 9123)
    .withLogConsumer((stream) => {
      stream.on('data', (data) => {
        const msg = data.toString();
        if (
          msg.includes('error') ||
          msg.includes('Fullnode') ||
          msg.includes('faucet')
        ) {
          console.log(msg.trimEnd());
        }
      });
    })
    .start();
  containers.push(localnet);

  project.provide('localnetPort', localnet.getMappedPort(9000));
  project.provide('faucetPort', localnet.getMappedPort(9123));
  project.provide('suiToolsContainerId', localnet.getId());

  console.log(
    `Sui localnet ready: fullnode=${localnet.getMappedPort(9000)}, faucet=${localnet.getMappedPort(9123)}`,
  );

  return async () => {
    await Promise.allSettled(
      containers.reverse().map((container) => container.stop()),
    );
  };
}
