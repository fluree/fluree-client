import { GenericContainer } from 'testcontainers';

async function getFlureeContainer(): Promise<GenericContainer> {
  const container = await new GenericContainer('fluree/server:latest')
    .withExposedPorts(8090)
    .withReuse();
  return container;
}

module.exports = async () => {
  const container = await getFlureeContainer();
  const testContainer = await container.start();
  await testContainer.stop();
};
